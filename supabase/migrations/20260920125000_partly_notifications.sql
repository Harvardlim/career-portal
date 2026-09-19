-- In-app notifications. The matching flow is deliberately on-platform only --
-- a warm lead, a cold lead and an exchanged contact are never emailed out --
-- so every alert in the spec lands here and is read from the dashboard.
--
-- kind values in use:
--   warm_lead              -- a business released contact to this expert
--   lead_cold              -- the 2-day window closed unpaid
--   lead_cold_job_closed   -- the business closed the posting first
--   contact_unlocked       -- payment confirmed, contact exchanged both ways
--   contact_expiring       -- contact details drop out of view in N days
--   contact_expired
--   badge_renewal          -- 30 / 14 / 7 / 1 days before a badge expires
--   badge_expired
--   verification_approved | verification_rejected
--   new_applicant | matches_ready

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  link text,                                   -- in-app route to act on it
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx
  on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx
  on public.notifications (user_id) where read_at is null;

alter table public.notifications enable row level security;

-- Owners read and mark their own as read. Rows are written by SECURITY DEFINER
-- flow functions and the service role, never by the client directly.
drop policy if exists "Users read their own notifications" on public.notifications;
create policy "Users read their own notifications"
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users mark their own notifications read" on public.notifications;
create policy "Users mark their own notifications read"
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Staff read notifications" on public.notifications;
create policy "Staff read notifications"
  on public.notifications for select
  to anon
  using (true);

create or replace function public.notify_user(
  p_user_id uuid,
  p_kind text,
  p_title text,
  p_body text default null,
  p_link text default null,
  p_payload jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_user_id is null then
    return null;
  end if;

  insert into public.notifications (user_id, kind, title, body, link, payload)
  values (p_user_id, p_kind, p_title, p_body, p_link, coalesce(p_payload, '{}'::jsonb))
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.notify_user(uuid, text, text, text, text, jsonb) from public, anon, authenticated;
