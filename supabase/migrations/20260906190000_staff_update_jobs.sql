-- The backoffice "Job List" screen can edit a job (title, status, category,
-- salary, expiry, etc.). Auth for the backoffice isn't wired up at the DB layer
-- yet, so this UPDATE policy is open to the anon/publishable key, matching the
-- other "Staff can ..." policies. Tighten to an authenticated staff role once
-- backoffice sign-in reaches the database.

drop policy if exists "Staff can update jobs" on public.jobs;
create policy "Staff can update jobs"
  on public.jobs for update
  to anon, authenticated
  using (true)
  with check (true);
