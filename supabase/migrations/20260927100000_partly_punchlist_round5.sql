-- partly.asia punch list round 5 (tester notes of 27 Sep 2026).
--
--  1. Matching: the shortlist no longer freezes at whatever had applied when
--     the business first opened the Matches page -- empty slots (up to 10)
--     are filled by later applicants, without reordering or removing anyone.
--     Suspended experts and suspended postings are left out; skills are
--     compared case-insensitively, against the expert's sub-categories too.
--  2. Applying needs Basic verification, a live posting and a free slot.
--  3. A Fully verified expert is always Basic verified as well.
--  4. Date of birth is kept to month + year; marital status is no longer kept.
--  5. Badge "payment received" message no longer asks for an upload that
--     checkout already required.
--  6. Match cards carry application_id so the business can open the full
--     (contact-free) applicant profile.

-- ---------------------------------------------------------------------------
-- 1. Matching
-- ---------------------------------------------------------------------------

create or replace function public.generate_posting_matches(p_job_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job public.jobs;
  v_existing integer;
  v_max_rank integer;
  v_inserted integer := 0;
begin
  if not exists (
    select 1 from public.jobs j
    join public.employers e on e.id = j.employer_id
    where j.id = p_job_id and e.user_id = auth.uid()
  ) then
    raise exception 'not your posting';
  end if;

  -- Lock the posting so two tabs opening Matches at once can't both fill
  -- the same free slots (ranks would collide, the cap could be raced).
  select * into v_job from public.jobs where id = p_job_id for update;

  select count(*), coalesce(max(rank), 0) into v_existing, v_max_rank
  from public.posting_matches where job_id = p_job_id;

  -- Nothing more is drawn once the list is full, or for a posting that is
  -- closed, passed on, or suspended by an admin.
  if v_existing >= 10
     or v_job.suspended
     or v_job.matching_status not in ('open', 'matched', 'released') then
    return v_existing;
  end if;

  with skills as (
    select distinct lower(trim(s)) as skill
    from unnest(coalesce(v_job.skill_requirements, '{}'::text[])) s
    where trim(s) <> ''
  ),
  ranked as (
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
      -- A posting's free-text skills ("FP&A, finance") against the expert's
      -- categories and sub-category names, ignoring case and spacing.
      + least(20, 10 * (
          select count(*) from skills k
          where k.skill in (
            select lower(trim(f)) from unnest(coalesce(c.expertise_field, '{}'::text[])) f
            union
            select lower(trim(s.name))
            from public.candidate_subcategories cs2
            join public.subcategories s on s.id = cs2.subcategory_id
            where cs2.candidate_id = c.id
          )
        ))
      + (case when v_job.country is not null and c.country_code = v_job.country then 10 else 0 end)
        as score,
      a.applied_at
    from public.job_applications a
    join public.candidates c on c.id = a.candidate_id
    where a.job_id = p_job_id
      and a.status <> 'rejected'
      and not c.suspended
      and not exists (
        select 1 from public.posting_matches pm
        where pm.job_id = p_job_id and pm.candidate_id = c.id
      )
  )
  insert into public.posting_matches (job_id, candidate_id, application_id, rank, score)
  select
    p_job_id,
    candidate_id,
    application_id,
    v_max_rank + row_number() over (order by score desc, applied_at asc, application_id asc),
    score
  from ranked
  order by score desc, applied_at asc, application_id asc
  limit 10 - v_existing;

  get diagnostics v_inserted = row_count;

  if v_inserted > 0 then
    update public.jobs
       set matching_status = 'matched',
           matches_generated_at = coalesce(matches_generated_at, now())
     where id = p_job_id and matching_status = 'open';
  end if;

  return v_existing + v_inserted;
end;
$$;

-- Contact can't be released on a suspended posting or to a suspended expert.
-- (A trigger rather than another copy of release_contact.)
create or replace function public.guard_contact_release()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select suspended from public.jobs where id = new.job_id) then
    raise exception 'This posting is suspended, so contact can''t be released.';
  end if;
  if (select suspended from public.candidates where id = new.candidate_id) then
    raise exception 'One of the experts you picked is no longer available. Refresh the page and try again.';
  end if;
  return new;
end;
$$;

drop trigger if exists contact_releases_guard on public.contact_releases;
create trigger contact_releases_guard
  before insert on public.contact_releases
  for each row execute function public.guard_contact_release();

-- ---------------------------------------------------------------------------
-- 2. Who can apply
-- ---------------------------------------------------------------------------

create or replace function public.guard_application_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cand public.candidates;
  v_job public.jobs;
begin
  -- Updates only matter when a rejected application is re-opened (rejected -> active).
  if tg_op = 'UPDATE' and (new.status <> 'active' or old.status = 'active') then
    return new;
  end if;

  select * into v_cand from public.candidates where id = new.candidate_id;
  select * into v_job from public.jobs where id = new.job_id;

  if exists (
    select 1
    from public.employers e
    where e.id = v_job.employer_id
      and e.user_id is not null
      and e.user_id in (new.user_id, v_cand.user_id)
  ) then
    raise exception 'You can''t apply to your own posting.';
  end if;

  if tg_op = 'INSERT' then
    if v_job.suspended or v_job.matching_status in ('closed', 'no_further_matches') then
      raise exception 'This need is no longer open for applications.';
    end if;
    if (select count(*) from public.posting_matches where job_id = new.job_id) >= 10 then
      raise exception 'This need already has its full shortlist of 10 experts.';
    end if;
  end if;

  if not coalesce(v_cand.identity_verified, false) then
    raise exception 'Finish Basic verification (the last 4 characters of your ID) before applying.';
  end if;

  if coalesce(nullif(trim(v_cand.years_experience), 'Select...'), '') = ''
     or coalesce(cardinality(v_cand.expertise_field), 0) = 0 then
    raise exception 'Complete your profile before applying: choose your years of experience and at least one expert category.';
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Fully verified implies Basic verified
-- ---------------------------------------------------------------------------
-- The badge needs an admin-approved identity document, which is a stronger
-- check than the self-serve ID digits. Without this, an expert whose digits
-- never saved could show "Fully verified" yet be told to verify before applying.

create or replace function public.sync_identity_from_badge()
returns trigger
language plpgsql
as $$
begin
  if new.verified_badge_until is not null
     and new.verified_badge_until > now()
     and not coalesce(new.identity_verified, false) then
    new.identity_verified := true;
    new.identity_verified_at := coalesce(new.identity_verified_at, now());
  end if;
  return new;
end;
$$;

-- Named to sort after candidates_protect_verification, so it sees the
-- badge value that trigger allowed through.
drop trigger if exists candidates_sync_identity_from_badge on public.candidates;
create trigger candidates_sync_identity_from_badge
  before insert or update on public.candidates
  for each row execute function public.sync_identity_from_badge();

create or replace function public.sync_identity_from_document()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.owner_kind = 'candidate' and new.doc_type = 'identity' and new.status = 'approved'
     and (tg_op = 'INSERT' or old.status is distinct from 'approved') then
    update public.candidates
       set identity_verified = true,
           identity_verified_at = coalesce(identity_verified_at, now())
     where id = new.owner_id and not identity_verified;
  end if;
  return new;
end;
$$;

drop trigger if exists verification_documents_sync_identity on public.verification_documents;
create trigger verification_documents_sync_identity
  after insert or update of status on public.verification_documents
  for each row execute function public.sync_identity_from_document();

update public.candidates c
   set identity_verified = true,
       identity_verified_at = coalesce(c.identity_verified_at, now())
 where not c.identity_verified
   and (
     c.verified_badge_until > now()
     or exists (
       select 1 from public.verification_documents d
       where d.owner_kind = 'candidate' and d.owner_id = c.id
         and d.doc_type = 'identity' and d.status = 'approved'
     )
   );

-- ---------------------------------------------------------------------------
-- 4. Personal data: month + year of birth only, no marital status
-- ---------------------------------------------------------------------------

create or replace function public.minimise_candidate_personal_data()
returns trigger
language plpgsql
as $$
begin
  if new.date_of_birth is not null then
    new.date_of_birth := date_trunc('month', new.date_of_birth)::date;
  end if;
  new.marital_status := null;
  return new;
end;
$$;

drop trigger if exists candidates_minimise_personal_data on public.candidates;
create trigger candidates_minimise_personal_data
  before insert or update on public.candidates
  for each row execute function public.minimise_candidate_personal_data();

update public.candidates
   set date_of_birth = date_trunc('month', date_of_birth)::date
 where date_of_birth is not null
   and extract(day from date_of_birth) <> 1;

update public.candidates set marital_status = null where marital_status is not null;

-- ---------------------------------------------------------------------------
-- 5. Badge purchase message
-- ---------------------------------------------------------------------------
-- Checkout already refuses a badge purchase until the identity document is
-- uploaded, so an unapproved document here is waiting for review, not upload.

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
    case when v_doc_approved then 'badge_active' else 'badge_awaiting_review' end,
    case when v_doc_approved then 'Your Verified badge is active' else 'Payment received — your ID is being reviewed' end,
    case when v_doc_approved
      then format('Your badge runs until %s and now gives you priority in match ranking.', to_char(v_badge.expires_at, 'DD Mon YYYY'))
      else 'Your payment is confirmed and your identity document is with our team. Your Fully verified badge switches on as soon as it is approved — there''s nothing else you need to do.'
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

-- Old copies of the stale message are marked read so they stop surfacing.
update public.notifications
   set read_at = coalesce(read_at, now())
 where title = 'Payment received — upload your ID document';

-- ---------------------------------------------------------------------------
-- 6. Match cards link to the full applicant profile
-- ---------------------------------------------------------------------------
-- Same columns as 20260925100000 plus application_id appended (CREATE OR
-- REPLACE VIEW can only append); suspended experts drop off the cards.

create or replace view public.match_candidate_cards as
select
  m.id as match_id,
  m.job_id,
  m.rank,
  m.score,
  c.id as candidate_id,
  c.full_name,
  c.headline,
  c.title,
  c.avatar_path,
  c.years_experience,
  c.expertise_field,
  c.country_code,
  c.identity_verified,
  (c.verified_badge_until > now()) as badge_verified,
  c.public_slug,
  r.id as release_id,
  r.status as release_status,
  r.window_expires_at,
  r.paid_at,
  coalesce(rs.rating_count, 0) as rating_count,
  rs.avg_stars,
  c.business_name,
  m.application_id
from public.posting_matches m
join public.candidates c on c.id = m.candidate_id
join public.jobs j on j.id = m.job_id
join public.employers e on e.id = j.employer_id
left join public.contact_releases r on r.job_id = m.job_id and r.candidate_id = m.candidate_id
left join public.candidate_rating_summary rs on rs.candidate_id = c.id
where e.user_id = auth.uid()
  and not c.suspended;

grant select on public.match_candidate_cards to authenticated;
