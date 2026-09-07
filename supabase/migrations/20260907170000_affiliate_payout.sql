-- Payout tracking for affiliate commissions. A commission moves
-- 'pending' -> 'earned' (on the referred user's first qualifying purchase, done
-- by the Stripe fulfilment path) -> 'paid' (marked by staff once the money is
-- actually sent). "Balance" shown to the affiliate is earned-but-not-yet-paid.
-- Run in the Supabase SQL Editor, or via `supabase db push` once linked.

alter table public.affiliate_referrals
  add column if not exists paid_at timestamptz;

-- commission_status is a free-text column; 'paid' is now also valid alongside
-- 'pending' and 'earned'. No constraint change needed.
