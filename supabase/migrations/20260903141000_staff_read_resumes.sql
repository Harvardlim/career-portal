-- The backoffice candidate detail view needs to open uploaded resumes, which
-- means creating signed URLs for objects in the private "resumes" bucket. That
-- requires SELECT on storage.objects for the bucket. Auth for the backoffice
-- isn't wired up yet, so this is open to the anon/publishable key -- tighten to
-- an authenticated staff role once backoffice sign-in exists. The existing
-- INSERT-only policy for public uploads is unchanged.

drop policy if exists "Staff can read resumes" on storage.objects;
create policy "Staff can read resumes"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'resumes');
