-- Fourth punch list (2026-09-24), the database half:
--   1.  Philippines joins the Expert markets (pricing row; PROVISIONAL figures --
--       edit them in the backoffice /pricing page).
--   2.  One email, one account: an auth user can hold an Expert profile OR a
--       Business profile, never both, and a Business can never apply to its own
--       posting. (Previously one login could be both and "hire" itself.)
--   3.  Applying needs a complete profile: years of experience + at least one
--       expertise category.
--   4.  "Hired" is gone. A business is *interested*, which is the same thing as
--       releasing contact -- so the status can only be set by release_contact()
--       and every interested applicant has a contact_releases row (=> warm-lead
--       notification, email and a payment window for the expert).
--   5.  Two verification tiers for businesses, mirroring experts:
--         Basic verified  -- free, from the registration number given at sign-up
--         Fully verified  -- the paid annual badge (payment first, activates once
--                            the registration document is approved)
--       and the verification columns can no longer be self-granted from the client.
--   6.  Warm-lead notification now states the unlock fee in both currencies.

-- ---------------------------------------------------------------------------
-- 1. Philippines
-- ---------------------------------------------------------------------------

-- Provisional: the September pricing reference has no Philippines row. Scaled in
-- the same proportion as the other emerging markets (lead ~USD 50, badge ~USD 19,
-- local intentionally a little higher, affiliate ~20%). Editable at /pricing.
insert into public.pricing_countries (
  code, name, currency, currency_symbol, zero_decimal,
  lead_fee_local, lead_fee_usd, badge_fee_local, badge_fee_usd,
  affiliate_lead_local, affiliate_lead_usd, affiliate_badge_local, affiliate_badge_usd,
  sort_order
) values
  ('PH', 'Philippines', 'PHP', '₱', false, 3499, 50, 1299, 19, 700, 10, 260, 4, 6)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- 2. One email, one account
-- ---------------------------------------------------------------------------

create or replace function public.enforce_single_account()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'candidates' then
    if new.user_id is not null and exists (select 1 from public.employers where user_id = new.user_id) then
      raise exception 'This email already has a business account. One email can only hold one account — use a different email to register as an expert.';
    end if;
    if new.email is not null and exists (select 1 from public.employers where lower(business_email) = lower(new.email)) then
      raise exception 'This email is already registered as a business. One email can only hold one account — use a different email to register as an expert.';
    end if;
  else
    if new.user_id is not null and exists (select 1 from public.candidates where user_id = new.user_id) then
      raise exception 'This email already has an expert account. One email can only hold one account — use a different email to register a business.';
    end if;
    if new.business_email is not null and exists (select 1 from public.candidates where lower(email) = lower(new.business_email)) then
      raise exception 'This email is already registered as an expert. One email can only hold one account — use a different email to register a business.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists candidates_single_account on public.candidates;
create trigger candidates_single_account
  before insert on public.candidates
  for each row execute function public.enforce_single_account();

drop trigger if exists employers_single_account on public.employers;
create trigger employers_single_account
  before insert on public.employers
  for each row execute function public.enforce_single_account();

-- ---------------------------------------------------------------------------
-- 2b/3. Application guards: not your own posting; profile must be complete
-- ---------------------------------------------------------------------------

create or replace function public.guard_application_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cand public.candidates;
begin
  -- Updates only matter when a rejected application is re-opened (rejected -> active).
  if tg_op = 'UPDATE' and (new.status <> 'active' or old.status = 'active') then
    return new;
  end if;

  select * into v_cand from public.candidates where id = new.candidate_id;

  if exists (
    select 1
    from public.jobs j
    join public.employers e on e.id = j.employer_id
    where j.id = new.job_id
      and e.user_id is not null
      and e.user_id in (new.user_id, v_cand.user_id)
  ) then
    raise exception 'You can''t apply to your own posting.';
  end if;

  if coalesce(nullif(trim(v_cand.years_experience), 'Select...'), '') = ''
     or coalesce(cardinality(v_cand.expertise_field), 0) = 0 then
    raise exception 'Complete your profile before applying: choose your years of experience and at least one expert category.';
  end if;

  return new;
end;
$$;

drop trigger if exists job_applications_guard_insert on public.job_applications;
create trigger job_applications_guard_insert
  before insert or update of status on public.job_applications
  for each row execute function public.guard_application_insert();

-- ---------------------------------------------------------------------------
-- 4. "Hired" -> "Interested" (= contact released)
-- ---------------------------------------------------------------------------

-- 'hired' rows never went through the release flow, so they cannot become
-- 'interested' (which now means "contact released"); shortlisted is the closest
-- honest state.
update public.job_applications set status = 'shortlisted' where status = 'hired';

create or replace function public.guard_application_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'interested'
     and old.status is distinct from 'interested'
     and not exists (
       select 1 from public.contact_releases r
       where r.job_id = new.job_id and r.candidate_id = new.candidate_id
     ) then
    raise exception '"Interested" can only be set by releasing contact — use "I''m interested" on the applicant.';
  end if;
  return new;
end;
$$;

drop trigger if exists job_applications_guard_status on public.job_applications;
create trigger job_applications_guard_status
  before update of status on public.job_applications
  for each row execute function public.guard_application_status();

-- Thousands-separated amount for notification copy ("3,499", "1,450,000", "12.50").
create or replace function public.format_amount(p_amount numeric)
returns text
language sql
immutable
as $$
  select case
    when p_amount = trunc(p_amount) then to_char(p_amount, 'FM999,999,999,990')
    else to_char(p_amount, 'FM999,999,999,990.00')
  end
$$;

create or replace function public.release_contact(p_job_id uuid, p_candidate_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_employer_id uuid;
  v_title text;
  v_company text;
  v_released integer := 0;
  v_cohort integer;
  v_row record;
  v_price record;
  v_fee text;
begin
  select j.employer_id, j.title, j.company_name into v_employer_id, v_title, v_company
  from public.jobs j
  join public.employers e on e.id = j.employer_id
  where j.id = p_job_id and e.user_id = auth.uid();

  if v_employer_id is null then
    raise exception 'not your posting';
  end if;

  if (select matching_status from public.jobs where id = p_job_id) in ('closed', 'no_further_matches') then
    raise exception 'this posting is closed';
  end if;

  -- Only ever to someone on the shortlist, and never twice.
  insert into public.contact_releases (job_id, candidate_id, employer_id, window_expires_at)
  select p_job_id, m.candidate_id, v_employer_id, now() + interval '2 days'
  from public.posting_matches m
  where m.job_id = p_job_id
    and m.candidate_id = any(p_candidate_ids)
  on conflict (job_id, candidate_id) do nothing;

  get diagnostics v_released = row_count;

  -- Nothing new was released (a double-submit, or every pick was already
  -- released), so nobody gets notified again.
  if v_released = 0 then
    return 0;
  end if;

  update public.jobs
     set matching_status = 'released',
         matches_viewed_at = coalesce(matches_viewed_at, now())
   where id = p_job_id;

  -- The applicant now reads "Interested" on the business's applications board.
  update public.job_applications
     set status = 'interested'
   where job_id = p_job_id
     and candidate_id = any(p_candidate_ids)
     and status <> 'interested'
     and exists (
       select 1 from public.contact_releases r
       where r.job_id = p_job_id and r.candidate_id = job_applications.candidate_id
     );

  select count(*) into v_cohort from public.contact_releases where job_id = p_job_id;

  -- Every expert released on this posting is re-notified of the cohort size, so
  -- an expert released first still learns that others were released later.
  for v_row in
    select r.id, r.candidate_id, c.user_id, c.country_code
    from public.contact_releases r
    join public.candidates c on c.id = r.candidate_id
    where r.job_id = p_job_id and r.status = 'awaiting_payment'
  loop
    -- The fee, in both currencies, so the notification itself says what unlocking costs.
    select p.currency_symbol, p.currency, p.lead_fee_local, p.lead_fee_usd
      into v_price
      from public.pricing_countries p
     where p.code = v_row.country_code;
    v_fee := case
      when v_price.lead_fee_local is null then ''
      else format(' Unlock fee: %s%s or USD %s.',
                  v_price.currency_symbol,
                  public.format_amount(v_price.lead_fee_local),
                  public.format_amount(v_price.lead_fee_usd))
    end;

    perform public.notify_user(
      v_row.user_id,
      'warm_lead',
      'You have a warm lead',
      case
        when v_cohort > 1 then
          format('%s is interested in you for "%s" — you are one of %s experts being considered. Pay to unlock their contact within 2 days.%s',
                 coalesce(v_company, 'A business'), v_title, v_cohort, v_fee)
        else
          format('%s is interested in you for "%s". Pay to unlock their contact within 2 days.%s',
                 coalesce(v_company, 'A business'), v_title, v_fee)
      end,
      '/dashboard/leads/' || v_row.id,
      jsonb_build_object('release_id', v_row.id, 'job_id', p_job_id, 'cohort_size', v_cohort)
    );
  end loop;

  return v_released;
end;
$$;

grant execute on function public.release_contact(uuid, uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Business tiers: Basic verified (free, from the registration number) and
--    Fully verified (the paid annual badge).
-- ---------------------------------------------------------------------------

alter table public.employers
  add column if not exists basic_verified boolean not null default false;

update public.employers set basic_verified = true where coalesce(trim(reg_no), '') <> '';

create or replace function public.set_employer_basic_verified()
returns trigger
language plpgsql
as $$
begin
  new.basic_verified := coalesce(trim(new.reg_no), '') <> '';
  return new;
end;
$$;

drop trigger if exists employers_basic_verified on public.employers;
create trigger employers_basic_verified
  before insert or update of reg_no on public.employers
  for each row execute function public.set_employer_basic_verified();

-- Verification state is granted by the flow functions / edge functions (which
-- run as their owner or as service_role), never by a signed-in user writing
-- their own row -- otherwise "Fully verified" could simply be switched on.
create or replace function public.protect_verification_columns()
returns trigger
language plpgsql
as $$
begin
  -- Registration inserts arrive as `anon` while email confirmation is pending,
  -- and later edits as `authenticated`; flow functions run as their owner.
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if tg_table_name = 'employers' then
    if tg_op = 'INSERT' then
      new.registration_verified := false;
      new.registration_verified_at := null;
      new.registration_verified_by := null;
      new.verified_badge_until := null;
    else
      new.registration_verified := old.registration_verified;
      new.registration_verified_at := old.registration_verified_at;
      new.registration_verified_by := old.registration_verified_by;
      new.verified_badge_until := old.verified_badge_until;
    end if;
  else
    if tg_op = 'INSERT' then
      new.identity_verified := false;
      new.identity_verified_at := null;
      new.identity_verified_by := null;
      new.verified_badge_until := null;
    else
      new.identity_verified := old.identity_verified;
      new.identity_verified_at := old.identity_verified_at;
      new.identity_verified_by := old.identity_verified_by;
      new.verified_badge_until := old.verified_badge_until;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists employers_protect_verification on public.employers;
create trigger employers_protect_verification
  before insert or update on public.employers
  for each row execute function public.protect_verification_columns();

drop trigger if exists candidates_protect_verification on public.candidates;
create trigger candidates_protect_verification
  before insert or update on public.candidates
  for each row execute function public.protect_verification_columns();

-- The paid badge for businesses now works like the Expert one: payment first,
-- active as soon as the registration document is approved (or immediately if it
-- already was).
create or replace function public.activate_pending_employer_badge(p_employer_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_badge public.employer_verified_badges;
  v_user uuid;
begin
  with target as (
    select id from public.employer_verified_badges
    where employer_id = p_employer_id and status = 'awaiting_review'
    order by created_at
    limit 1
  )
  update public.employer_verified_badges
     set status = 'active',
         starts_at = now(),
         expires_at = greatest(now(), coalesce(
           (select b2.expires_at from public.employer_verified_badges b2 where b2.id = employer_verified_badges.renewed_from),
           now()
         )) + interval '1 year'
   where id = (select id from target)
  returning * into v_badge;

  if not found then
    return false;
  end if;

  if v_badge.renewed_from is not null then
    update public.employer_verified_badges set status = 'superseded'
     where id = v_badge.renewed_from and status = 'active';
  end if;

  update public.employers set verified_badge_until = v_badge.expires_at
   where id = v_badge.employer_id
  returning user_id into v_user;

  perform public.notify_user(
    v_user,
    'badge_active',
    'Your business is now Fully verified',
    format('Your registration document was approved and your Fully verified badge runs until %s. Fully verified businesses attract better experts.',
           to_char(v_badge.expires_at, 'DD Mon YYYY')),
    '/employer/dashboard',
    jsonb_build_object('badge_id', v_badge.id)
  );

  return true;
end;
$$;

revoke all on function public.activate_pending_employer_badge(uuid) from public, anon, authenticated;

create or replace function public.confirm_employer_badge_purchase(p_badge_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_badge public.employer_verified_badges;
  v_user uuid;
  v_event text;
  v_doc_approved boolean;
begin
  update public.employer_verified_badges
     set purchased_at = now()
   where id = p_badge_id
     and status = 'pending'
     and purchased_at is null
  returning * into v_badge;

  if not found then
    return false;
  end if;

  select e.registration_verified, e.user_id into v_doc_approved, v_user
  from public.employers e where e.id = v_badge.employer_id;

  if v_doc_approved then
    update public.employer_verified_badges
       set status = 'active',
           starts_at = now(),
           expires_at = greatest(now(), coalesce(
             (select b2.expires_at from public.employer_verified_badges b2 where b2.id = v_badge.renewed_from),
             now()
           )) + interval '1 year'
     where id = p_badge_id
    returning * into v_badge;

    if v_badge.renewed_from is not null then
      update public.employer_verified_badges set status = 'superseded'
       where id = v_badge.renewed_from and status = 'active';
    end if;

    update public.employers set verified_badge_until = v_badge.expires_at
     where id = v_badge.employer_id;
  else
    update public.employer_verified_badges set status = 'awaiting_review' where id = p_badge_id;
  end if;

  v_event := case when v_badge.renewed_from is null then 'badge_purchase' else 'badge_renewal' end;

  perform public.notify_user(
    v_user,
    'badge_active',
    case when v_doc_approved then 'Your business is now Fully verified' else 'Payment received — awaiting document review' end,
    case when v_doc_approved
      then format('Your Fully verified badge runs until %s. Fully verified businesses attract better experts.', to_char(v_badge.expires_at, 'DD Mon YYYY'))
      else 'Your payment is confirmed. Your Fully verified badge activates as soon as our team approves your registration document.'
    end,
    '/employer/dashboard',
    jsonb_build_object('badge_id', p_badge_id)
  );

  perform public.record_affiliate_commission(v_user, v_event, p_badge_id, v_badge.country_code);

  return true;
end;
$$;

revoke all on function public.confirm_employer_badge_purchase(uuid) from public, anon, authenticated;
grant execute on function public.confirm_employer_badge_purchase(uuid) to service_role;

-- Approving a business registration document also activates a badge that was
-- already paid for and waiting on it.
create or replace function public.admin_review_verification(
  p_document_id uuid,
  p_approve boolean,
  p_admin_id uuid,
  p_notes text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_doc public.verification_documents;
  v_user uuid;
begin
  select * into v_doc from public.verification_documents where id = p_document_id;
  if not found then
    raise exception 'verification document not found';
  end if;

  update public.verification_documents
     set status = case when p_approve then 'approved' else 'rejected' end,
         notes = p_notes,
         reviewed_by = p_admin_id,
         reviewed_at = now()
   where id = p_document_id;

  if v_doc.owner_kind = 'employer' then
    update public.employers
       set registration_verified = p_approve,
           registration_verified_at = case when p_approve then now() else null end,
           registration_verified_by = p_admin_id
     where id = v_doc.owner_id
    returning user_id into v_user;

    if p_approve then
      if not public.activate_pending_employer_badge(v_doc.owner_id) then
        perform public.notify_user(
          v_user,
          'verification_approved',
          'Registration document approved',
          'Your registration document was approved. Activate the Fully verified badge to show the mark on your postings.',
          '/employer/verification'
        );
      end if;
    else
      perform public.notify_user(
        v_user,
        'verification_rejected',
        'Registration document needs attention',
        coalesce(p_notes, 'We could not verify the document you uploaded. Please upload a clearer copy.'),
        '/employer/verification'
      );
    end if;
    return;
  end if;

  -- candidate + 'identity': the free basic check is already self-serve (set
  -- the moment the ID digits are saved); a document review here only ever
  -- exists because the Expert bought the badge, so approval activates it.
  if p_approve then
    if not public.activate_pending_badge(v_doc.owner_id, p_admin_id) then
      perform public.notify_user(
        (select user_id from public.candidates where id = v_doc.owner_id),
        'verification_approved',
        'Identity document approved',
        'Your identity document was approved.',
        '/dashboard/verification'
      );
    end if;
  else
    select user_id into v_user from public.candidates where id = v_doc.owner_id;
    perform public.notify_user(
      v_user,
      'verification_rejected',
      'Identity document needs attention',
      coalesce(p_notes, 'We could not verify the document you uploaded. Please upload a clearer copy.'),
      '/dashboard/verification'
    );
  end if;
end;
$$;

grant execute on function public.admin_review_verification(uuid, boolean, uuid, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7. What a business sees of an applicant: the WHOLE profile except contact.
--    No email, phone, LinkedIn, website or social links -- those only appear
--    after a paid unlock (business_lead_contacts). Scoped to the caller's own
--    postings, like match_candidate_cards.
-- ---------------------------------------------------------------------------

create or replace view public.applicant_profiles as
select
  a.id as application_id,
  a.job_id,
  j.title as job_title,
  a.status,
  a.applied_at,
  a.cover_letter,
  c.id as candidate_id,
  c.full_name,
  c.headline,
  c.title,
  c.avatar_path,
  c.biography,
  c.past_experience,
  c.years_experience,
  c.education,
  c.nationality,
  c.expertise_field,
  coalesce((
    select array_agg(s.name order by s.name)
    from public.candidate_subcategories cs
    join public.subcategories s on s.id = cs.subcategory_id
    where cs.candidate_id = c.id
  ), '{}'::text[]) as subcategories,
  c.country_code,
  c.portfolio_links,
  c.public_slug,
  c.identity_verified,
  (c.verified_badge_until > now()) as badge_verified,
  coalesce(rs.rating_count, 0) as rating_count,
  rs.avg_stars,
  r.id as release_id,
  r.status as release_status
from public.job_applications a
join public.jobs j on j.id = a.job_id
join public.employers e on e.id = j.employer_id
join public.candidates c on c.id = a.candidate_id
left join public.candidate_rating_summary rs on rs.candidate_id = c.id
left join public.contact_releases r on r.job_id = a.job_id and r.candidate_id = a.candidate_id
where e.user_id = auth.uid();

grant select on public.applicant_profiles to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Notifications reach the browser live. The table was never in the realtime
--    publication, so the in-app "warm lead" alert was written but never pushed
--    (the header bell also polls, so this only makes it instant).
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.notifications;
    exception
      when duplicate_object then null;
    end;
  end if;
end;
$$;
