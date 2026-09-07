// Shared fulfilment: turn a paid Checkout Session into granted credits / an
// active membership. Used by BOTH stripe-webhook (Stripe -> us) and
// stripe-confirm (browser return from Stripe). Every write is guarded on the
// row still being 'pending', so calling this twice for the same session is a
// no-op.

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.114.0'
import type Stripe from 'npm:stripe@17.7.0'
import {
  CREDIT_COMMISSION_USD,
  MEMBERSHIP_COMMISSION_USD,
  isCreditPackageKey,
  isMembershipPlanKey,
} from './catalog.ts'

export type FulfilResult =
  | 'granted' // this call flipped the row
  | 'already_done' // a previous call (or the webhook) already did it
  | 'not_paid' // session isn't paid yet
  | 'ignored' // unrecognised metadata

const DAY_MS = 86_400_000

// Fill the referred user's affiliate_referrals row on their first qualifying
// purchase. The row only exists if the buyer registered via an enrolled
// affiliate's link (see 20260907160000_affiliate_referrals.sql), so this is a
// no-op for everyone else. Guarded on commission_status = 'pending' -> idempotent.
async function recordAffiliateCommission(
  admin: SupabaseClient,
  userId: string | null | undefined,
  source: 'credits' | 'membership',
  ref: string,
  amountUsd: number,
): Promise<void> {
  if (!userId) return
  const { error } = await admin
    .from('affiliate_referrals')
    .update({
      purchase_source: source,
      purchase_ref: ref,
      commission_usd: amountUsd,
      commission_status: 'earned',
      earned_at: new Date().toISOString(),
    })
    .eq('referred_user_id', userId)
    .eq('commission_status', 'pending')
  if (error) console.error('affiliate commission update failed', error)
}

async function userIdForEmployer(
  admin: SupabaseClient,
  employerId: string | undefined,
): Promise<string | null> {
  if (!employerId) return null
  const { data } = await admin
    .from('employers')
    .select('user_id')
    .eq('id', employerId)
    .maybeSingle()
  return (data?.user_id as string) ?? null
}

async function userIdForCandidate(
  admin: SupabaseClient,
  candidateId: string | undefined,
): Promise<string | null> {
  if (!candidateId) return null
  const { data } = await admin
    .from('candidates')
    .select('user_id')
    .eq('id', candidateId)
    .maybeSingle()
  return (data?.user_id as string) ?? null
}

export async function fulfilCheckoutSession(
  admin: SupabaseClient,
  session: Stripe.Checkout.Session,
): Promise<FulfilResult> {
  if (session.payment_status !== 'paid') return 'not_paid'

  const meta = session.metadata ?? {}
  const paymentIntent =
    typeof session.payment_intent === 'string' ? session.payment_intent : null

  if (meta.kind === 'credits') {
    const purchaseId = meta.purchase_id
    if (!purchaseId) throw new Error('credits session missing purchase_id')

    const { data: updated, error } = await admin
      .from('credit_purchases')
      .update({ status: 'paid', stripe_payment_intent: paymentIntent })
      .eq('id', purchaseId)
      .eq('status', 'pending')
      .select('id')
    if (error) throw error
    if (!updated || updated.length === 0) return 'already_done'

    const grantDays = Number(meta.grant_membership ?? '0')
    if (grantDays > 0 && meta.employer_id) {
      const { data: existing } = await admin
        .from('employer_memberships')
        .select('id')
        .eq('employer_id', meta.employer_id)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()
      if (!existing) {
        const now = new Date()
        const expires = new Date(now.getTime() + grantDays * DAY_MS)
        const { error: mErr } = await admin.from('employer_memberships').insert({
          employer_id: meta.employer_id,
          status: 'active',
          started_at: now.toISOString(),
          expires_at: expires.toISOString(),
          source_purchase_id: purchaseId,
        })
        if (mErr) throw mErr
      }
    }

    if (isCreditPackageKey(meta.package_key)) {
      const userId = await userIdForEmployer(admin, meta.employer_id)
      await recordAffiliateCommission(
        admin,
        userId,
        'credits',
        meta.package_label ?? meta.package_key,
        CREDIT_COMMISSION_USD[meta.package_key],
      )
    }
    return 'granted'
  }

  if (meta.kind === 'membership') {
    const membershipId = meta.membership_id
    if (!membershipId) throw new Error('membership session missing membership_id')
    const days = Number(meta.days ?? '30')
    const now = new Date()
    const expires = new Date(now.getTime() + days * DAY_MS)

    const { data: updated, error } = await admin
      .from('memberships')
      .update({
        status: 'active',
        stripe_payment_intent: paymentIntent,
        started_at: now.toISOString(),
        expires_at: expires.toISOString(),
      })
      .eq('id', membershipId)
      .eq('status', 'pending')
      .select('id')
    if (error) throw error
    if (!updated || updated.length === 0) return 'already_done'

    if (isMembershipPlanKey(meta.plan_key)) {
      const userId = await userIdForCandidate(admin, meta.candidate_id)
      await recordAffiliateCommission(
        admin,
        userId,
        'membership',
        meta.plan_label ?? meta.plan_key,
        MEMBERSHIP_COMMISSION_USD[meta.plan_key],
      )
    }
    return 'granted'
  }

  return 'ignored'
}
