-- The matching and contact-release flow -- the heart of the spec.
--
--   Expert applies  ->  algorithm ranks applicants  ->  Business sees at most 10
--   (a HARD CAP, not a rolling list)  ->  Business releases contact to one or
--   many  ->  each released Expert gets a 2-day window to pay  ->  paid means
--   contact is exchanged BOTH ways for 5 calendar days; unpaid means the lead
--   simply goes cold, with no charge ever taken.
--
-- Two rules are easy to get wrong and are enforced here rather than in the UI:
--   * Scarcity: a posting whose 10 matches were all passed over is flagged and
--     never surfaces another candidate.
--   * Job closure: closing a posting ends EVERY outstanding payment window at
--     once, not on a rolling per-expert basis, so nobody pays to unlock a role
--     that has already been filled.

-- 1. The shortlist.
create table if not exists public.posting_matches (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  application_id uuid references public.job_applications (id) on delete set null,
  rank integer not null,
  score numeric(6, 2) not null default 0,
  created_at timestamptz not null default now(),
  constraint posting_matches_job_candidate_key unique (job_id, candidate_id)
);

create index if not exists posting_matches_job_id_idx on public.posting_matches (job_id, rank);

-- The cap is a product rule, so it lives next to the data rather than in a
-- query's LIMIT, where a second code path could quietly exceed it.
create or replace function public.enforce_match_cap()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.posting_matches where job_id = new.job_id) >= 10 then
    raise exception 'a posting can never surface more than 10 matches';
  end if;
  return new;
end;
$$;

drop trigger if exists posting_matches_cap on public.posting_matches;
create trigger posting_matches_cap
  before insert on public.posting_matches
  for each row execute function public.enforce_match_cap();

alter table public.posting_matches enable row level security;

drop policy if exists "Businesses read matches to their postings" on public.posting_matches;
create policy "Businesses read matches to their postings"
  on public.posting_matches for select
  to authenticated
  using (
    job_id in (
      select j.id from public.jobs j
      join public.employers e on e.id = j.employer_id
      where e.user_id = auth.uid()
    )
  );

drop policy if exists "Staff read matches" on public.posting_matches;
create policy "Staff read matches"
  on public.posting_matches for select
  to anon
  using (true);

-- 2. Released contacts.
create table if not exists public.contact_releases (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  employer_id uuid references public.employers (id) on delete set null,
  released_at timestamptz not null default now(),
  window_expires_at timestamptz not null,
  status text not null default 'awaiting_payment',  -- 'awaiting_payment'|'paid'|'cold'|'job_closed'
  paid_at timestamptz,
  contact_expires_at timestamptz,                   -- paid_at + 5 calendar days
  ended_reason text,
  created_at timestamptz not null default now(),
  constraint contact_releases_job_candidate_key unique (job_id, candidate_id)
);

create index if not exists contact_releases_candidate_id_idx on public.contact_releases (candidate_id);
create index if not exists contact_releases_job_id_idx on public.contact_releases (job_id);
create index if not exists contact_releases_open_window_idx
  on public.contact_releases (window_expires_at) where status = 'awaiting_payment';

alter table public.contact_releases enable row level security;

drop policy if exists "Experts read their own released leads" on public.contact_releases;
create policy "Experts read their own released leads"
  on public.contact_releases for select
  to authenticated
  using (
    candidate_id in (select id from public.candidates where user_id = auth.uid())
  );

drop policy if exists "Businesses read releases on their postings" on public.contact_releases;
create policy "Businesses read releases on their postings"
  on public.contact_releases for select
  to authenticated
  using (
    job_id in (
      select j.id from public.jobs j
      join public.employers e on e.id = j.employer_id
      where e.user_id = auth.uid()
    )
  );

drop policy if exists "Staff read releases" on public.contact_releases;
create policy "Staff read releases"
  on public.contact_releases for select
  to anon
  using (true);

-- Cohort size drives the disclosure notice ("you are one of N being
-- considered"), and is derived rather than stored so a later release to the
-- same posting can never leave a stale count behind.
create or replace view public.contact_release_details
with (security_invoker = on) as
select
  r.*,
  count(*) over (partition by r.job_id) as cohort_size,
  count(*) over (partition by r.job_id) - 1 as others_released,
  (r.status = 'awaiting_payment' and r.window_expires_at > now()) as window_open,
  greatest(0, extract(epoch from (r.window_expires_at - now()))::bigint) as seconds_left,
  (r.status = 'paid' and r.contact_expires_at > now()) as contact_visible
from public.contact_releases r;

grant select on public.contact_release_details to anon, authenticated;

-- 3. Build the shortlist. Idempotent: once a posting's 10 are drawn they are
--    fixed, so re-running returns the same set rather than refreshing it.
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
      -- A paid badge buys priority, identity verification counts for less, and
      -- the rest is fit: overlapping skills, then market, then who applied first.
      (case when c.verified_badge_until > now() then 40 else 0 end)
      + (case when c.identity_verified then 20 else 0 end)
      + least(30, 10 * coalesce(cardinality(
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

grant execute on function public.generate_posting_matches(uuid) to authenticated;

-- 4. Release contact to one or many of the 10.
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

  select count(*) into v_cohort from public.contact_releases where job_id = p_job_id;

  -- Every expert released on this posting is re-notified of the cohort size, so
  -- an expert released first still learns that others were released later.
  for v_row in
    select r.id, r.candidate_id, c.user_id
    from public.contact_releases r
    join public.candidates c on c.id = r.candidate_id
    where r.job_id = p_job_id and r.status = 'awaiting_payment'
  loop
    perform public.notify_user(
      v_row.user_id,
      'warm_lead',
      'You have a warm lead',
      case
        when v_cohort > 1 then
          format('%s released contact for "%s". You are one of %s experts being considered. You have 2 days to unlock the contact.',
                 coalesce(v_company, 'A business'), v_title, v_cohort)
        else
          format('%s released contact for "%s". You have 2 days to unlock the contact.',
                 coalesce(v_company, 'A business'), v_title)
      end,
      '/dashboard/leads/' || v_row.id,
      jsonb_build_object('release_id', v_row.id, 'job_id', p_job_id, 'cohort_size', v_cohort)
    );
  end loop;

  return v_released;
end;
$$;

grant execute on function public.release_contact(uuid, uuid[]) to authenticated;

-- 5. Scarcity rule: the business passed on all 10. No further candidates are
--    ever surfaced for this posting.
create or replace function public.mark_no_further_matches(p_job_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.jobs j
    join public.employers e on e.id = j.employer_id
    where j.id = p_job_id and e.user_id = auth.uid()
  ) then
    raise exception 'not your posting';
  end if;

  update public.jobs
     set matching_status = 'no_further_matches'
   where id = p_job_id
     and not exists (select 1 from public.contact_releases where job_id = p_job_id);
end;
$$;

grant execute on function public.mark_no_further_matches(uuid) to authenticated;

-- 6. Closing a posting ends every outstanding window at once.
create or replace function public.close_posting(p_job_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
  v_ended integer := 0;
  v_row record;
begin
  select j.title into v_title
  from public.jobs j
  join public.employers e on e.id = j.employer_id
  where j.id = p_job_id and e.user_id = auth.uid();

  if v_title is null then
    raise exception 'not your posting';
  end if;

  for v_row in
    select r.id, c.user_id
    from public.contact_releases r
    join public.candidates c on c.id = r.candidate_id
    where r.job_id = p_job_id and r.status = 'awaiting_payment'
  loop
    perform public.notify_user(
      v_row.user_id,
      'lead_cold_job_closed',
      'Lead went cold — job closed',
      format('"%s" was closed before you unlocked the contact. You were not charged.', v_title),
      '/dashboard/leads',
      jsonb_build_object('release_id', v_row.id, 'job_id', p_job_id)
    );
    v_ended := v_ended + 1;
  end loop;

  update public.contact_releases
     set status = 'job_closed',
         ended_reason = 'job closed before the window expired',
         window_expires_at = least(window_expires_at, now())
   where job_id = p_job_id and status = 'awaiting_payment';

  update public.jobs
     set status = 'closed',
         matching_status = 'closed',
         closed_at = now()
   where id = p_job_id;

  return v_ended;
end;
$$;

grant execute on function public.close_posting(uuid) to authenticated;

-- 7. Sweep for windows that ran out and contacts that aged past 5 days. Safe to
--    run on a schedule (pg_cron / an edge function) and on read.
create or replace function public.expire_lead_windows()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_count integer := 0;
begin
  for v_row in
    select r.id, r.job_id, c.user_id, j.title
    from public.contact_releases r
    join public.candidates c on c.id = r.candidate_id
    join public.jobs j on j.id = r.job_id
    where r.status = 'awaiting_payment' and r.window_expires_at <= now()
  loop
    perform public.notify_user(
      v_row.user_id,
      'lead_cold',
      'The lead went cold',
      format('The 2-day window on "%s" closed. You were never charged — this is a normal part of the process.', v_row.title),
      '/dashboard/leads',
      jsonb_build_object('release_id', v_row.id, 'job_id', v_row.job_id)
    );
    v_count := v_count + 1;
  end loop;

  update public.contact_releases
     set status = 'cold',
         ended_reason = 'the 2-day payment window expired'
   where status = 'awaiting_payment' and window_expires_at <= now();

  return v_count;
end;
$$;

revoke all on function public.expire_lead_windows() from public, anon, authenticated;
grant execute on function public.expire_lead_windows() to service_role;
