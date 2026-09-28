-- "Report an issue": a floating button shown to every signed-in user on the
-- web app. Distinct from public.reports, which flags a specific posting,
-- business or expert -- this is feedback about the product itself (a bug, a
-- confusing screen, a payment problem).
--
-- Only signed-in users can file one, and only as themselves. Staff triage in
-- the backoffice, which reads/updates through the anon key like the other
-- backoffice tables until it moves to Supabase Auth.

create table if not exists public.issue_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  user_email text,
  user_role text,                              -- 'expert' | 'business' | null (neither profile yet)
  category text not null default 'other',      -- 'bug' | 'payment' | 'account' | 'suggestion' | 'other'
  message text not null,
  page_url text,
  user_agent text,
  status text not null default 'open',         -- 'open' | 'in_progress' | 'resolved'
  staff_note text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint issue_reports_message_len check (char_length(btrim(message)) between 5 and 4000),
  constraint issue_reports_category_chk check (category in ('bug', 'payment', 'account', 'suggestion', 'other')),
  constraint issue_reports_status_chk check (status in ('open', 'in_progress', 'resolved'))
);

create index if not exists issue_reports_status_idx on public.issue_reports (status, created_at desc);
create index if not exists issue_reports_user_idx on public.issue_reports (user_id);

alter table public.issue_reports enable row level security;

drop policy if exists "Signed-in users file issues" on public.issue_reports;
create policy "Signed-in users file issues"
  on public.issue_reports for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users read own issues" on public.issue_reports;
create policy "Users read own issues"
  on public.issue_reports for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Staff read issues" on public.issue_reports;
create policy "Staff read issues"
  on public.issue_reports for select
  to anon
  using (true);

drop policy if exists "Staff update issues" on public.issue_reports;
create policy "Staff update issues"
  on public.issue_reports for update
  to anon
  using (true)
  with check (true);
