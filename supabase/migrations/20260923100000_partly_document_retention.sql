-- Document retention: don't keep uploaded identity/business-registration
-- documents indefinitely. Once an admin reaches a decision (approved or
-- rejected), the file is auto-purged 90 days later -- only the decision
-- record (status, reviewer, date) is kept permanently, never the file. This
-- is a deliberate data-minimization choice: a breach of "verified on this
-- date, by this reviewer" is far less damaging than a breach of the
-- underlying ID scans and registration documents themselves.
--
-- The 90-day window gives a reasonable buffer for a dispute or re-review
-- before the file disappears. The actual storage deletion happens in the
-- partly-sweep edge function (service role, since deleting a Storage object
-- needs the Storage API, not plain SQL); this migration only adds the column
-- that records when a row was purged.

alter table public.verification_documents
  add column if not exists purged_at timestamptz;

create index if not exists verification_documents_purge_idx
  on public.verification_documents (reviewed_at)
  where status in ('approved', 'rejected') and purged_at is null;
