-- Job Details page completeness:
--  * employers.founded  -- "Founded" year shown in the company panel; the
--    employer fills it on their Employer Profile.
--  * backfill jobs.expires_at for active jobs that were published before the
--    30-day live window was computed, so "Job Expires" isn't blank.
-- Run in the Supabase SQL Editor, or via `supabase db push` once linked.

alter table public.employers
  add column if not exists founded text;

update public.jobs
  set expires_at = coalesce(first_published_at, posted_at) + interval '30 days'
  where status = 'active'
    and expires_at is null
    and coalesce(first_published_at, posted_at) is not null;
