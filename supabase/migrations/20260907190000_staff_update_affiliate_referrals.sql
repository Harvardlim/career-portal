-- The backoffice "Affiliates" screen marks a commission as paid
-- ('earned' -> 'paid', sets paid_at). Auth for the backoffice isn't wired up at
-- the DB layer yet, so this UPDATE policy is open to the anon/publishable key,
-- matching the other "Staff can update ..." policies. Tighten to an
-- authenticated staff role once backoffice sign-in reaches the database.

drop policy if exists "Staff can update affiliate referrals" on public.affiliate_referrals;
create policy "Staff can update affiliate referrals"
  on public.affiliate_referrals for update
  to anon, authenticated
  using (true)
  with check (true);
