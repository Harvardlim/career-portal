-- partly.asia postings: a Business's "need", built on the existing public.jobs
-- table rather than a parallel one, so auth, the backoffice job screens and the
-- application flow keep working.
--
-- New here: the posting's project type and budget, its single main category
-- (with many sub-categories, via public.job_subcategories), and the lifecycle
-- the matching flow needs -- including the scarcity rule, where a posting whose
-- 10 matches were all passed over is flagged and never surfaces more candidates.

alter table public.jobs
  add column if not exists country text,                 -- where the work sits
  add column if not exists project_type text,            -- 'hourly'|'project'|'time_based'|'fractional'|'ongoing'
  add column if not exists project_duration text,        -- free text, e.g. '1 month'
  add column if not exists budget_min numeric(14, 2),
  add column if not exists budget_max numeric(14, 2),
  add column if not exists budget_currency text,         -- 'USD' or a local ISO 4217 code
  add column if not exists people_required integer not null default 1,
  add column if not exists skill_requirements text[] not null default '{}',
  add column if not exists main_category_id uuid references public.categories (id) on delete set null,
  -- Matching lifecycle, separate from jobs.status (active/draft/expired):
  --   open                 -- taking applications
  --   matched              -- the 10-candidate shortlist has been generated
  --   released             -- contact released to at least one expert
  --   no_further_matches   -- scarcity rule fired; this posting is done
  --   closed               -- business closed the posting
  add column if not exists matching_status text not null default 'open',
  add column if not exists matches_generated_at timestamptz,
  add column if not exists matches_viewed_at timestamptz,
  add column if not exists closed_at timestamptz;

create index if not exists jobs_matching_status_idx on public.jobs (matching_status);
create index if not exists jobs_country_idx on public.jobs (country);
create index if not exists jobs_main_category_id_idx on public.jobs (main_category_id);

-- A posting is tagged to exactly one main category (jobs.main_category_id) but
-- may carry several sub-categories.
create table if not exists public.job_subcategories (
  job_id uuid not null references public.jobs (id) on delete cascade,
  subcategory_id uuid not null references public.subcategories (id) on delete cascade,
  primary key (job_id, subcategory_id)
);

create index if not exists job_subcategories_subcategory_id_idx
  on public.job_subcategories (subcategory_id);

alter table public.job_subcategories enable row level security;

-- The open-needs feed is public, like the postings themselves.
drop policy if exists "Anyone can read job subcategories" on public.job_subcategories;
create policy "Anyone can read job subcategories"
  on public.job_subcategories for select
  to anon, authenticated
  using (true);

drop policy if exists "Businesses manage their own posting subcategories" on public.job_subcategories;
create policy "Businesses manage their own posting subcategories"
  on public.job_subcategories for all
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

drop policy if exists "Staff write job subcategories" on public.job_subcategories;
create policy "Staff write job subcategories"
  on public.job_subcategories for all
  to anon
  using (true)
  with check (true);
