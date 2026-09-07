-- Job detail card fields shown on the public job page that had no column yet:
-- "Hours" (e.g. "30-40 hrs/week") and "Duration" (e.g. "12 months").
-- Free text so employers/staff can phrase them however they like.
-- Workplace type (On-site / Hybrid / Remote) and the rate columns
-- (salary_min / salary_max / salary_type / salary_label) already exist.

alter table public.jobs
  add column if not exists hours text,
  add column if not exists duration text;
