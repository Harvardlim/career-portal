-- Affiliate commissions for the two qualifying paid events.
--
--   Verified Badge   -- RECURRING: fires on the referred Expert's first badge
--                       purchase and again on every annual renewal.
--   Released Lead    -- ONE-TIME per successful contact-unlock payment.
--
-- Attribution is first-click and permanent, and already lives in
-- public.affiliate_referrals (one row per referred user). This adds the ledger
-- of individual earning events, because the existing table carries a single
-- commission per referred user and cannot express a badge that renews for
-- years or an expert who unlocks lead after lead.
--
-- Amounts are copied from public.pricing_countries at the moment the event
-- fires and then frozen on the row, so revising a fee later never rewrites what
-- an affiliate already earned.

alter table public.affiliates
  add column if not exists country_code text,
  add column if not exists payout_method text,              -- 'bank' | 'paypal' | 'wise' | ...
  add column if not exists payout_reference text,
  add column if not exists payout_notes text;

create table if not exists public.affiliate_commissions (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates (id) on delete cascade,
  referred_user_id uuid references auth.users (id) on delete set null,
  event_type text not null,                                 -- 'badge_purchase'|'badge_renewal'|'lead_unlock'
  source_id uuid,                                           -- verified_badges.id | contact_releases.id
  country_code text references public.pricing_countries (code),
  currency text not null,
  amount_local numeric(14, 2) not null,
  amount_usd numeric(10, 2) not null,                        -- payouts settle in USD
  status text not null default 'earned',                     -- 'earned' | 'paid' | 'void'
  payout_id uuid,
  earned_at timestamptz not null default now(),
  paid_at timestamptz,
  constraint affiliate_commissions_event_source_key unique (event_type, source_id)
);

create index if not exists affiliate_commissions_affiliate_id_idx
  on public.affiliate_commissions (affiliate_id, earned_at desc);
create index if not exists affiliate_commissions_status_idx
  on public.affiliate_commissions (status);

alter table public.affiliate_commissions enable row level security;

drop policy if exists "Affiliates read their own commissions" on public.affiliate_commissions;
create policy "Affiliates read their own commissions"
  on public.affiliate_commissions for select
  to authenticated
  using (
    affiliate_id in (select id from public.affiliates where user_id = auth.uid())
  );

drop policy if exists "Staff read affiliate commissions" on public.affiliate_commissions;
create policy "Staff read affiliate commissions"
  on public.affiliate_commissions for select
  to anon
  using (true);

drop policy if exists "Staff settle affiliate commissions" on public.affiliate_commissions;
create policy "Staff settle affiliate commissions"
  on public.affiliate_commissions for update
  to anon
  using (true)
  with check (true);

-- Payouts run on the platform's cycle once the balance clears USD 50.
create table if not exists public.affiliate_payouts (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates (id) on delete cascade,
  amount_usd numeric(10, 2) not null,
  status text not null default 'pending',                    -- 'pending' | 'processing' | 'paid'
  method text,
  reference text,
  notes text,
  requested_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists affiliate_payouts_affiliate_id_idx
  on public.affiliate_payouts (affiliate_id);

alter table public.affiliate_payouts enable row level security;

drop policy if exists "Affiliates read their own payouts" on public.affiliate_payouts;
create policy "Affiliates read their own payouts"
  on public.affiliate_payouts for select
  to authenticated
  using (
    affiliate_id in (select id from public.affiliates where user_id = auth.uid())
  );

drop policy if exists "Staff manage payouts" on public.affiliate_payouts;
create policy "Staff manage payouts"
  on public.affiliate_payouts for all
  to anon
  using (true)
  with check (true);

create or replace view public.affiliate_balances
with (security_invoker = on) as
select
  a.id as affiliate_id,
  a.user_id,
  a.referral_code,
  a.country_code,
  count(*) filter (where ac.status <> 'void') as commission_events,
  coalesce(sum(ac.amount_usd) filter (where ac.status in ('earned', 'paid')), 0) as earned_usd,
  coalesce(sum(ac.amount_usd) filter (where ac.status = 'paid'), 0) as paid_usd,
  coalesce(sum(ac.amount_usd) filter (where ac.status = 'earned'), 0) as owed_usd,
  (coalesce(sum(ac.amount_usd) filter (where ac.status = 'earned'), 0) >= 50) as payout_eligible
from public.affiliates a
left join public.affiliate_commissions ac on ac.affiliate_id = a.id
group by a.id, a.user_id, a.referral_code, a.country_code;

grant select on public.affiliate_balances to anon, authenticated;

-- Called by the Stripe fulfilment path with the service role. Silently does
-- nothing when the buyer was never referred, or when the same event is
-- replayed (a webhook retry after the confirm endpoint already ran).
create or replace function public.record_affiliate_commission(
  p_referred_user_id uuid,
  p_event_type text,
  p_source_id uuid,
  p_country_code text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_affiliate_id uuid;
  v_price public.pricing_countries;
  v_local numeric(14, 2);
  v_usd numeric(10, 2);
  v_id uuid;
begin
  select affiliate_id into v_affiliate_id
  from public.affiliate_referrals
  where referred_user_id = p_referred_user_id;

  if v_affiliate_id is null then
    return null;
  end if;

  select * into v_price from public.pricing_countries where code = p_country_code;
  if not found then
    return null;
  end if;

  if p_event_type in ('badge_purchase', 'badge_renewal') then
    v_local := v_price.affiliate_badge_local;
    v_usd := v_price.affiliate_badge_usd;
  elsif p_event_type = 'lead_unlock' then
    v_local := v_price.affiliate_lead_local;
    v_usd := v_price.affiliate_lead_usd;
  else
    raise exception 'unknown affiliate event type: %', p_event_type;
  end if;

  insert into public.affiliate_commissions (
    affiliate_id, referred_user_id, event_type, source_id,
    country_code, currency, amount_local, amount_usd
  ) values (
    v_affiliate_id, p_referred_user_id, p_event_type, p_source_id,
    p_country_code, v_price.currency, v_local, v_usd
  )
  on conflict (event_type, source_id) do nothing
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.record_affiliate_commission(uuid, text, uuid, text) from public, anon, authenticated;
grant execute on function public.record_affiliate_commission(uuid, text, uuid, text) to service_role;
