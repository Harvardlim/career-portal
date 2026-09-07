-- "Invite Your HR Team" on the employer pricing page emails an invitation to
-- each of 3 HR addresses. Every sent invite is recorded here so the same
-- employer cannot invite the same email address twice -- the Send button in the
-- UI rejects a duplicate and asks for a different address.
-- Run in the Supabase SQL Editor, or via `supabase db push` once linked.

create table if not exists public.hr_invites (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.employers (id) on delete cascade,
  email text not null,
  message text,
  sent_at timestamptz not null default now()
);

-- One invite per (employer, email), case-insensitive.
create unique index if not exists hr_invites_employer_email_key
  on public.hr_invites (employer_id, lower(email));

alter table public.hr_invites enable row level security;

-- The edge function writes with the service role (bypasses RLS). Employers may
-- read their own invite history.
drop policy if exists "Employers read their own HR invites" on public.hr_invites;
create policy "Employers read their own HR invites"
  on public.hr_invites
  for select
  to authenticated
  using (
    employer_id in (select id from public.employers where user_id = auth.uid())
  );
