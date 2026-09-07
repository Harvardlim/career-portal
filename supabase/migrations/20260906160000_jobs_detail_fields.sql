-- Richer job posting fields for the Job Detail page and the employer
-- "Post a Job" form, modelled on a typical external job listing (overview
-- summary, workplace type, requirements, benefits) plus a company-info
-- snapshot so imported/external postings render without an employer row.
-- Additive only. Run in the Supabase SQL Editor or via `supabase db push`.

alter table public.jobs
  add column if not exists summary text,
  add column if not exists workplace_type text,   -- 'On-site' | 'Hybrid' | 'Remote'
  add column if not exists requirements text,
  add column if not exists benefits text,
  add column if not exists company_about text,
  add column if not exists company_website text,
  add column if not exists company_email text,
  add column if not exists company_phone text,
  add column if not exists company_industry text,
  add column if not exists company_size text,
  add column if not exists company_founded text,
  add column if not exists company_logo_url text;
