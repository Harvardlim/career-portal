-- Gaps found on re-reading the spec against what was built:
--   * an Expert's profile lists the sub-categories they serve (LinkedIn-style
--     profile builder); matching should reward overlap with the posting's
--   * "Contact information expires in 5 calendar days. Must have a
--     notification note." -- both parties get a heads-up the day before
--   * "Hire me" badge traffic must be measurable per Expert

-- 1. Sub-categories an Expert serves.
create table if not exists public.candidate_subcategories (
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  subcategory_id uuid not null references public.subcategories (id) on delete cascade,
  primary key (candidate_id, subcategory_id)
);

create index if not exists candidate_subcategories_subcategory_id_idx
  on public.candidate_subcategories (subcategory_id);

alter table public.candidate_subcategories enable row level security;

drop policy if exists "Experts manage their own subcategories" on public.candidate_subcategories;
create policy "Experts manage their own subcategories"
  on public.candidate_subcategories for all
  to authenticated
  using (candidate_id in (select id from public.candidates where user_id = auth.uid()))
  with check (candidate_id in (select id from public.candidates where user_id = auth.uid()));

drop policy if exists "Anyone can read expert subcategories" on public.candidate_subcategories;
create policy "Anyone can read expert subcategories"
  on public.candidate_subcategories for select
  to anon, authenticated
  using (true);

-- Matching: badge (40) > identity (20) > sub-category overlap (up to 30) >
-- category-name overlap (up to 20) > same market (10), then first-come.
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
      (case when c.verified_badge_until > now() then 40 else 0 end)
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

-- 2. Contact-expiry notice, once per release, the day before it lapses.
alter table public.contact_releases
  add column if not exists expiry_notified_at timestamptz;

create or replace function public.notify_contact_expiry()
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
    select r.id, r.contact_expires_at, j.title, c.user_id as expert_user, e.user_id as business_user
    from public.contact_releases r
    join public.jobs j on j.id = r.job_id
    join public.candidates c on c.id = r.candidate_id
    left join public.employers e on e.id = r.employer_id
    where r.status = 'paid'
      and r.expiry_notified_at is null
      and r.contact_expires_at is not null
      and r.contact_expires_at > now()
      and r.contact_expires_at <= now() + interval '1 day'
  loop
    perform public.notify_user(
      v_row.expert_user,
      'contact_expiring',
      'Contact details expire tomorrow',
      format('The business contact for "%s" leaves partly.asia on %s. Save what you need and continue directly with them.',
             v_row.title, to_char(v_row.contact_expires_at, 'DD Mon HH24:MI')),
      '/dashboard/leads/' || v_row.id,
      jsonb_build_object('release_id', v_row.id)
    );
    perform public.notify_user(
      v_row.business_user,
      'contact_expiring',
      'Expert contact details expire tomorrow',
      format('The unlocked expert contact on "%s" leaves partly.asia on %s.',
             v_row.title, to_char(v_row.contact_expires_at, 'DD Mon HH24:MI')),
      '/employer/postings',
      jsonb_build_object('release_id', v_row.id)
    );
    update public.contact_releases set expiry_notified_at = now() where id = v_row.id;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke all on function public.notify_contact_expiry() from public, anon, authenticated;
grant execute on function public.notify_contact_expiry() to service_role;

-- 3. Profile views, so badge traffic can be measured per Expert.
create table if not exists public.expert_profile_views (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  source text not null default 'direct',        -- 'badge' | 'direct' | 'share'
  referrer text,
  viewed_at timestamptz not null default now()
);

create index if not exists expert_profile_views_candidate_id_idx
  on public.expert_profile_views (candidate_id, viewed_at desc);

alter table public.expert_profile_views enable row level security;

drop policy if exists "Anyone can record a profile view" on public.expert_profile_views;
create policy "Anyone can record a profile view"
  on public.expert_profile_views for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Experts read their own profile views" on public.expert_profile_views;
create policy "Experts read their own profile views"
  on public.expert_profile_views for select
  to authenticated
  using (candidate_id in (select id from public.candidates where user_id = auth.uid()));

-- 4. Legacy jobs (created before the partly fields existed) carry only a
--    category name and a free-text location; backfill so they filter and match
--    like postings created through "Post a need".
update public.jobs j
   set main_category_id = c.id
  from public.categories c
 where j.main_category_id is null
   and j.category is not null
   and lower(j.category) = lower(c.name);

update public.jobs
   set country = case
     when location ilike '%singapore%' then 'SG'
     when location ilike '%malaysia%' then 'MY'
     when location ilike '%indonesia%' then 'ID'
     when location ilike '%thailand%' then 'TH'
     when location ilike '%vietnam%' then 'VN'
     else country
   end
 where country is null and location is not null;
