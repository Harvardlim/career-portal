-- Second round of changes from the user's punch list (2026-09-21):
--   1/3. Basic (free) identity check = last 4 ID characters, self-serve --
--        sets identity_verified immediately, no admin wait, so free accounts
--        can apply right away.
--   2.   The paid Verified badge additionally requires an uploaded identity
--        document; payment happens first, the badge activates once an admin
--        approves that document (chosen order).
--   4.   Badge holders are pushed to the front of a posting's matches, not
--        just weighted -- the score gap is now decisive.
--   5.   Categories: fold Design & Creative into Marketing and Training &
--        Corporate Learning into Human Resources (back to the spec's 8).
--   10.  Businesses can also buy the Verified badge (same fixed fee as
--        experts), gated on an already-approved registration document.
--   12.  Reports: anyone can report a job, business or expert.

-- ---------------------------------------------------------------------------
-- 1/3. Basic identity check is self-serve; only the badge needs admin review.
-- ---------------------------------------------------------------------------

-- expert-identity (edge function) now sets identity_verified = true itself,
-- so admin_review_verification no longer touches it for candidates -- an
-- 'identity' document review instead activates a paid badge that's waiting on
-- it. Business registration review is unchanged.
create or replace function public.activate_pending_badge(p_candidate_id uuid, p_admin_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_badge public.verified_badges;
  v_user uuid;
begin
  -- Postgres UPDATE has no ORDER BY / LIMIT, so the oldest awaiting-review
  -- badge (there should only ever be one) is picked via a CTE first.
  with target as (
    select id from public.verified_badges
    where candidate_id = p_candidate_id and status = 'awaiting_review'
    order by created_at
    limit 1
  )
  update public.verified_badges
     set status = 'active',
         starts_at = now(),
         expires_at = greatest(now(), coalesce(
           (select b2.expires_at from public.verified_badges b2 where b2.id = verified_badges.renewed_from),
           now()
         )) + interval '1 year'
   where id = (select id from target)
  returning * into v_badge;

  if not found then
    return false;
  end if;

  if v_badge.renewed_from is not null then
    update public.verified_badges set status = 'superseded'
     where id = v_badge.renewed_from and status = 'active';
  end if;

  update public.candidates
     set verified_badge_until = v_badge.expires_at
   where id = v_badge.candidate_id
  returning user_id into v_user;

  perform public.notify_user(
    v_user,
    'badge_active',
    'Your Verified badge is active',
    format('Your identity document was approved and your badge now runs until %s, with priority in match ranking.',
           to_char(v_badge.expires_at, 'DD Mon YYYY')),
    '/dashboard/verification',
    jsonb_build_object('badge_id', v_badge.id)
  );

  return true;
end;
$$;

revoke all on function public.activate_pending_badge(uuid, uuid) from public, anon, authenticated;

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

    perform public.notify_user(
      v_user,
      case when p_approve then 'verification_approved' else 'verification_rejected' end,
      case when p_approve then 'Your business is verified' else 'Registration document needs attention' end,
      case when p_approve
        then 'Your registration document was approved. You can now post projects.'
        else coalesce(p_notes, 'We could not verify the document you uploaded. Please upload a clearer copy.')
      end,
      '/employer/verification'
    );
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

-- ---------------------------------------------------------------------------
-- 2. Badge purchase: pay first, activate on document approval.
-- ---------------------------------------------------------------------------

-- 'pending' (created) -> 'awaiting_review' (paid, doc not approved yet) or
-- straight to 'active' (paid, doc already approved) -> 'superseded'/'expired'.
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
  v_country text;
  v_doc_approved boolean;
begin
  select exists(
    select 1 from public.verification_documents
    where owner_kind = 'candidate'
      and owner_id = (select candidate_id from public.verified_badges where id = p_badge_id)
      and doc_type = 'identity'
      and status = 'approved'
  ) into v_doc_approved;

  update public.verified_badges
     set status = 'pending',
         purchased_at = now()
   where id = p_badge_id
     and status = 'pending'
     and purchased_at is null
  returning * into v_badge;

  if not found then
    return false;
  end if;

  if v_doc_approved then
    update public.verified_badges
       set status = 'active',
           starts_at = now(),
           expires_at = greatest(now(), coalesce(
             (select b2.expires_at from public.verified_badges b2 where b2.id = v_badge.renewed_from),
             now()
           )) + interval '1 year'
     where id = p_badge_id
    returning * into v_badge;

    if v_badge.renewed_from is not null then
      update public.verified_badges set status = 'superseded'
       where id = v_badge.renewed_from and status = 'active';
    end if;

    update public.candidates set verified_badge_until = v_badge.expires_at
     where id = v_badge.candidate_id returning user_id into v_user;
  else
    update public.verified_badges set status = 'awaiting_review' where id = p_badge_id;
    select user_id into v_user from public.candidates where id = v_badge.candidate_id;
  end if;

  v_event := case when v_badge.renewed_from is null then 'badge_purchase' else 'badge_renewal' end;
  v_country := v_badge.country_code;

  perform public.notify_user(
    v_user,
    'badge_active',
    case when v_doc_approved then 'Your Verified badge is active' else 'Payment received — upload your ID document' end,
    case when v_doc_approved
      then format('Your badge runs until %s and now gives you priority in match ranking.', to_char(v_badge.expires_at, 'DD Mon YYYY'))
      else 'Your payment is confirmed. Upload your identity document from your dashboard — your badge activates as soon as it is approved.'
    end,
    '/dashboard/verification',
    jsonb_build_object('badge_id', p_badge_id)
  );

  perform public.record_affiliate_commission(v_user, v_event, p_badge_id, v_country);

  return true;
end;
$$;

revoke all on function public.confirm_badge_purchase(uuid) from public, anon, authenticated;
grant execute on function public.confirm_badge_purchase(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 4. Badge holders are pushed to the front, not just weighted.
-- ---------------------------------------------------------------------------

create or replace function public.generate_posting_matches(p_job_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing integer;
  v_country text;
  v_skills text[];
  v_inserted integer;
begin
  if not exists (
    select 1 from public.jobs j
    join public.employers e on e.id = j.employer_id
    where j.id = p_job_id and e.user_id = auth.uid()
  ) then
    raise exception 'not your posting';
  end if;

  select count(*) into v_existing from public.posting_matches where job_id = p_job_id;
  if v_existing > 0 then
    return v_existing;
  end if;

  select country, skill_requirements into v_country, v_skills
  from public.jobs where id = p_job_id;

  with ranked as (
    select
      a.id as application_id,
      c.id as candidate_id,
      -- Badge holders are always shown first, regardless of everything else;
      -- the rest of the score only orders within each of those two groups.
      (case when c.verified_badge_until > now() then 1000 else 0 end)
      + (case when c.identity_verified then 20 else 0 end)
      + least(30, 10 * (
          select count(*) from public.candidate_subcategories cs
          join public.job_subcategories js on js.subcategory_id = cs.subcategory_id
          where cs.candidate_id = c.id and js.job_id = p_job_id
        ))
      + least(20, 10 * coalesce(cardinality(
          array(select unnest(coalesce(c.expertise_field, '{}'))
                intersect
                select unnest(coalesce(v_skills, '{}')))
        ), 0))
      + (case when v_country is not null and c.country_code = v_country then 10 else 0 end)
        as score,
      a.applied_at
    from public.job_applications a
    join public.candidates c on c.id = a.candidate_id
    where a.job_id = p_job_id
      and a.status <> 'rejected'
  )
  insert into public.posting_matches (job_id, candidate_id, application_id, rank, score)
  select
    p_job_id,
    candidate_id,
    application_id,
    row_number() over (order by score desc, applied_at asc),
    score
  from ranked
  order by score desc, applied_at asc
  limit 10;

  get diagnostics v_inserted = row_count;

  if v_inserted > 0 then
    update public.jobs
       set matching_status = 'matched',
           matches_generated_at = coalesce(matches_generated_at, now())
     where id = p_job_id and matching_status = 'open';
  end if;

  return v_inserted;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Fold two categories back into the spec's original 8.
--    Sub-category IDs are unchanged (only their category_id moves), so every
--    job_subcategories / candidate_subcategories row stays valid.
-- ---------------------------------------------------------------------------

update public.subcategories
   set category_id = (select id from public.categories where slug = 'marketing')
 where category_id = (select id from public.categories where slug = 'design-creative');

update public.subcategories
   set category_id = (select id from public.categories where slug = 'human-resources')
 where category_id = (select id from public.categories where slug = 'training-corporate-learning');

update public.jobs
   set main_category_id = (select id from public.categories where slug = 'marketing'),
       category = 'Marketing'
 where main_category_id = (select id from public.categories where slug = 'design-creative');

update public.jobs
   set main_category_id = (select id from public.categories where slug = 'human-resources'),
       category = 'Human Resources'
 where main_category_id = (select id from public.categories where slug = 'training-corporate-learning');

update public.candidates
   set expertise_field = array_replace(expertise_field, 'Design & Creative', 'Marketing')
 where 'Design & Creative' = any(expertise_field);

update public.candidates
   set expertise_field = array_replace(expertise_field, 'Training & Corporate Learning', 'Human Resources')
 where 'Training & Corporate Learning' = any(expertise_field);

update public.candidates
   set interests = array_replace(interests, 'Design & Creative', 'Marketing')
 where 'Design & Creative' = any(interests);

update public.candidates
   set interests = array_replace(interests, 'Training & Corporate Learning', 'Human Resources')
 where 'Training & Corporate Learning' = any(interests);

delete from public.categories where slug in ('design-creative', 'training-corporate-learning');

-- ---------------------------------------------------------------------------
-- 10. Business Verified badge -- same fixed fee as experts, gated on an
--     already-approved registration document.
-- ---------------------------------------------------------------------------

alter table public.employers
  add column if not exists verified_badge_until timestamptz;

create table if not exists public.employer_verified_badges (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.employers (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  status text not null default 'pending',                  -- 'pending'|'active'|'superseded'|'expired'|'cancelled'
  country_code text references public.pricing_countries (code),
  currency text not null,
  amount_local numeric(14, 2) not null,
  amount_usd numeric(10, 2) not null,
  pay_currency text not null default 'local',
  stripe_session_id text,
  stripe_payment_intent text,
  renewed_from uuid references public.employer_verified_badges (id) on delete set null,
  purchased_at timestamptz,
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists employer_verified_badges_employer_id_idx
  on public.employer_verified_badges (employer_id);

alter table public.employer_verified_badges enable row level security;

drop policy if exists "Businesses read their own badge" on public.employer_verified_badges;
create policy "Businesses read their own badge"
  on public.employer_verified_badges for select
  to authenticated
  using (employer_id in (select id from public.employers where user_id = auth.uid()));

drop policy if exists "Staff read employer badges" on public.employer_verified_badges;
create policy "Staff read employer badges"
  on public.employer_verified_badges for select
  to anon
  using (true);

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
begin
  update public.employer_verified_badges
     set status = 'active',
         purchased_at = now(),
         starts_at = now(),
         expires_at = greatest(now(), coalesce(
           (select b2.expires_at from public.employer_verified_badges b2 where b2.id = employer_verified_badges.renewed_from),
           now()
         )) + interval '1 year'
   where id = p_badge_id
     and status = 'pending'
  returning * into v_badge;

  if not found then
    return false;
  end if;

  if v_badge.renewed_from is not null then
    update public.employer_verified_badges set status = 'superseded'
     where id = v_badge.renewed_from and status = 'active';
  end if;

  update public.employers set verified_badge_until = v_badge.expires_at
   where id = v_badge.employer_id returning user_id into v_user;

  v_event := case when v_badge.renewed_from is null then 'badge_purchase' else 'badge_renewal' end;

  perform public.notify_user(
    v_user,
    'badge_active',
    'Your business Verified badge is active',
    format('Your badge runs until %s.', to_char(v_badge.expires_at, 'DD Mon YYYY')),
    '/employer/verification',
    jsonb_build_object('badge_id', p_badge_id)
  );

  perform public.record_affiliate_commission(v_user, v_event, p_badge_id, v_badge.country_code);

  return true;
end;
$$;

revoke all on function public.confirm_employer_badge_purchase(uuid) from public, anon, authenticated;
grant execute on function public.confirm_employer_badge_purchase(uuid) to service_role;

create or replace function public.expire_employer_badges()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.employer_verified_badges
     set status = 'expired'
   where status = 'active' and expires_at is not null and expires_at <= now();
  get diagnostics v_count = row_count;

  update public.employers
     set verified_badge_until = null
   where verified_badge_until is not null and verified_badge_until <= now();

  return v_count;
end;
$$;

revoke all on function public.expire_employer_badges() from public, anon, authenticated;
grant execute on function public.expire_employer_badges() to service_role;

-- ---------------------------------------------------------------------------
-- 12. Reports: anyone can report a job, a business or an expert.
-- ---------------------------------------------------------------------------

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid references auth.users (id) on delete set null,
  reporter_email text,
  target_kind text not null,                   -- 'job' | 'employer' | 'candidate'
  target_id uuid not null,
  reason text not null,
  details text,
  status text not null default 'open',          -- 'open' | 'reviewed' | 'dismissed'
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists reports_target_idx on public.reports (target_kind, target_id);
create index if not exists reports_status_idx on public.reports (status);

alter table public.reports enable row level security;

drop policy if exists "Anyone can file a report" on public.reports;
create policy "Anyone can file a report"
  on public.reports for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Staff read reports" on public.reports;
create policy "Staff read reports"
  on public.reports for select
  to anon
  using (true);

drop policy if exists "Staff update reports" on public.reports;
create policy "Staff update reports"
  on public.reports for update
  to anon
  using (true)
  with check (true);
