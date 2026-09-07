-- The employer "View Applicant" dialog needs to show the resume the candidate
-- attached when they applied. The candidate_resumes table is otherwise
-- owner-only (see 20260906120000_candidate_profile.sql), so add a scoped read:
-- an employer may read a resume row when it is referenced by an application to
-- one of their own jobs. Creating a signed URL for the file itself in the
-- private "resumes" bucket is already allowed (20260903141000_staff_read_resumes.sql).
-- Run in the Supabase SQL Editor, or via `supabase db push` once linked.

drop policy if exists "Employers read resumes on applications to their jobs" on public.candidate_resumes;
create policy "Employers read resumes on applications to their jobs"
  on public.candidate_resumes
  for select
  to authenticated
  using (
    id in (
      select ja.resume_id
      from public.job_applications ja
      join public.jobs j on j.id = ja.job_id
      join public.employers e on e.id = j.employer_id
      where e.user_id = auth.uid()
    )
  );
