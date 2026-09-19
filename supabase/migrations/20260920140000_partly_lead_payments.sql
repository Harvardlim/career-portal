-- Money in for the two partly.asia products, and the contact exchange a paid
-- lead unlocks.
--
-- Nothing here is ever charged speculatively: a lead payment row only exists
-- because a Business already released contact, and a window that runs out is
-- simply a cold lead -- no payment was taken, so there is nothing to refund.

create table if not exists public.lead_unlock_payments (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null unique references public.contact_releases (id) on delete cascade,
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  job_id uuid not null references public.jobs (id) on delete cascade,
  country_code text references public.pricing_countries (code),
  currency text not null,
  amount_local numeric(14, 2) not null,
  amount_usd numeric(10, 2) not null,
  pay_currency text not null default 'local',        -- 'local' | 'usd'
  stripe_session_id text,
  stripe_payment_intent text,
  status text not null default 'pending',            -- 'pending' | 'paid' | 'failed' | 'abandoned'
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists lead_unlock_payments_candidate_id_idx
  on public.lead_unlock_payments (candidate_id);
create index if not exists lead_unlock_payments_status_idx
  on public.lead_unlock_payments (status);

alter table public.lead_unlock_payments enable row level security;

drop policy if exists "Experts read their own lead payments" on public.lead_unlock_payments;
create policy "Experts read their own lead payments"
  on public.lead_unlock_payments for select
  to authenticated
  using (
    candidate_id in (select id from public.candidates where user_id = auth.uid())
  );

drop policy if exists "Staff read lead payments" on public.lead_unlock_payments;
create policy "Staff read lead payments"
  on public.lead_unlock_payments for select
  to anon
  using (true);

-- Contact is exchanged in BOTH directions and only while it is live: 5 calendar
-- days from payment, and only ever inside the site. These views are the single
-- place contact details leave their owning table, and each one checks the
-- caller itself (they run as owner so the counterparty's row-level policies
-- don't hide the very details the expert just paid for).
create or replace view public.expert_lead_contacts as
select
  r.id as release_id,
  r.job_id,
  j.title as posting_title,
  e.company_name,
  e.business_email,
  e.phone,
  e.website,
  e.location,
  r.paid_at,
  r.contact_expires_at
from public.contact_releases r
join public.jobs j on j.id = r.job_id
join public.employers e on e.id = r.employer_id
join public.candidates c on c.id = r.candidate_id
where r.status = 'paid'
  and r.contact_expires_at > now()
  and c.user_id = auth.uid();

grant select on public.expert_lead_contacts to authenticated;

create or replace view public.business_lead_contacts as
select
  r.id as release_id,
  r.job_id,
  j.title as posting_title,
  c.id as candidate_id,
  c.full_name,
  c.headline,
  c.email,
  c.contact_number,
  c.linkedin_url,
  (c.verified_badge_until > now()) as badge_verified,
  r.paid_at,
  r.contact_expires_at
from public.contact_releases r
join public.jobs j on j.id = r.job_id
join public.candidates c on c.id = r.candidate_id
join public.employers e on e.id = r.employer_id
where r.status = 'paid'
  and r.contact_expires_at > now()
  and e.user_id = auth.uid();

grant select on public.business_lead_contacts to authenticated;

-- Fulfilment, run by the Stripe confirm/webhook path with the service role.
-- Idempotent through the status guard, so a webhook retry after the confirm
-- endpoint already ran is a no-op.
create or replace function public.confirm_lead_unlock(p_release_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_release public.contact_releases;
  v_expert_user uuid;
  v_business_user uuid;
  v_title text;
  v_company text;
  v_name text;
  v_country text;
begin
  update public.contact_releases
     set status = 'paid',
         paid_at = now(),
         contact_expires_at = now() + interval '5 days'
   where id = p_release_id
     and status = 'awaiting_payment'
  returning * into v_release;

  if not found then
    return false;
  end if;

  update public.lead_unlock_payments
     set status = 'paid', paid_at = now()
   where release_id = p_release_id;

  select c.user_id, c.full_name, c.country_code into v_expert_user, v_name, v_country
  from public.candidates c where c.id = v_release.candidate_id;

  select e.user_id, e.company_name into v_business_user, v_company
  from public.employers e where e.id = v_release.employer_id;

  select title into v_title from public.jobs where id = v_release.job_id;

  perform public.notify_user(
    v_expert_user,
    'contact_unlocked',
    'Contact unlocked',
    format('You can now see %s''s contact details for "%s". They expire in 5 days — keep the conversation on partly.asia until then.',
           coalesce(v_company, 'the business'), v_title),
    '/dashboard/leads/' || p_release_id,
    jsonb_build_object('release_id', p_release_id)
  );

  perform public.notify_user(
    v_business_user,
    'contact_unlocked',
    format('%s unlocked your contact', coalesce(v_name, 'An expert')),
    format('Their full contact details for "%s" are now on your posting. They expire in 5 days.', v_title),
    '/employer/postings/' || v_release.job_id || '/matches',
    jsonb_build_object('release_id', p_release_id)
  );

  perform public.record_affiliate_commission(v_expert_user, 'lead_unlock', p_release_id, v_country);

  return true;
end;
$$;

revoke all on function public.confirm_lead_unlock(uuid) from public, anon, authenticated;
grant execute on function public.confirm_lead_unlock(uuid) to service_role;

create or replace function public.confirm_badge_purchase(p_badge_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_badge public.verified_badges;
  v_user uuid;
  v_event text;
begin
  update public.verified_badges
     set status = 'active',
         purchased_at = now(),
         starts_at = now(),
         -- a renewal extends from the old expiry so no paid time is lost
         expires_at = greatest(now(), coalesce(
           (select b2.expires_at from public.verified_badges b2 where b2.id = verified_badges.renewed_from),
           now()
         )) + interval '1 year'
   where id = p_badge_id
     and status = 'pending'
  returning * into v_badge;

  if not found then
    return false;
  end if;

  -- The term this one renews is finished; leaving it active would double-count
  -- the expert's badge in renewal reminders and expiry sweeps.
  if v_badge.renewed_from is not null then
    update public.verified_badges
       set status = 'superseded'
     where id = v_badge.renewed_from and status = 'active';
  end if;

  update public.candidates
     set verified_badge_until = v_badge.expires_at
   where id = v_badge.candidate_id
  returning user_id into v_user;

  v_event := case when v_badge.renewed_from is null then 'badge_purchase' else 'badge_renewal' end;

  perform public.notify_user(
    v_user,
    'badge_active',
    'Your Verified badge is active',
    format('Your badge runs until %s and now gives you priority in match ranking.',
           to_char(v_badge.expires_at, 'DD Mon YYYY')),
    '/dashboard/verification',
    jsonb_build_object('badge_id', p_badge_id)
  );

  perform public.record_affiliate_commission(v_user, v_event, p_badge_id, v_badge.country_code);

  return true;
end;
$$;

revoke all on function public.confirm_badge_purchase(uuid) from public, anon, authenticated;
grant execute on function public.confirm_badge_purchase(uuid) to service_role;

-- Badge renewal reminders at 30, 14, 7 and 1 days out, plus the expiry sweep.
-- One row per (badge, mark) means a re-run never notifies twice.
create or replace function public.send_badge_renewal_reminders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mark integer;
  v_row record;
  v_sent integer := 0;
begin
  foreach v_mark in array array[30, 14, 7, 1] loop
    for v_row in
      select b.id, b.expires_at, c.user_id
      from public.verified_badges b
      join public.candidates c on c.id = b.candidate_id
      where b.status = 'active'
        and b.expires_at is not null
        and b.expires_at > now()
        and b.expires_at <= now() + (v_mark || ' days')::interval
        and not exists (
          select 1 from public.badge_renewal_reminders r
          where r.badge_id = b.id and r.days_before = v_mark
        )
    loop
      perform public.notify_user(
        v_row.user_id,
        'badge_renewal',
        case when v_mark = 1 then 'Your Verified badge expires tomorrow'
             else format('Your Verified badge expires in %s days', v_mark) end,
        format('Renew before %s to keep your badge and your priority in match ranking.',
               to_char(v_row.expires_at, 'DD Mon YYYY')),
        '/dashboard/verification',
        jsonb_build_object('badge_id', v_row.id, 'days_before', v_mark)
      );

      insert into public.badge_renewal_reminders (badge_id, days_before)
      values (v_row.id, v_mark)
      on conflict do nothing;

      v_sent := v_sent + 1;
    end loop;
  end loop;

  return v_sent;
end;
$$;

revoke all on function public.send_badge_renewal_reminders() from public, anon, authenticated;

create or replace function public.expire_badges()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.verified_badges
     set status = 'expired'
   where status = 'active' and expires_at is not null and expires_at <= now();

  get diagnostics v_count = row_count;

  update public.candidates
     set verified_badge_until = null
   where verified_badge_until is not null and verified_badge_until <= now();

  return v_count;
end;
$$;

revoke all on function public.expire_badges() from public, anon, authenticated;
