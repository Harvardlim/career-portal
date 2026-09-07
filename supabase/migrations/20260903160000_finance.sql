-- Finance: money in and credit balances, so the backoffice can see who
-- purchased and how many credits each employer has left.
--
-- Model mirrors the web pricing flows:
--   * Employers buy CREDIT PACKAGES to post jobs (1 job post = 1 credit).
--     credit_purchases = money in; credit_usage = credits spent.
--   * Candidates buy MEMBERSHIPS (Monthly / Yearly) -- a flat subscription,
--     no credits.
--
-- Auth for the backoffice isn't wired up yet, so read is open to the
-- anon/publishable key -- tighten to an authenticated staff role once
-- backoffice sign-in exists. INSERT is left open too so the public checkout
-- flow can record a purchase; move that to a server/edge function later.

create table if not exists public.credit_purchases (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.employers (id) on delete cascade,
  package text not null,                 -- 'Standard', 'Referral', '1st repeat purchase', ...
  amount_usd numeric(10, 2) not null default 0,
  credits integer not null default 0,    -- credits granted by this purchase
  status text not null default 'paid',   -- 'paid' | 'pending' | 'refunded'
  created_at timestamptz not null default now()
);
create index if not exists credit_purchases_employer_id_idx
  on public.credit_purchases (employer_id);

create table if not exists public.credit_usage (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.employers (id) on delete cascade,
  credits integer not null default 1,    -- credits spent (job post = 1)
  reason text,                           -- 'Job post: Senior Designer', ...
  created_at timestamptz not null default now()
);
create index if not exists credit_usage_employer_id_idx
  on public.credit_usage (employer_id);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  plan text not null,                    -- 'Member — Monthly' | 'Member — Yearly'
  amount_usd numeric(10, 2) not null default 0,
  period text,                           -- 'month' | 'year'
  status text not null default 'active', -- 'active' | 'cancelled' | 'expired'
  started_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists memberships_candidate_id_idx
  on public.memberships (candidate_id);

-- Per-employer credit balance: paid credits minus credits spent.
create or replace view public.employer_credit_balances
with (security_invoker = on) as
select
  e.id as employer_id,
  e.company_name,
  e.business_email,
  coalesce(p.purchased, 0) as credits_purchased,
  coalesce(u.used, 0) as credits_used,
  coalesce(p.purchased, 0) - coalesce(u.used, 0) as credits_left,
  coalesce(p.spent_usd, 0) as total_spent_usd,
  p.last_purchase_at
from public.employers e
left join (
  select
    employer_id,
    sum(credits) filter (where status = 'paid') as purchased,
    sum(amount_usd) filter (where status = 'paid') as spent_usd,
    max(created_at) as last_purchase_at
  from public.credit_purchases
  group by employer_id
) p on p.employer_id = e.id
left join (
  select employer_id, sum(credits) as used
  from public.credit_usage
  group by employer_id
) u on u.employer_id = e.id;

grant select on public.employer_credit_balances to anon, authenticated;

alter table public.credit_purchases enable row level security;
alter table public.credit_usage enable row level security;
alter table public.memberships enable row level security;

drop policy if exists "Staff can read credit purchases" on public.credit_purchases;
create policy "Staff can read credit purchases" on public.credit_purchases
  for select to anon, authenticated using (true);
drop policy if exists "Record a credit purchase" on public.credit_purchases;
create policy "Record a credit purchase" on public.credit_purchases
  for insert to anon, authenticated with check (true);

drop policy if exists "Staff can read credit usage" on public.credit_usage;
create policy "Staff can read credit usage" on public.credit_usage
  for select to anon, authenticated using (true);
drop policy if exists "Record credit usage" on public.credit_usage;
create policy "Record credit usage" on public.credit_usage
  for insert to anon, authenticated with check (true);

drop policy if exists "Staff can read memberships" on public.memberships;
create policy "Staff can read memberships" on public.memberships
  for select to anon, authenticated using (true);
drop policy if exists "Record a membership" on public.memberships;
create policy "Record a membership" on public.memberships
  for insert to anon, authenticated with check (true);
