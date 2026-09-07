-- Employer registration: company profile submitted via the public
-- "Employers" sign-up flow. Same shape as candidates -- the client's
-- anon/publishable key can only INSERT; reading it back needs a service
-- role or an authenticated staff policy, which isn't set up yet.

create table if not exists public.employers (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  reg_no text not null,
  field text not null,
  business_email text not null,
  business_details text not null,
  looking_for text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.employers enable row level security;

create policy "Anyone can submit an employer registration"
  on public.employers
  for insert
  to anon, authenticated
  with check (true);
