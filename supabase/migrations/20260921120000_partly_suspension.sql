-- Freeze accounts and postings from the backoffice.
--
--   Job suspended    -- disappears from every public listing (Open Needs, the
--                       job board, direct link) immediately; a plain SQL flag,
--                       filtered at the query layer like matching_status
--                       already is (RLS can't tell a public visitor from the
--                       backoffice apart -- both use the anon key).
--   Business/Expert
--   suspended        -- can no longer sign in (banned at the Supabase Auth
--                       level by the admin-suspend-account edge function,
--                       which also flips this flag) and, for a business, every
--                       one of their postings is suspended with them.
--
-- The flag alone is not enough to block sign-in on its own -- that needs the
-- edge function's Auth Admin API call -- but the app also checks it right
-- after a successful sign-in and on every session load, so a session that
-- slips in before the ban takes effect is still cut off within one page load.

alter table public.jobs
  add column if not exists suspended boolean not null default false,
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_reason text,
  add column if not exists suspended_by uuid;

alter table public.candidates
  add column if not exists suspended boolean not null default false,
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_reason text,
  add column if not exists suspended_by uuid;

alter table public.employers
  add column if not exists suspended boolean not null default false,
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_reason text,
  add column if not exists suspended_by uuid;

create index if not exists jobs_suspended_idx on public.jobs (suspended) where suspended;

-- Jobs have no login to block, so a plain anon-grantable RPC is enough --
-- matches the existing admin_close_posting / admin_review_verification
-- pattern (trusted the same way the rest of the anon-open backoffice is).
create or replace function public.admin_set_job_suspended(
  p_job_id uuid,
  p_suspended boolean,
  p_reason text,
  p_admin_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
  v_employer_id uuid;
  v_user uuid;
begin
  update public.jobs
     set suspended = p_suspended,
         suspended_at = case when p_suspended then now() else null end,
         suspended_reason = case when p_suspended then p_reason else null end,
         suspended_by = case when p_suspended then p_admin_id else null end
   where id = p_job_id
  returning title, employer_id into v_title, v_employer_id;

  if not found then
    raise exception 'posting not found';
  end if;

  select user_id into v_user from public.employers where id = v_employer_id;

  perform public.notify_user(
    v_user,
    case when p_suspended then 'posting_suspended' else 'posting_reinstated' end,
    case when p_suspended then 'A posting was suspended' else 'Your posting is live again' end,
    case
      when p_suspended and p_reason is not null then format('"%s" was suspended by partly.asia staff: %s', v_title, p_reason)
      when p_suspended then format('"%s" was suspended by partly.asia staff.', v_title)
      else format('"%s" is visible again.', v_title)
    end,
    '/employer/postings'
  );
end;
$$;

grant execute on function public.admin_set_job_suspended(uuid, boolean, text, uuid) to anon, authenticated;

-- Candidate/employer suspension touches Supabase Auth (banning the account),
-- which plain SQL can't do -- these two are DB-side helpers called only by the
-- admin-suspend-account edge function (service role), never directly by the
-- anon-open backoffice, so a flag can never be set without the matching ban.
create or replace function public.admin_set_candidate_suspended(
  p_candidate_id uuid,
  p_suspended boolean,
  p_reason text,
  p_admin_id uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
begin
  update public.candidates
     set suspended = p_suspended,
         suspended_at = case when p_suspended then now() else null end,
         suspended_reason = case when p_suspended then p_reason else null end,
         suspended_by = case when p_suspended then p_admin_id else null end
   where id = p_candidate_id
  returning user_id into v_user;

  if v_user is null then
    raise exception 'expert not found';
  end if;

  perform public.notify_user(
    v_user,
    case when p_suspended then 'account_suspended' else 'account_reinstated' end,
    case when p_suspended then 'Your account has been suspended' else 'Your account is active again' end,
    case when p_suspended
      then coalesce('partly.asia staff suspended your account: ' || p_reason, 'partly.asia staff suspended your account.')
      else 'You can sign in and use partly.asia again.'
    end,
    '/dashboard'
  );

  return v_user;
end;
$$;

revoke all on function public.admin_set_candidate_suspended(uuid, boolean, text, uuid) from public, anon, authenticated;
grant execute on function public.admin_set_candidate_suspended(uuid, boolean, text, uuid) to service_role;

create or replace function public.admin_set_employer_suspended(
  p_employer_id uuid,
  p_suspended boolean,
  p_reason text,
  p_admin_id uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_jobs_frozen integer := 0;
begin
  update public.employers
     set suspended = p_suspended,
         suspended_at = case when p_suspended then now() else null end,
         suspended_reason = case when p_suspended then p_reason else null end,
         suspended_by = case when p_suspended then p_admin_id else null end
   where id = p_employer_id
  returning user_id into v_user;

  if v_user is null then
    raise exception 'business not found';
  end if;

  -- Freezing the business freezes its postings with it. Unsuspending the
  -- business does NOT auto-restore them -- staff may have suspended a
  -- specific posting for its own reason, so each one is reviewed on its own.
  if p_suspended then
    update public.jobs
       set suspended = true,
           suspended_at = now(),
           suspended_reason = coalesce('Business suspended: ' || p_reason, 'Business suspended.'),
           suspended_by = p_admin_id
     where employer_id = p_employer_id and not suspended;
    get diagnostics v_jobs_frozen = row_count;
  end if;

  perform public.notify_user(
    v_user,
    case when p_suspended then 'account_suspended' else 'account_reinstated' end,
    case when p_suspended then 'Your business account has been suspended' else 'Your business account is active again' end,
    case when p_suspended
      then coalesce('partly.asia staff suspended your account, and ' || v_jobs_frozen || ' posting(s) with it: ' || p_reason,
                     'partly.asia staff suspended your account and its postings.')
      else 'You can sign in and use partly.asia again. Postings stay hidden until staff reinstate each one.'
    end,
    '/employer/dashboard'
  );

  return v_user;
end;
$$;

revoke all on function public.admin_set_employer_suspended(uuid, boolean, text, uuid) from public, anon, authenticated;
grant execute on function public.admin_set_employer_suspended(uuid, boolean, text, uuid) to service_role;
