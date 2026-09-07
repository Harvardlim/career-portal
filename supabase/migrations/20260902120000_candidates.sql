-- Candidate registration: profile table + resume storage bucket.
-- Run this once in the Supabase SQL Editor (or via `supabase db push` once the
-- project is linked). The web app's anon/publishable key can only INSERT here
-- by design -- reading candidate data back requires a service role or an
-- authenticated staff policy, which isn't set up yet.

create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  resume_path text not null,
  past_experience text,
  years_experience text,
  expertise_field text not null,
  contact_number text not null,
  email text not null,
  interests text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.candidates enable row level security;

create policy "Anyone can submit a candidate registration"
  on public.candidates
  for insert
  to anon, authenticated
  with check (true);

-- Resume uploads. Bucket is private: only inserts are allowed from the
-- client, so a submitted resume can't be listed or downloaded via the
-- publishable key.
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

create policy "Anyone can upload a resume"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'resumes');
