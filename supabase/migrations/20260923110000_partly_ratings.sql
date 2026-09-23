-- Mutual ratings: once a released contact is unlocked (i.e. a real, paid
-- engagement happened), either side may rate the other -- 1-5 stars plus an
-- optional comment. Ratings are not gated on the off-platform engagement
-- actually completing (we have no visibility into that); the gate is simply
-- "did a paid Unlock happen for this posting", which is the strongest signal
-- we have that the two parties actually connected.
--
-- One rating per (release, rater side): a business rates once per released
-- lead, an expert rates once per released lead, and either may update their
-- own rating later (e.g. after the engagement concludes) rather than filing a
-- second one.

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.contact_releases (id) on delete cascade,
  rater_kind text not null,                 -- 'candidate' | 'employer'
  rater_user_id uuid not null references auth.users (id) on delete cascade,
  ratee_kind text not null,                 -- the other side
  ratee_id uuid not null,                   -- candidates.id or employers.id being rated
  stars smallint not null check (stars between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ratings_release_rater_key unique (release_id, rater_kind)
);

create index if not exists ratings_ratee_idx on public.ratings (ratee_kind, ratee_id);

alter table public.ratings enable row level security;

-- All writes go through submit_rating() (SECURITY DEFINER) below, which
-- validates the release actually happened and who the caller is -- there is
-- deliberately no direct insert/update policy for anon/authenticated.
drop policy if exists "Anyone can read ratings" on public.ratings;
create policy "Anyone can read ratings"
  on public.ratings for select
  to anon, authenticated
  using (true);

drop policy if exists "Staff moderate ratings" on public.ratings;
create policy "Staff moderate ratings"
  on public.ratings for delete
  to anon
  using (true);

create or replace view public.candidate_rating_summary as
select ratee_id as candidate_id, count(*) as rating_count, round(avg(stars)::numeric, 2) as avg_stars
from public.ratings
where ratee_kind = 'candidate'
group by ratee_id;

grant select on public.candidate_rating_summary to anon, authenticated;

create or replace view public.employer_rating_summary as
select ratee_id as employer_id, count(*) as rating_count, round(avg(stars)::numeric, 2) as avg_stars
from public.ratings
where ratee_kind = 'employer'
group by ratee_id;

grant select on public.employer_rating_summary to anon, authenticated;

-- Submits or updates the caller's own rating for a release they were part of.
-- p_stars 1-5, p_comment optional. Returns the rating id.
create or replace function public.submit_rating(
  p_release_id uuid,
  p_stars smallint,
  p_comment text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_release public.contact_releases;
  v_rater_kind text;
  v_ratee_kind text;
  v_ratee_id uuid;
  v_id uuid;
begin
  if p_stars < 1 or p_stars > 5 then
    raise exception 'stars must be between 1 and 5';
  end if;

  select * into v_release from public.contact_releases where id = p_release_id;
  if not found then
    raise exception 'release not found';
  end if;
  if v_release.status <> 'paid' then
    raise exception 'contact was never unlocked for this release';
  end if;

  if exists (select 1 from public.candidates where id = v_release.candidate_id and user_id = auth.uid()) then
    v_rater_kind := 'candidate';
    v_ratee_kind := 'employer';
    v_ratee_id := v_release.employer_id;
  elsif exists (select 1 from public.employers where id = v_release.employer_id and user_id = auth.uid()) then
    v_rater_kind := 'employer';
    v_ratee_kind := 'candidate';
    v_ratee_id := v_release.candidate_id;
  else
    raise exception 'not a party to this release';
  end if;

  insert into public.ratings (release_id, rater_kind, rater_user_id, ratee_kind, ratee_id, stars, comment)
  values (p_release_id, v_rater_kind, auth.uid(), v_ratee_kind, v_ratee_id, p_stars, nullif(trim(p_comment), ''))
  on conflict (release_id, rater_kind)
  do update set stars = excluded.stars, comment = excluded.comment, updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.submit_rating(uuid, smallint, text) to authenticated;

-- Surface rating summaries on the two Expert-facing card/profile views so the
-- app doesn't need a second query per card.
create or replace view public.match_candidate_cards as
select
  m.id as match_id,
  m.job_id,
  m.rank,
  m.score,
  c.id as candidate_id,
  c.full_name,
  c.headline,
  c.title,
  c.avatar_path,
  c.years_experience,
  c.expertise_field,
  c.country_code,
  c.identity_verified,
  (c.verified_badge_until > now()) as badge_verified,
  c.public_slug,
  r.id as release_id,
  r.status as release_status,
  r.window_expires_at,
  r.paid_at,
  -- New columns must be appended at the end: CREATE OR REPLACE VIEW cannot
  -- reorder or insert among existing columns, only add past the last one.
  coalesce(rs.rating_count, 0) as rating_count,
  rs.avg_stars
from public.posting_matches m
join public.candidates c on c.id = m.candidate_id
join public.jobs j on j.id = m.job_id
join public.employers e on e.id = j.employer_id
left join public.contact_releases r on r.job_id = m.job_id and r.candidate_id = m.candidate_id
left join public.candidate_rating_summary rs on rs.candidate_id = c.id
where e.user_id = auth.uid();

grant select on public.match_candidate_cards to authenticated;

create or replace view public.expert_public_profiles as
select
  c.id as candidate_id,
  c.public_slug,
  c.full_name,
  c.headline,
  c.title,
  c.avatar_path,
  c.biography,
  c.years_experience,
  c.expertise_field,
  c.country_code,
  c.portfolio_links,
  c.identity_verified,
  (c.verified_badge_until > now()) as badge_verified,
  c.created_at,
  coalesce(rs.rating_count, 0) as rating_count,
  rs.avg_stars
from public.candidates c
left join public.candidate_rating_summary rs on rs.candidate_id = c.id
where c.public_slug is not null;

grant select on public.expert_public_profiles to anon, authenticated;

-- The business's info shown to an expert once contact is unlocked -- adds the
-- business's own rating summary so the expert can see who they're dealing with.
create or replace view public.expert_lead_contacts as
select
  r.id as release_id,
  r.job_id,
  j.title as posting_title,
  e.company_name,
  e.business_email,
  e.phone,
  e.website,
  e.location,
  r.paid_at,
  r.contact_expires_at,
  coalesce(rs.rating_count, 0) as employer_rating_count,
  rs.avg_stars as employer_avg_stars
from public.contact_releases r
join public.jobs j on j.id = r.job_id
join public.employers e on e.id = r.employer_id
join public.candidates c on c.id = r.candidate_id
left join public.employer_rating_summary rs on rs.employer_id = e.id
where r.status = 'paid'
  and r.contact_expires_at > now()
  and c.user_id = auth.uid();

grant select on public.expert_lead_contacts to authenticated;

-- Same idea for the business's view of an unlocked expert: adds the expert's
-- own rating summary, and this is also where the "rate this expert" action
-- (candidate_id + release_id) reads from.
create or replace view public.business_lead_contacts as
select
  r.id as release_id,
  r.job_id,
  j.title as posting_title,
  c.id as candidate_id,
  c.full_name,
  c.headline,
  c.email,
  c.contact_number,
  c.linkedin_url,
  (c.verified_badge_until > now()) as badge_verified,
  r.paid_at,
  r.contact_expires_at,
  coalesce(rs.rating_count, 0) as candidate_rating_count,
  rs.avg_stars as candidate_avg_stars
from public.contact_releases r
join public.jobs j on j.id = r.job_id
join public.candidates c on c.id = r.candidate_id
join public.employers e on e.id = r.employer_id
left join public.candidate_rating_summary rs on rs.candidate_id = c.id
where r.status = 'paid'
  and r.contact_expires_at > now()
  and e.user_id = auth.uid();

grant select on public.business_lead_contacts to authenticated;
