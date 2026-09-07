-- The backoffice candidate detail page lists a candidate's uploaded CVs.
-- candidate_resumes previously only had owner/employer SELECT policies, so the
-- anon/publishable key saw nothing. Add an open staff read, matching
-- "Staff can read candidates" / "Staff can read resumes" (storage). Tighten to
-- an authenticated staff role once backoffice sign-in reaches the database.

drop policy if exists "Staff can read candidate resumes" on public.candidate_resumes;
create policy "Staff can read candidate resumes"
  on public.candidate_resumes for select
  to anon, authenticated
  using (true);
