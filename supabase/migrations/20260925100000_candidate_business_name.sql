-- Experts may give the name of the business they operate under (a sole
-- proprietorship, their consultancy, etc.). Optional -- an independent expert
-- simply leaves it blank. Shown to businesses on match cards and applicant
-- profiles and on the public "Hire me" page; never used for matching.

alter table public.candidates
  add column if not exists business_name text;

-- The three contact-free projections of an expert. CREATE OR REPLACE VIEW can
-- only append columns, so business_name goes at the very end of each.

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
  coalesce(rs.rating_count, 0) as rating_count,
  rs.avg_stars,
  c.business_name
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
  rs.avg_stars,
  c.business_name
from public.candidates c
left join public.candidate_rating_summary rs on rs.candidate_id = c.id
where c.public_slug is not null;

grant select on public.expert_public_profiles to anon, authenticated;

create or replace view public.applicant_profiles as
select
  a.id as application_id,
  a.job_id,
  j.title as job_title,
  a.status,
  a.applied_at,
  a.cover_letter,
  c.id as candidate_id,
  c.full_name,
  c.headline,
  c.title,
  c.avatar_path,
  c.biography,
  c.past_experience,
  c.years_experience,
  c.education,
  c.nationality,
  c.expertise_field,
  coalesce((
    select array_agg(s.name order by s.name)
    from public.candidate_subcategories cs
    join public.subcategories s on s.id = cs.subcategory_id
    where cs.candidate_id = c.id
  ), '{}'::text[]) as subcategories,
  c.country_code,
  c.portfolio_links,
  c.public_slug,
  c.identity_verified,
  (c.verified_badge_until > now()) as badge_verified,
  coalesce(rs.rating_count, 0) as rating_count,
  rs.avg_stars,
  r.id as release_id,
  r.status as release_status,
  c.business_name
from public.job_applications a
join public.jobs j on j.id = a.job_id
join public.employers e on e.id = j.employer_id
join public.candidates c on c.id = a.candidate_id
left join public.candidate_rating_summary rs on rs.candidate_id = c.id
left join public.contact_releases r on r.job_id = a.job_id and r.candidate_id = a.candidate_id
where e.user_id = auth.uid();

grant select on public.applicant_profiles to authenticated;
