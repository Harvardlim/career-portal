-- Every need now carries an expiry date. New postings live 30 days (the same
-- window the legacy job board used); the app only ever set expires_at on the
-- old credit-based flow, so partly needs showed no expiry at all.
--
--  1. default expiry on insert (posted_at + 30 days) for any business-owned row
--  2. backfill existing business-owned rows with no expiry -- at least 14 days
--     from now, so needs that are already live don't vanish the moment this
--     ships
--  3. applications are refused once a need has expired (the feed and job page
--     hide/flag it too)

create or replace function public.set_default_job_expiry()
returns trigger
language plpgsql
as $$
begin
  if new.expires_at is null and new.employer_id is not null then
    new.expires_at := coalesce(new.posted_at, now()) + interval '30 days';
  end if;
  return new;
end;
$$;

drop trigger if exists jobs_default_expiry on public.jobs;
create trigger jobs_default_expiry
  before insert on public.jobs
  for each row execute function public.set_default_job_expiry();

update public.jobs
   set expires_at = greatest(coalesce(posted_at, created_at) + interval '30 days', now() + interval '14 days')
 where expires_at is null
   and employer_id is not null
   and status = 'active';

create or replace function public.guard_application_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cand public.candidates;
  v_job public.jobs;
  v_category text;
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
    -- A posting with no business behind it (a bare backoffice listing) can
    -- never draw matches, so an application there would just sit forever.
    if v_job.employer_id is null then
      raise exception 'This listing isn''t taking applications on partly.asia.';
    end if;
    if v_job.suspended or v_job.matching_status in ('closed', 'no_further_matches') then
      raise exception 'This need is no longer open for applications.';
    end if;
    if v_job.expires_at is not null and v_job.expires_at <= now() then
      raise exception 'This need has expired and is no longer taking applications.';
    end if;
    if (select count(*) from public.posting_matches where job_id = new.job_id) >= 10 then
      raise exception 'This need already has its full shortlist of 10 experts.';
    end if;
  end if;

  -- Experts apply only within the categories they serve. A posting with no
  -- category at all (legacy rows) isn't restricted.
  v_category := coalesce((select name from public.categories where id = v_job.main_category_id), v_job.category);
  if v_category is not null and not exists (
    select 1 from unnest(coalesce(v_cand.expertise_field, '{}'::text[])) f
    where lower(trim(f)) = lower(trim(v_category))
  ) then
    raise exception 'This need is in %, which isn''t one of the categories you serve.', v_category;
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
