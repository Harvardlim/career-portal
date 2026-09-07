-- HR Team Invitations count as referrals too: when an enrolled affiliate sends
-- an HR invitation, a "pending" affiliate_referrals row is created for that
-- email address before the person has an account. When they register with that
-- email the row is claimed (referred_user_id filled), and their first
-- qualifying purchase then earns the commission -- same as a ?ref= link.
--
-- The open "Staff can update affiliate referrals" policy (20260907190000)
-- already lets the just-registered (session-less) user claim the row.
-- Run in the Supabase SQL Editor, or via `supabase db push` once linked.

alter table public.affiliate_referrals
  alter column referred_user_id drop not null,
  add column if not exists invited_email text;

-- One pending invite per (affiliate, email).
create unique index if not exists affiliate_referrals_pending_email_key
  on public.affiliate_referrals (affiliate_id, lower(invited_email))
  where referred_user_id is null;
