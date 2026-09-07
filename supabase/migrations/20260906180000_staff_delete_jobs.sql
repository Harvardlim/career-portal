-- The backoffice "Job List" screen can delete a job. Auth for the backoffice
-- isn't wired up yet, so this DELETE policy is open to the anon/publishable key,
-- matching "Staff can delete candidates" / "Staff can delete employers".
-- Tighten to an authenticated staff role once backoffice sign-in reaches the
-- database layer.

drop policy if exists "Staff can delete jobs" on public.jobs;
create policy "Staff can delete jobs"
  on public.jobs for delete
  to anon, authenticated
  using (true);
