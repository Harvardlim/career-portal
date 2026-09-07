-- Affiliate attribution + commission ledger.
--
-- Commission rules (enforced by WHEN a row is created, not by a trigger):
--   1. The referrer must have enrolled in the affiliate program -- a referral is
--      only recorded when the ?ref= code resolves to a public.affiliates row.
--   2. The referred person does NOT need to be registered when they click the
--      link; the code is stored client-side and consumed at registration, so
--      the referrer still earns once that person signs up and later buys.
--   3. If the referred person was ALREADY registered (or the referrer had not
--      enrolled yet), no row is created at their registration, so no commission
--      is ever due.
--
-- One row per referred user; the commission fields are filled by the Stripe
-- fulfilment path on that user's first qualifying purchase.
-- Run in the Supabase SQL Editor, or via `supabase db push` once linked.

create table if not exists public.affiliate_referrals (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates (id) on delete cascade,
  referred_user_id uuid not null unique references auth.users (id) on delete cascade,
  referred_role text not null,                          -- 'candidate' | 'employer'
  referred_at timestamptz not null default now(),
  purchase_source text,                                 -- 'credits' | 'membership'
  purchase_ref text,                                    -- package / plan label
  commission_usd numeric(10,2),
  commission_status text not null default 'pending',    -- 'pending' | 'earned'
  earned_at timestamptz
);

create index if not exists affiliate_referrals_affiliate_id_idx
  on public.affiliate_referrals (affiliate_id);

alter table public.affiliate_referrals enable row level security;

-- Email confirmation is on, so a just-registered user has no session yet; the
-- attribution is written with an open insert, exactly like candidates/employers.
drop policy if exists "Record a referral at signup" on public.affiliate_referrals;
create policy "Record a referral at signup"
  on public.affiliate_referrals
  for insert
  to anon, authenticated
  with check (true);

-- An enrolled affiliate can see the people they referred and what they earned.
drop policy if exists "Affiliates read their own referrals" on public.affiliate_referrals;
create policy "Affiliates read their own referrals"
  on public.affiliate_referrals
  for select
  to authenticated
  using (
    affiliate_id in (select id from public.affiliates where user_id = auth.uid())
  );

-- Open read for the backoffice, matching the other activity tables.
drop policy if exists "Staff read affiliate referrals" on public.affiliate_referrals;
create policy "Staff read affiliate referrals"
  on public.affiliate_referrals
  for select
  to anon, authenticated
  using (true);
