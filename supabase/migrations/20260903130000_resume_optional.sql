-- Resume / CV is now optional on the candidate registration form.
alter table public.candidates
  alter column resume_path drop not null;
