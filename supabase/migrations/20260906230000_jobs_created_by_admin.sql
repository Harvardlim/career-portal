-- Track when a job was created from the backoffice by an admin (vs. posted by
-- an employer). Used only for a "created by admin" indicator in the backoffice.
-- Nullable: employer-posted and seed jobs leave it null.

alter table public.jobs
  add column if not exists created_by_admin uuid references public.admin (id) on delete set null;
