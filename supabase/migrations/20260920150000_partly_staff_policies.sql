-- Backoffice access for the partly.asia tables. The backoffice still runs on
-- the anon key (see 20260906150000_admin.sql), so these match the existing
-- open staff policies; tighten them all together when it moves to Supabase Auth.

-- Verification documents live in a private bucket; the review screen needs to
-- mint signed URLs, which requires SELECT on the objects.
drop policy if exists "Staff read verification documents" on storage.objects;
create policy "Staff read verification documents"
  on storage.objects for select
  to anon
  using (bucket_id = 'verification-docs');

-- Owners can see their own uploads too (to re-open what they sent).
drop policy if exists "Users read their own verification documents" on storage.objects;
create policy "Users read their own verification documents"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'verification-docs' and (storage.foldername(name))[1] = auth.uid()::text);

-- Staff can close a posting on a business's behalf (support cases); same
-- cascade as close_posting, without the ownership check.
create or replace function public.admin_close_posting(p_job_id uuid, p_admin_id uuid)
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
  select title into v_title from public.jobs where id = p_job_id;
  if v_title is null then
    raise exception 'posting not found';
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
      jsonb_build_object('release_id', v_row.id, 'job_id', p_job_id, 'closed_by_admin', p_admin_id)
    );
    v_ended := v_ended + 1;
  end loop;

  update public.contact_releases
     set status = 'job_closed',
         ended_reason = 'job closed by partly.asia support',
         window_expires_at = least(window_expires_at, now())
   where job_id = p_job_id and status = 'awaiting_payment';

  update public.jobs
     set status = 'closed', matching_status = 'closed', closed_at = now()
   where id = p_job_id;

  return v_ended;
end;
$$;

grant execute on function public.admin_close_posting(uuid, uuid) to anon, authenticated;
