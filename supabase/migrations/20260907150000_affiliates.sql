-- Affiliate program. A signed-in user joins from the "Become an Affiliate"
-- button on /affiliate; that creates one row here with a unique referral code
-- they can share. Commission tracking/payouts are out of scope for now.
-- Run in the Supabase SQL Editor, or via `supabase db push` once linked.

create table if not exists public.affiliates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  referral_code text not null unique,
  joined_at timestamptz not null default now()
);

alter table public.affiliates enable row level security;

drop policy if exists "Users manage their own affiliate row" on public.affiliates;
create policy "Users manage their own affiliate row"
  on public.affiliates
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Open read for the backoffice (matches the other activity tables) -- tighten
-- once backoffice sign-in exists.
drop policy if exists "Staff read affiliates" on public.affiliates;
create policy "Staff read affiliates"
  on public.affiliates
  for select
  to anon, authenticated
  using (true);
