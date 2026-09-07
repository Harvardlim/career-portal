-- Candidate self-service profile editing (Dashboard > Settings).
-- Adds the profile fields the four Settings tabs edit, an UPDATE policy so a
-- signed-in candidate can save their own row, a resume list table, and an
-- avatars storage bucket.
-- Run in the Supabase SQL Editor, or via `supabase db push` once linked.

-- 1. New flat profile columns on candidates (all optional).
alter table public.candidates
  add column if not exists title text,
  add column if not exists personal_website text,
  add column if not exists avatar_path text,
  add column if not exists education text,
  add column if not exists nationality text,
  add column if not exists date_of_birth date,
  add column if not exists gender text,
  add column if not exists marital_status text,
  add column if not exists biography text,
  add column if not exists map_location text,
  add column if not exists social_links jsonb not null default '[]'::jsonb;

-- 2. Let a candidate update their own row. Insert/select policies already exist
--    (open insert; owner-only select from the auth_accounts migration).
drop policy if exists "Users can update their own candidate profile" on public.candidates;
create policy "Users can update their own candidate profile"
  on public.candidates
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. Resume list ("Your Cv/Resume"). The legacy single candidates.resume_path
--    column is left as-is (still written by registration, read by backoffice).
create table if not exists public.candidate_resumes (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

create index if not exists candidate_resumes_candidate_id_idx
  on public.candidate_resumes (candidate_id);

alter table public.candidate_resumes enable row level security;

drop policy if exists "Owners read their resume rows" on public.candidate_resumes;
create policy "Owners read their resume rows"
  on public.candidate_resumes
  for select
  to authenticated
  using (
    exists (
      select 1 from public.candidates c
      where c.id = candidate_resumes.candidate_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "Owners add their resume rows" on public.candidate_resumes;
create policy "Owners add their resume rows"
  on public.candidate_resumes
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.candidates c
      where c.id = candidate_resumes.candidate_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "Owners delete their resume rows" on public.candidate_resumes;
create policy "Owners delete their resume rows"
  on public.candidate_resumes
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.candidates c
      where c.id = candidate_resumes.candidate_id and c.user_id = auth.uid()
    )
  );

-- 4. Storage: owners can read/delete their own files in the private "resumes"
--    bucket (previously insert-only for the public + a staff read policy).
drop policy if exists "Owners read their resume files" on storage.objects;
create policy "Owners read their resume files"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'resumes' and owner = auth.uid());

drop policy if exists "Owners delete their resume files" on storage.objects;
create policy "Owners delete their resume files"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'resumes' and owner = auth.uid());

-- 5. Public "avatars" bucket for profile pictures.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Public read avatars" on storage.objects;
create policy "Public read avatars"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'avatars');

drop policy if exists "Users upload their avatar" on storage.objects;
create policy "Users upload their avatar"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'avatars' and owner = auth.uid());

drop policy if exists "Users update their avatar" on storage.objects;
create policy "Users update their avatar"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'avatars' and owner = auth.uid())
  with check (bucket_id = 'avatars' and owner = auth.uid());

drop policy if exists "Users delete their avatar" on storage.objects;
create policy "Users delete their avatar"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'avatars' and owner = auth.uid());
