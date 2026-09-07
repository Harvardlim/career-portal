-- The backoffice "Users" screen can delete candidate/employer accounts.
-- Auth for the backoffice isn't wired up yet, so these DELETE policies are open
-- to the anon/publishable key -- tighten to an authenticated staff role once
-- backoffice sign-in exists.

drop policy if exists "Staff can delete candidates" on public.candidates;
create policy "Staff can delete candidates"
  on public.candidates for delete
  to anon, authenticated
  using (true);

drop policy if exists "Staff can delete employers" on public.employers;
create policy "Staff can delete employers"
  on public.employers for delete
  to anon, authenticated
  using (true);

-- Allow removing the uploaded resume alongside the candidate row.
drop policy if exists "Staff can delete resumes" on storage.objects;
create policy "Staff can delete resumes"
  on storage.objects for delete
  to anon, authenticated
  using (bucket_id = 'resumes');
