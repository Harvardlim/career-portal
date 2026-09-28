-- Fully verified badge emails: one when the payment goes through, another once
-- the document is approved and the badge is live. The second one is sent by the
-- notify-badge-active edge function (called by the backoffice after an
-- approval); this column is its once-only guard, so re-approving a document or
-- calling the function twice can never email the same activation twice.
--
-- A badge that switches on at payment time (document already approved) is
-- covered by the payment email itself, which stamps the column.

alter table public.verified_badges
  add column if not exists activation_emailed_at timestamptz;
alter table public.employer_verified_badges
  add column if not exists activation_emailed_at timestamptz;

-- Badges that are already live (or finished) predate this email: never send them one.
update public.verified_badges
   set activation_emailed_at = now()
 where activation_emailed_at is null and status in ('active', 'superseded', 'expired');
update public.employer_verified_badges
   set activation_emailed_at = now()
 where activation_emailed_at is null and status in ('active', 'superseded', 'expired');
