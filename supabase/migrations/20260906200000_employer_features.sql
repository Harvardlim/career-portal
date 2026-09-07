-- Employer dashboard features: a fuller company profile, a saved-candidates
-- list, and letting an employer move applicants between status columns.
-- Additive. Run in the Supabase SQL Editor or via `supabase db push`.

-- 1. Company profile fields (the "Employers Profile" flow, dashboard, and the
--    public Browse Employers page all read these).
alter table public.employers
  add column if not exists logo_url text,
  add column if not exists about text,
  add column if not exists website text,
  add column if not exists industry text,
  add column if not exists size text,
  add column if not exists location text,
  add column if not exists phone text;

-- 2. Let an employer update their own row (previously insert + own-select only).
drop policy if exists "Users can update their own employer profile" on public.employers;
create policy "Users can update their own employer profile"
  on public.employers
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. Let an employer update applications made to their own jobs (New /
--    Shortlisted / Rejected / Hired). Read policy already exists.
drop policy if exists "Employers update applications to their jobs" on public.job_applications;
create policy "Employers update applications to their jobs"
  on public.job_applications
  for update
  to authenticated
  using (
    job_id in (
      select j.id from public.jobs j
      join public.employers e on e.id = j.employer_id
      where e.user_id = auth.uid()
    )
  )
  with check (
    job_id in (
      select j.id from public.jobs j
      join public.employers e on e.id = j.employer_id
      where e.user_id = auth.uid()
    )
  );

-- 4. Saved candidates: one row per (employer, candidate).
create table if not exists public.saved_candidates (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.employers (id) on delete cascade,
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint saved_candidates_pair_key unique (employer_id, candidate_id)
);

create index if not exists saved_candidates_employer_id_idx
  on public.saved_candidates (employer_id);

alter table public.saved_candidates enable row level security;

drop policy if exists "Employers manage their own saved candidates" on public.saved_candidates;
create policy "Employers manage their own saved candidates"
  on public.saved_candidates
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
