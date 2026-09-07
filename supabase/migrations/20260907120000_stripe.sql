-- Stripe payments: employers buy job-posting CREDITS (one-time), candidates buy
-- a MEMBERSHIP term (one-time, no auto-renew). All money-in rows are now written
-- server-side by the `stripe-webhook` edge function using the service role, so
-- the permissive public INSERT policies from 20260903160000_finance.sql are
-- dropped here -- the checkout flow can no longer forge a paid purchase.
--
-- New:
--   * credit_purchases / memberships gain stripe_* reference columns + a
--     'pending' lifecycle (row created at checkout, flipped to 'paid'/'active'
--     by the webhook once Stripe confirms payment).
--   * employer_memberships: a paying-employer term, granted for free by the
--     first credit-package purchase. While it's active the employer sees the
--     discounted "add credits" repeat tiers instead of first-time pricing.

-- 1. Stripe reference columns -------------------------------------------------

alter table public.credit_purchases
  add column if not exists stripe_session_id text,
  add column if not exists stripe_payment_intent text,
  add column if not exists currency text not null default 'usd';

alter table public.memberships
  add column if not exists stripe_session_id text,
  add column if not exists stripe_payment_intent text,
  add column if not exists currency text not null default 'usd',
  add column if not exists expires_at timestamptz;

create unique index if not exists credit_purchases_stripe_session_id_key
  on public.credit_purchases (stripe_session_id)
  where stripe_session_id is not null;

create unique index if not exists memberships_stripe_session_id_key
  on public.memberships (stripe_session_id)
  where stripe_session_id is not null;

-- 2. Employer membership term ----------------------------------------------------

create table if not exists public.employer_memberships (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.employers (id) on delete cascade,
  status text not null default 'active',      -- 'active' | 'expired'
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  source_purchase_id uuid references public.credit_purchases (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists employer_memberships_employer_id_idx
  on public.employer_memberships (employer_id);
create index if not exists employer_memberships_active_idx
  on public.employer_memberships (employer_id, expires_at)
  where status = 'active';

alter table public.employer_memberships enable row level security;

-- Read is open (same stance as the rest of the finance schema: backoffice staff
-- auth isn't wired yet, and an employer needs to see their own term). Writes are
-- service-role only -- no policy for anon/authenticated.
drop policy if exists "Read employer memberships" on public.employer_memberships;
create policy "Read employer memberships" on public.employer_memberships
  for select to anon, authenticated using (true);

-- 3. Lock down money-in writes to the service role -----------------------------

drop policy if exists "Record a credit purchase" on public.credit_purchases;
drop policy if exists "Record a membership" on public.memberships;

-- 4. Helper view: an employer's current membership state ----------------------

create or replace view public.employer_membership_status
with (security_invoker = on) as
select
  e.id as employer_id,
  m.id as membership_id,
  coalesce(m.status = 'active' and m.expires_at > now(), false) as is_active,
  m.started_at,
  m.expires_at
from public.employers e
left join lateral (
  select id, status, started_at, expires_at
  from public.employer_memberships
  where employer_id = e.id and status = 'active' and expires_at > now()
  order by expires_at desc
  limit 1
) m on true;

grant select on public.employer_membership_status to anon, authenticated;
