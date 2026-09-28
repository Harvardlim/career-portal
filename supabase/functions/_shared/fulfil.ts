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
import { emailShell, escapeHtml, sendEmail, SITE_URL } from './email.ts'

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

// Stripe never emails receipts for test-mode payments, and in live mode only
// when "Successful payments" emails are switched on in the Dashboard -- so
// partly.asia sends its own. Only the call that actually flipped the row
// ('granted') sends it, so the webhook and the browser confirm can't both.
const ZERO_DECIMAL = new Set(['bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf'])

const RECEIPT_ITEM: Record<string, string> = {
  lead_unlock: 'Released-lead contact unlock',
  verified_badge: 'Fully verified badge (1 year)',
  employer_verified_badge: 'Fully verified business badge (1 year)',
  credits: 'Job-posting credits',
  membership: 'Membership',
}

function formatPaid(amountMinor: number, currency: string): string {
  const cur = currency.toLowerCase()
  const major = ZERO_DECIMAL.has(cur) ? amountMinor : amountMinor / 100
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur.toUpperCase() }).format(major)
  } catch {
    return `${cur.toUpperCase()} ${major.toLocaleString('en-US')}`
  }
}

/** The Stripe invoice's PDF + hosted page, when the session created one. */
async function invoiceLinks(stripe: Stripe | undefined, session: Stripe.Checkout.Session): Promise<{ pdf?: string; page?: string }> {
  const id = typeof session.invoice === 'string' ? session.invoice : session.invoice?.id
  if (!stripe || !id) return {}
  try {
    const inv = await stripe.invoices.retrieve(id)
    return { pdf: inv.invoice_pdf ?? undefined, page: inv.hosted_invoice_url ?? undefined }
  } catch (err) {
    console.error('invoice lookup failed', err)
    return {}
  }
}

const BADGE_TABLE: Record<string, 'verified_badges' | 'employer_verified_badges'> = {
  verified_badge: 'verified_badges',
  employer_verified_badge: 'employer_verified_badges',
}

/**
 * Where a just-paid badge stands. 'active' means the document was approved
 * before payment, so the badge switched on with the payment; anything else is
 * waiting for the document review. A live badge is stamped as announced here
 * because this payment email already says so -- notify-badge-active then
 * won't send a duplicate.
 */
async function badgeState(
  admin: SupabaseClient,
  kind: string,
  badgeId: string | undefined,
): Promise<{ live: boolean; until: string | null }> {
  const table = BADGE_TABLE[kind]
  if (!table || !badgeId) return { live: false, until: null }
  const { data } = await admin.from(table).select('status, expires_at').eq('id', badgeId).maybeSingle()
  const live = data?.status === 'active'
  if (live) {
    await admin
      .from(table)
      .update({ activation_emailed_at: new Date().toISOString() })
      .eq('id', badgeId)
      .is('activation_emailed_at', null)
  }
  return { live, until: live ? ((data?.expires_at as string | null) ?? null) : null }
}

async function sendReceipt(session: Stripe.Checkout.Session, admin: SupabaseClient, stripe?: Stripe): Promise<void> {
  const to = session.customer_details?.email ?? session.customer_email ?? ''
  if (!to || session.amount_total == null || !session.currency) return
  const kind = session.metadata?.kind ?? ''
  const item = RECEIPT_ITEM[kind] ?? 'partly.asia payment'
  const amount = formatPaid(session.amount_total, session.currency)
  const paidOn = new Date((session.created ?? Date.now() / 1000) * 1000).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const ref = typeof session.payment_intent === 'string' ? session.payment_intent : session.id
  const inv = await invoiceLinks(stripe, session)
  const isBadge = kind in BADGE_TABLE
  const isExpertBadge = kind === 'verified_badge'
  const badge = isBadge ? await badgeState(admin, kind, session.metadata?.badge_id) : null
  const badgeNote = badge
    ? badge.live
      ? `<p style="margin-top:16px;"><b>Your Fully verified badge is live</b>${
          badge.until ? ` and stays active until <b>${escapeHtml(new Date(badge.until).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }))}</b>` : ''
        }. Your ${isExpertBadge ? 'identity' : 'registration'} document was already approved.</p>`
      : `<p style="margin-top:16px;"><b>What happens next:</b> your ${
          isExpertBadge ? 'identity' : 'registration'
        } document is now with our team. Once it's approved your badge goes live and we'll email you again , there's nothing else you need to do.</p>`
    : ''
  const row = (k: string, v: string) =>
    `<tr><td style="padding:6px 0;color:#64748b;">${escapeHtml(k)}</td><td style="padding:6px 0;text-align:right;color:#1b2a4a;font-weight:600;">${escapeHtml(v)}</td></tr>`
  const html = emailShell(
    'Payment receipt',
    `<p>Thank you , we've received your payment.</p>
     <table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:14px;">
       ${row('Item', item)}
       ${row('Amount paid', amount)}
       ${row('Date', paidOn)}
       ${row('Reference', ref)}
     </table>
     ${
       inv.pdf || inv.page
         ? `<p style="margin-top:16px;">Your invoice: ${inv.pdf ? `<a href="${inv.pdf}" style="color:#d4a12a;">Download invoice (PDF)</a>` : ''}${inv.pdf && inv.page ? ' · ' : ''}${inv.page ? `<a href="${inv.page}" style="color:#d4a12a;">View online</a>` : ''}</p>`
         : ''
     }
     ${badgeNote}
     <p style="margin-top:16px;">Keep this email for your records.</p>`,
    isBadge ? `${SITE_URL}${isExpertBadge ? '/dashboard/verification' : '/employer/verification'}` : `${SITE_URL}/dashboard`,
    isBadge ? 'View my verification' : 'Open my dashboard',
  )
  const subject = badge
    ? `Payment received , your Fully verified badge is ${badge.live ? 'live' : 'under review'}`
    : `Your partly.asia receipt , ${amount}`
  await sendEmail(to, subject, html)
}

// The in-app bell already tells the business (confirm_lead_unlock writes it),
// but that only helps if they are signed in -- so they get an email as well
// the moment the expert pays. It names the expert but leaves the contact
// details on the platform, in line with the on-platform-only rule.
async function notifyBusinessOfUnlock(admin: SupabaseClient, releaseId: string): Promise<void> {
  const { data: release } = await admin
    .from('contact_releases')
    .select('job_id, contact_expires_at, employers(business_email, company_name), candidates(full_name), jobs(title)')
    .eq('id', releaseId)
    .maybeSingle()
  if (!release) return
  const row = release as unknown as {
    job_id: string
    contact_expires_at: string | null
    employers: { business_email: string | null; company_name: string | null } | null
    candidates: { full_name: string | null } | null
    jobs: { title: string | null } | null
  }
  const to = row.employers?.business_email
  if (!to) return
  const expert = row.candidates?.full_name?.trim() || 'An expert'
  const title = row.jobs?.title ?? 'your posting'
  const until = row.contact_expires_at
    ? new Date(row.contact_expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null
  await sendEmail(
    to,
    `${expert} unlocked your contact , "${title}"`,
    emailShell(
      'An expert unlocked your contact',
      `<p><b>${escapeHtml(expert)}</b> has paid to unlock your contact details for <b>${escapeHtml(title)}</b>, so you can now see theirs too.</p>
       <p>Both sides can see each other's contact details${until ? ` until <b>${escapeHtml(until)}</b>` : ' for 5 days'}. Reach out while it's live and keep the conversation on partly.asia.</p>`,
      `${SITE_URL}/employer/postings/${row.job_id}/matches`,
      'View their contact details',
    ),
  )
}

export async function fulfilCheckoutSession(
  admin: SupabaseClient,
  session: Stripe.Checkout.Session,
  stripe?: Stripe,
): Promise<FulfilResult> {
  const result = await fulfil(admin, session)
  if (result === 'granted') {
    try {
      await sendReceipt(session, admin, stripe)
    } catch (err) {
      console.error('receipt email failed', err)
    }
    if (session.metadata?.kind === 'lead_unlock' && session.metadata.release_id) {
      try {
        await notifyBusinessOfUnlock(admin, session.metadata.release_id)
      } catch (err) {
        console.error('business unlock email failed', err)
      }
    }
  }
  return result
}

async function fulfil(
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

  // partly.asia: the DB functions own the state change (contact exchange /
  // badge activation), the notifications and the fixed affiliate commission,
  // and are idempotent through their status guards.
  if (meta.kind === 'lead_unlock') {
    if (!meta.release_id) throw new Error('lead_unlock session missing release_id')
    if (meta.payment_id) {
      await admin
        .from('lead_unlock_payments')
        .update({ stripe_payment_intent: paymentIntent })
        .eq('id', meta.payment_id)
    }
    const { data, error } = await admin.rpc('confirm_lead_unlock', {
      p_release_id: meta.release_id,
    })
    if (error) throw error
    return data === true ? 'granted' : 'already_done'
  }

  if (meta.kind === 'verified_badge') {
    if (!meta.badge_id) throw new Error('verified_badge session missing badge_id')
    await admin
      .from('verified_badges')
      .update({ stripe_payment_intent: paymentIntent })
      .eq('id', meta.badge_id)
    const { data, error } = await admin.rpc('confirm_badge_purchase', {
      p_badge_id: meta.badge_id,
    })
    if (error) throw error
    return data === true ? 'granted' : 'already_done'
  }

  if (meta.kind === 'employer_verified_badge') {
    if (!meta.badge_id) throw new Error('employer_verified_badge session missing badge_id')
    await admin
      .from('employer_verified_badges')
      .update({ stripe_payment_intent: paymentIntent })
      .eq('id', meta.badge_id)
    const { data, error } = await admin.rpc('confirm_employer_badge_purchase', {
      p_badge_id: meta.badge_id,
    })
    if (error) throw error
    return data === true ? 'granted' : 'already_done'
  }

  return 'ignored'
}
