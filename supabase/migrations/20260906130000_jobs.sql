-- Jobs: the listing every other feature points at. Until now the public job
-- board, the employer "My Jobs" screen and the candidate dashboard all ran on
-- the hard-coded fixtures in web/src/data/*.ts -- nothing was persisted, so a
-- candidate could not really apply to, save, or get alerts about a job.
--
-- This table is the shared target for public.job_applications, public.saved_jobs
-- and public.job_alerts (added in 20260906121000_candidate_dashboard.sql).
--
-- Read is open to the anon/publishable key because the board is public. Writes
-- are scoped to the employer that owns the job (via public.employers.user_id).
-- The backoffice still reads through the anon key for now -- tighten to an
-- authenticated staff role once backoffice sign-in exists, same as the other
-- tables.

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid references public.employers (id) on delete set null,
  slug text not null,
  title text not null,
  company_name text not null,
  logo_bg text,                              -- parity with the CompanyLogo component
  light_logo boolean not null default false,
  location text,
  job_type text,                             -- 'Full Time' | 'Part Time' | 'Remote' | 'Contract Base' | ...
  category text,                             -- loosely mirrors public.categories.name
  role text,
  tags text[] not null default '{}',
  salary_min integer,
  salary_max integer,
  salary_type text,                          -- 'Monthly' | 'Yearly' | 'Hourly'
  salary_label text,                         -- pre-formatted "$30K-$35K" for display parity
  education text,
  experience text,
  job_level text,                            -- 'Entry Level' | 'Mid Level' | 'Expert Level'
  vacancies text,
  description text,
  responsibilities text,
  apply_method text not null default 'on_platform',  -- 'on_platform' | 'external' | 'email'
  apply_url text,
  apply_email text,
  featured boolean not null default false,
  status text not null default 'active',     -- 'active' | 'expired' | 'draft'
  posted_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint jobs_slug_key unique (slug)
);

create index if not exists jobs_status_idx on public.jobs (status);
create index if not exists jobs_employer_id_idx on public.jobs (employer_id);
create index if not exists jobs_category_idx on public.jobs (category);
create index if not exists jobs_posted_at_idx on public.jobs (posted_at desc);

alter table public.jobs enable row level security;

drop policy if exists "Anyone can read jobs" on public.jobs;
create policy "Anyone can read jobs"
  on public.jobs for select
  to anon, authenticated
  using (true);

drop policy if exists "Employers manage their own jobs" on public.jobs;
create policy "Employers manage their own jobs"
  on public.jobs for all
  to authenticated
  using (
    employer_id in (select id from public.employers where user_id = auth.uid())
  )
  with check (
    employer_id in (select id from public.employers where user_id = auth.uid())
  );
