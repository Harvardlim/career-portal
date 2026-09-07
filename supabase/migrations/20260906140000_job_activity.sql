-- Candidate dashboard activity: the three list screens under /dashboard
-- (Applied Jobs, Favorite Jobs, Job Alerts) plus the Overview counters, which
-- until now rendered from web/src/data/dashboardJobs.ts fixtures.
--
-- All three tables are owned by the signed-in candidate: a row is visible and
-- writable only by the auth user whose id is on it. Employers additionally get
-- read access to applications made to their own jobs (for the employer
-- "Job Applications" screen). The backoffice keeps its open anon read, like the
-- other tables -- tighten once backoffice sign-in exists.

-- 1. Applications: one row per (job, candidate).
create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  resume_id uuid references public.candidate_resumes (id) on delete set null,
  cover_letter text,
  status text not null default 'active',   -- 'active' | 'shortlisted' | 'rejected' | 'hired'
  applied_at timestamptz not null default now(),
  constraint job_applications_job_candidate_key unique (job_id, candidate_id)
);

create index if not exists job_applications_candidate_id_idx
  on public.job_applications (candidate_id);
create index if not exists job_applications_job_id_idx
  on public.job_applications (job_id);

alter table public.job_applications enable row level security;

drop policy if exists "Candidates manage their own applications" on public.job_applications;
create policy "Candidates manage their own applications"
  on public.job_applications for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Employers read applications to their jobs" on public.job_applications;
create policy "Employers read applications to their jobs"
  on public.job_applications for select
  to authenticated
  using (
    job_id in (
      select j.id
      from public.jobs j
      join public.employers e on e.id = j.employer_id
      where e.user_id = auth.uid()
    )
  );

drop policy if exists "Staff read applications" on public.job_applications;
create policy "Staff read applications"
  on public.job_applications for select
  to anon, authenticated
  using (true);

-- 2. Saved / favorite jobs: one row per (job, candidate).
create table if not exists public.saved_jobs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint saved_jobs_job_candidate_key unique (job_id, candidate_id)
);

create index if not exists saved_jobs_candidate_id_idx
  on public.saved_jobs (candidate_id);

alter table public.saved_jobs enable row level security;

drop policy if exists "Candidates manage their own saved jobs" on public.saved_jobs;
create policy "Candidates manage their own saved jobs"
  on public.saved_jobs for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. Job alerts: saved searches shown on the Job Alerts screen.
create table if not exists public.job_alerts (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  keyword text,
  category text,
  location text,
  job_type text,
  frequency text not null default 'daily',  -- 'instant' | 'daily' | 'weekly'
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists job_alerts_candidate_id_idx
  on public.job_alerts (candidate_id);

alter table public.job_alerts enable row level security;

drop policy if exists "Candidates manage their own job alerts" on public.job_alerts;
create policy "Candidates manage their own job alerts"
  on public.job_alerts for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Staff read job alerts" on public.job_alerts;
create policy "Staff read job alerts"
  on public.job_alerts for select
  to anon, authenticated
  using (true);

-- 4. Membership: the Dashboard > Membership screen needs to show the candidate
--    their current plan. public.memberships already exists (20260903160000);
--    it only had an open anon read + open insert. Add an owner read so the
--    signed-in candidate can see their own subscription.
drop policy if exists "Candidates read their own membership" on public.memberships;
create policy "Candidates read their own membership"
  on public.memberships for select
  to authenticated
  using (
    candidate_id in (select id from public.candidates where user_id = auth.uid())
  );
