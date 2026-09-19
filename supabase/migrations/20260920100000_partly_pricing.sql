-- partly.asia pricing catalog.
--
-- Every amount here is a FIXED price set per market -- nothing is live-converted
-- from USD at checkout. The USD figure is the forex-absorbed alternative the
-- expert may opt to pay instead; the local figure is charged exactly as listed.
--
-- Two products are priced per country:
--   * lead_fee   -- charged to an Expert once a Business releases contact
--   * badge_fee  -- optional annual "Verified" credential badge
-- and each has a fixed affiliate commission (~20% of the local price), stored
-- here rather than computed, so a fee change never silently moves commissions.
--
-- Figures are editable (the backoffice writes this table); the seed below is the
-- September 2026 reference set.

create table if not exists public.pricing_countries (
  code text primary key,                             -- ISO 3166-1 alpha-2
  name text not null,
  currency text not null,                            -- ISO 4217
  currency_symbol text not null,
  -- Stripe charges zero-decimal currencies (e.g. VND) in whole units, not cents.
  zero_decimal boolean not null default false,
  lead_fee_local numeric(14, 2) not null,
  lead_fee_usd numeric(10, 2) not null,
  badge_fee_local numeric(14, 2) not null,
  badge_fee_usd numeric(10, 2) not null,
  affiliate_lead_local numeric(14, 2) not null,
  affiliate_lead_usd numeric(10, 2) not null,
  affiliate_badge_local numeric(14, 2) not null,
  affiliate_badge_usd numeric(10, 2) not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.pricing_countries (
  code, name, currency, currency_symbol, zero_decimal,
  lead_fee_local, lead_fee_usd, badge_fee_local, badge_fee_usd,
  affiliate_lead_local, affiliate_lead_usd, affiliate_badge_local, affiliate_badge_usd,
  sort_order
) values
  ('SG', 'Singapore', 'SGD', 'S$',  false,     199,  145,     62, 44,     36, 28,     13, 10, 1),
  ('MY', 'Malaysia',  'MYR', 'RM',  false,     344,   68,    119, 27,     60, 14,     23,  5, 2),
  ('ID', 'Indonesia', 'IDR', 'Rp',  false,  999000,   53, 433000, 19, 160000,  8,  70000,  4, 3),
  ('TH', 'Thailand',  'THB', '฿',   false,    1999,   55,    990, 20,    380, 11,    178,  5, 4),
  ('VN', 'Vietnam',   'VND', '₫',   true,  1450000,   44, 599000, 17, 250000,  9, 100000,  5, 5)
on conflict (code) do update set
  name = excluded.name,
  currency = excluded.currency,
  currency_symbol = excluded.currency_symbol,
  zero_decimal = excluded.zero_decimal,
  lead_fee_local = excluded.lead_fee_local,
  lead_fee_usd = excluded.lead_fee_usd,
  badge_fee_local = excluded.badge_fee_local,
  badge_fee_usd = excluded.badge_fee_usd,
  affiliate_lead_local = excluded.affiliate_lead_local,
  affiliate_lead_usd = excluded.affiliate_lead_usd,
  affiliate_badge_local = excluded.affiliate_badge_local,
  affiliate_badge_usd = excluded.affiliate_badge_usd,
  sort_order = excluded.sort_order,
  updated_at = now();

alter table public.pricing_countries enable row level security;

-- The pricing page and the pay-to-unlock screen both read this publicly.
drop policy if exists "Anyone can read pricing" on public.pricing_countries;
create policy "Anyone can read pricing"
  on public.pricing_countries for select
  to anon, authenticated
  using (true);

-- Backoffice writes through the anon key, like the other staff-managed tables.
-- Tighten once backoffice sign-in moves to Supabase Auth.
drop policy if exists "Staff can write pricing" on public.pricing_countries;
create policy "Staff can write pricing"
  on public.pricing_countries for all
  to anon, authenticated
  using (true)
  with check (true);
