-- Two contact-free projections of an Expert's profile.
--
--   match_candidate_cards   -- what a Business sees on its "Your 10 matches"
--                              screen: photo, headline, experience, badge --
--                              never email or phone, which only a paid unlock
--                              reveals (business_lead_contacts).
--   expert_public_profiles  -- the public page a "Hire me on partly.asia" badge
--                              links to.
--
-- Both run as owner and scope themselves, so the app never has to read the
-- candidates table directly for these screens.

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
  r.paid_at
from public.posting_matches m
join public.candidates c on c.id = m.candidate_id
join public.jobs j on j.id = m.job_id
join public.employers e on e.id = j.employer_id
left join public.contact_releases r on r.job_id = m.job_id and r.candidate_id = m.candidate_id
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
  c.created_at
from public.candidates c
where c.public_slug is not null;

grant select on public.expert_public_profiles to anon, authenticated;
