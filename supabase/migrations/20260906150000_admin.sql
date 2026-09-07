-- Backoffice admin accounts + sign-in.
--
-- The backoffice has had no auth at all (its RLS policies are open to the
-- anon/publishable key, "tighten later"). This adds a self-contained admin
-- login: a private `public.admin` table whose password hashes never leave the
-- database, reached only through SECURITY DEFINER functions.
--
-- NOTE: like the rest of the backoffice, `admin_create` / `admin_list` /
-- `admin_change_password` are callable with the publishable key. That is
-- acceptable only because every backoffice table is already anon-accessible.
-- The real fix later is to put the whole backoffice behind Supabase Auth and
-- check `auth.uid()` in these functions.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.admin (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  constraint admin_email_key unique (email)
);

alter table public.admin enable row level security;
-- No policies + no grants: unreachable via PostgREST. All access goes through
-- the functions below.
revoke all on public.admin from anon, authenticated;

-- Verify an email + password, returning the admin identity on success (0 rows
-- on failure).
create or replace function public.admin_login(p_email text, p_password text)
returns table (id uuid, name text, email text)
language sql
security definer
set search_path = public, extensions
as $$
  select a.id, a.name, a.email
  from public.admin a
  where lower(a.email) = lower(trim(p_email))
    and a.password_hash = crypt(p_password, a.password_hash);
$$;

create or replace function public.admin_list()
returns table (id uuid, name text, email text, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select a.id, a.name, a.email, a.created_at
  from public.admin a
  order by a.created_at asc;
$$;

create or replace function public.admin_create(p_name text, p_email text, p_password text)
returns table (id uuid, name text, email text, created_at timestamptz)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  new_id uuid;
begin
  if length(coalesce(trim(p_name), '')) = 0 then
    raise exception 'Name is required';
  end if;
  if p_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'A valid email is required';
  end if;
  if length(coalesce(p_password, '')) < 8 then
    raise exception 'Password must be at least 8 characters';
  end if;

  insert into public.admin (name, email, password_hash)
  values (trim(p_name), lower(trim(p_email)), crypt(p_password, gen_salt('bf')))
  returning admin.id into new_id;

  return query
    select a.id, a.name, a.email, a.created_at from public.admin a where a.id = new_id;
exception
  when unique_violation then
    raise exception 'An admin with that email already exists';
end;
$$;

create or replace function public.admin_change_password(p_email text, p_current text, p_new text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if length(coalesce(p_new, '')) < 8 then
    raise exception 'New password must be at least 8 characters';
  end if;
  if not exists (
    select 1 from public.admin a
    where lower(a.email) = lower(trim(p_email))
      and a.password_hash = crypt(p_current, a.password_hash)
  ) then
    raise exception 'Current password is incorrect';
  end if;

  update public.admin
  set password_hash = crypt(p_new, gen_salt('bf'))
  where lower(email) = lower(trim(p_email));
  return true;
end;
$$;

revoke all on function public.admin_login(text, text) from public;
revoke all on function public.admin_list() from public;
revoke all on function public.admin_create(text, text, text) from public;
revoke all on function public.admin_change_password(text, text, text) from public;
grant execute on function public.admin_login(text, text) to anon, authenticated;
grant execute on function public.admin_list() to anon, authenticated;
grant execute on function public.admin_create(text, text, text) to anon, authenticated;
grant execute on function public.admin_change_password(text, text, text) to anon, authenticated;

-- Bootstrap login. Change this password from Account settings after first sign-in.
-- Schema-qualified because this statement runs outside the functions' search_path.
insert into public.admin (name, email, password_hash)
values (
  'Admin',
  'admin@career-portal.local',
  extensions.crypt('changeme123', extensions.gen_salt('bf'))
)
on conflict (email) do nothing;
