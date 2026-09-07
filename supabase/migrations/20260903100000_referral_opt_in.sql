-- Referral program opt-in, collected as an optional checkbox on the Consent
-- step of both registration flows (separate from the required T&C/PP agreement).

alter table public.candidates
  add column if not exists referral_opt_in boolean not null default false;

alter table public.employers
  add column if not exists referral_opt_in boolean not null default false;
