-- Expert profile rules the web form now enforces, backed up in the database
-- so a direct API write can't get around them:
--
--  1. Experts must be 18 or older. Only month + year of birth is stored, so
--     the day is unknown: the whole month of the 18th birthday must have passed
--     (birth month + 217 months <= this month). Checked when a date of birth
--     is inserted or changed -- existing rows aren't rewritten by unrelated
--     updates (e.g. verification).
--  2. An expert can't apply until their experience summary is filled in
--     (alongside years of experience + a category, as before).

create or replace function public.minimise_candidate_personal_data()
returns trigger
language plpgsql
as $$
begin
  if new.date_of_birth is not null then
    new.date_of_birth := date_trunc('month', new.date_of_birth)::date;
    if (tg_op = 'INSERT' or new.date_of_birth is distinct from old.date_of_birth)
       and new.date_of_birth + interval '217 months' > date_trunc('month', current_date) then
      raise exception 'You must be 18 or older to be an expert on partly.asia.';
    end if;
  end if;
  new.marital_status := null;
  return new;
end;
$$;

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

  if coalesce(trim(v_cand.past_experience), '') = '' then
    raise exception 'Complete your profile before applying: add your experience summary.';
  end if;

  return new;
end;
$$;
