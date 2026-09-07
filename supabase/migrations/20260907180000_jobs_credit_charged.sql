-- Job posting = 1 credit, live for 30 days.
--
--   credit_charged      -- has this job ever consumed a credit? Publishing a
--                          brand-new/never-charged job costs 1; toggling an
--                          already-charged job draft<->published is free.
--   first_published_at   -- the first time this job went live. The 30-day
--                          window is anchored here and never resets, even if
--                          the job is moved back to draft and re-published.
--
-- Extending a job adds 30 days to expires_at and costs another credit.
-- Run in the Supabase SQL Editor, or via `supabase db push` once linked.

alter table public.jobs
  add column if not exists credit_charged boolean not null default false,
  add column if not exists first_published_at timestamptz;

-- Everything already live predates this gate: treat as paid, and anchor its
-- 30-day window to the best timestamp we have.
update public.jobs
  set credit_charged = true,
      first_published_at = coalesce(first_published_at, posted_at, created_at)
  where status = 'active';
