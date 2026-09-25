-- Empty the Supabase Authentication > Users list, and wipe every Expert and
-- Business account, EVERY job posting, and everything tied to them.
--
-- NOT a migration -- run it by hand, once, in the Supabase SQL Editor
-- (Dashboard > SQL Editor), which runs as the postgres role and can delete
-- from auth.users. The backoffice does NOT use Supabase Auth: its admin logins
-- live in the separate public.admin table, so they are untouched (as are
-- pricing and categories). ALL jobs are deleted, admin-created ones included.
--
-- 1. Run PART 1 (select it, click Run). Read the counts.
-- 2. Run PART 2. It runs in a transaction and ends with COMMIT, so it DELETES
--    for real and permanently -- there is no undo. To preview instead, change
--    the last line to `rollback;` first.
--
-- Uploaded files (CVs, photos, ID / registration documents) are NOT removed by
-- SQL: Supabase blocks direct deletes on storage tables. Empty the buckets
-- `resumes`, `avatars` and `verification-docs` from Dashboard > Storage.

-- ===========================================================================
-- PART 1 -- what would be deleted (read-only)
-- ===========================================================================
select what, n from (
  select 1 as o, 'experts (candidates)' as what, count(*) as n from public.candidates
  union all select 2, 'businesses (employers)', count(*) from public.employers
  union all select 3, 'logins in Authentication > Users (ALL deleted)', count(*) from auth.users
  union all select 4, 'jobs / postings (ALL deleted)', count(*) from public.jobs
  union all select 5, 'applications', count(*) from public.job_applications
  union all select 6, 'contact releases', count(*) from public.contact_releases
  union all select 7, 'notifications', count(*) from public.notifications
  union all select 8, 'ratings', count(*) from public.ratings
  union all select 9, 'expert badges', count(*) from public.verified_badges
  union all select 10, 'business badges', count(*) from public.employer_verified_badges
  union all select 11, 'lead unlock payments', count(*) from public.lead_unlock_payments
  union all select 12, 'verification documents', count(*) from public.verification_documents
  union all select 13, 'affiliates', count(*) from public.affiliates
  union all select 15, 'backoffice admins (kept)', count(*) from public.admin
) t order by o;

-- ===========================================================================
-- PART 2 -- delete (transaction; COMMIT = apply, ROLLBACK = preview)
-- ===========================================================================
begin;

-- Every login in Authentication > Users.
create temp table _wipe_users on commit drop as
  select id from auth.users;

-- Every job (jobs.employer_id is ON DELETE SET NULL, so they would otherwise
-- survive as orphans). Cascades applications, matches, releases, saved jobs...
delete from public.jobs;

-- Reports about these people / their postings (reports.target_id is not a FK).
delete from public.reports
 where target_kind in ('candidate', 'employer')
   and target_id in (select id from public.candidates union select id from public.employers);

-- Referral rows pointing at the users being removed (referred_user_id is SET NULL).
delete from public.affiliate_referrals where referred_user_id in (select id from _wipe_users);

-- The logins (the whole Users list). Cascades to candidates / employers and everything hanging off
-- them (notifications, badges, payments, documents, affiliates, saved lists...).
delete from auth.users where id in (select id from _wipe_users);

-- Profiles with no login at all (registered before accounts existed).
delete from public.candidates;
delete from public.employers;

-- Result: everything below should be 0 except the backoffice admins.
select 'candidates left' as what, count(*) as n from public.candidates
union all select 'employers left', count(*) from public.employers
union all select 'applications left', count(*) from public.job_applications
union all select 'jobs left', count(*) from public.jobs
union all select 'contact releases left', count(*) from public.contact_releases
union all select 'notifications left', count(*) from public.notifications
union all select 'auth users left', count(*) from auth.users
union all select 'backoffice admins (unchanged)', count(*) from public.admin;

commit;   -- <- APPLIES the deletion permanently. Change to `rollback;` to preview only.
