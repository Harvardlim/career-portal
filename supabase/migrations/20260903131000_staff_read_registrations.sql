-- The backoffice "Users" screen needs to read the public registration tables.
-- Auth for the backoffice isn't wired up yet, so these SELECT policies are open
-- to the anon/publishable key -- tighten them to an authenticated staff role
-- once backoffice sign-in exists. The existing INSERT-only policies are
-- unchanged, so the public sign-up flows keep working as before.

drop policy if exists "Staff can read candidates" on public.candidates;
create policy "Staff can read candidates"
  on public.candidates for select
  to anon, authenticated
  using (true);

drop policy if exists "Staff can read employers" on public.employers;
create policy "Staff can read employers"
  on public.employers for select
  to anon, authenticated
  using (true);
