-- Let admins remove other admins from the backoffice "Admin List" screen.
-- Same access model as the other admin_* functions (SECURITY DEFINER, callable
-- with the publishable key because the whole backoffice is anon-open for now).
-- Guard: the last remaining admin can't be deleted, so the backoffice can't be
-- locked out.

create or replace function public.admin_delete(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.admin where id = p_id) then
    raise exception 'Admin not found';
  end if;
  if (select count(*) from public.admin) <= 1 then
    raise exception 'Cannot remove the last admin';
  end if;

  delete from public.admin where id = p_id;
  return true;
end;
$$;

revoke all on function public.admin_delete(uuid) from public;
grant execute on function public.admin_delete(uuid) to anon, authenticated;
