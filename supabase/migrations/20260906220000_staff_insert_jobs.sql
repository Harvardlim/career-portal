-- The backoffice "Job List" screen can create a job (draft) directly.
-- Auth for the backoffice isn't wired up at the DB layer yet, so this INSERT
-- policy is open to the anon/publishable key, matching the other "Staff can ..."
-- policies on public.jobs. Tighten to an authenticated staff role once
-- backoffice sign-in reaches the database.

drop policy if exists "Staff can insert jobs" on public.jobs;
create policy "Staff can insert jobs"
  on public.jobs for insert
  to anon, authenticated
  with check (true);
