// Sends a single "join our hiring team" invitation email to one HR address,
// used by the "Invite Your HR Team" card on the employer pricing page. The
// card has one Send button per HR row, so this function handles exactly one
// recipient per call.
//
// Body: { email: string, message: string }
// The caller is identified from their Supabase JWT so we can name their company
// in the email and use their address as reply-to.
//
// Required secrets (supabase secrets set NAME=value):
//   RESEND_API_KEY              - from resend.com
//   HR_INVITE_FROM (optional)   - defaults to "Partly Asia <no-reply@partly.asia>"
//   SITE_URL (optional)         - used for a sign-up link in the email
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY - injected by the platform
//
// Local dev: supabase functions serve send-hr-invite --no-verify-jwt

import { createClient } from 'npm:@supabase/supabase-js@2.114.0'
import { corsHeaders, json } from '../_shared/cors.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM_ADDRESS =
  Deno.env.get('HR_INVITE_FROM') ?? 'Partly Asia <no-reply@partly.asia>'
// Invitation links always point at the trial site.
const SITE_URL = 'https://trial.partly.asia'

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderHtml(company: string, message: string, joinLink: string): string {
  const body = escapeHtml(message).replace(/\n/g, '<br />')
  return `
    <div style="font-family: -apple-system, Segoe UI, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h1 style="font-size: 20px; color: #0f172a;">${escapeHtml(
        company,
      )} invited to join on Partly Asia</h1>
      <p style="font-size: 14px; color: #475569; line-height: 1.6; white-space: pre-line;">${body}</p>
      <a href="${joinLink}"
         style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 4px; font-weight: 600;">
        Join us at Partly Asia
      </a>
      <hr style="margin-top: 28px; border: none; border-top: 1px solid #e2e8f0;" />
      <p style="margin-top: 16px; font-size: 12px; color: #94a3b8;">
        If you weren't expecting this, you can ignore this email.<br />
        <a href="https://trial.partly.asia" style="color: #2563eb; text-decoration: none;">trial.partly.asia</a>
      </p>
    </div>
  `
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'Not signed in' }, 401)
  const { data: userData, error: userErr } = await admin.auth.getUser(token)
  if (userErr || !userData.user) return json({ error: 'Not signed in' }, 401)
  const userId = userData.user.id
  const senderEmail = userData.user.email ?? undefined

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  if (!EMAIL_RE.test(email)) return json({ error: 'Enter a valid HR email address' }, 400)
  if (!message) return json({ error: 'The invitation message is empty' }, 400)

  // Works for both an employer sending an HR-team invite and a candidate
  // sending an affiliate invite. The employer profile is optional.
  const [{ data: employer }, { data: candidate }] = await Promise.all([
    admin
      .from('employers')
      .select('id, company_name, business_email')
      .eq('user_id', userId)
      .maybeSingle(),
    admin.from('candidates').select('email, full_name').eq('user_id', userId).maybeSingle(),
  ])
  const company =
    employer?.company_name?.trim() ||
    candidate?.full_name?.trim() ||
    'a team on Partly Asia'

  // Can't invite your own address.
  const ownEmails = [senderEmail, employer?.business_email, candidate?.email]
    .filter((e): e is string => !!e)
    .map((e) => e.toLowerCase())
  if (ownEmails.includes(email.toLowerCase())) {
    return json({ error: "You can't invite your own email address." }, 400)
  }

  const affiliate = (
    await admin
      .from('affiliates')
      .select('id, referral_code, joined_at')
      .eq('user_id', userId)
      .maybeSingle()
  ).data

  if (!employer && !affiliate) {
    return json(
      { error: 'Enrol in the affiliate program before sending invitations.' },
      400,
    )
  }

  // Reject a repeat invitation to the same address from this sender.
  if (employer) {
    const { data: dup } = await admin
      .from('hr_invites')
      .select('id')
      .eq('employer_id', employer.id)
      .ilike('email', email)
      .maybeSingle()
    if (dup) {
      return json(
        { error: 'This email was already invited — use a different address.' },
        409,
      )
    }
  }
  if (affiliate) {
    const { data: dupRef } = await admin
      .from('affiliate_referrals')
      .select('id')
      .eq('affiliate_id', affiliate.id)
      .ilike('invited_email', email)
      .maybeSingle()
    if (dupRef) {
      return json(
        { error: 'This email was already invited — use a different address.' },
        409,
      )
    }
  }

  const joinLink = affiliate?.referral_code
    ? `${SITE_URL}/create-account?ref=${affiliate.referral_code}`
    : `${SITE_URL}/create-account`

  // --- Record the invite + referral FIRST, so tracking doesn't depend on the
  //     email actually being delivered. ---
  if (employer) {
    const { error: insErr } = await admin.from('hr_invites').insert({
      employer_id: employer.id,
      email,
      message,
    })
    if (insErr && insErr.code === '23505') {
      return json(
        { error: 'This email was already invited — use a different address.' },
        409,
      )
    }
  }

  if (affiliate) {
    await recordReferral(affiliate, userId, email)
  }

  // --- Now try to actually send the email. Failure here is non-fatal: the
  //     invitation + referral are already recorded. ---
  let delivered = false
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [email],
        ...(senderEmail ? { reply_to: senderEmail } : {}),
        subject: `${company} invited you to join on Partly Asia`,
        html: renderHtml(company, message, joinLink),
      }),
    })
    delivered = res.ok
    if (!res.ok) {
      console.error('send-hr-invite resend error', res.status, await res.text())
    }
  } catch (err) {
    console.error('send-hr-invite resend threw', err)
  }

  return json({ ok: true, delivered })
})

// Keep in sync with _shared/catalog.ts CREDIT_COMMISSION_USD / MEMBERSHIP_COMMISSION_USD.
const QUALIFYING = {
  credit: (label: string): number =>
    /referral/i.test(label)
      ? 99
      : /2nd repeat/i.test(label)
        ? 30
        : /standard/i.test(label)
          ? 150
          : 0,
  membership: (label: string): number =>
    /yearly/i.test(label) ? 70 : /monthly/i.test(label) ? 30 : 0,
}

/** Create/claim a referral row for `email` under `affiliate`, and backfill the
 *  commission if that person has already made a qualifying purchase. */
async function recordReferral(
  affiliate: { id: string; joined_at: string },
  inviterUserId: string,
  email: string,
): Promise<void> {
  const [{ data: cand }, { data: emp }] = await Promise.all([
    admin
      .from('candidates')
      .select('user_id, created_at')
      .ilike('email', email)
      .maybeSingle(),
    admin
      .from('employers')
      .select('user_id, created_at')
      .ilike('business_email', email)
      .maybeSingle(),
  ])
  const acct = cand ?? emp
  const joinedAt = new Date(affiliate.joined_at).getTime()

  if (!acct?.user_id) {
    // Not registered yet -> pending referral, claimed by email at signup.
    await admin.from('affiliate_referrals').insert({
      affiliate_id: affiliate.id,
      invited_email: email,
      referred_role: 'invited',
    })
    return
  }

  if (acct.user_id === inviterUserId) return // self
  // Rule 3: only attributable if they registered AFTER the affiliate enrolled.
  if (new Date(acct.created_at).getTime() < joinedAt) return

  await admin.from('affiliate_referrals').insert({
    affiliate_id: affiliate.id,
    referred_user_id: acct.user_id,
    referred_role: cand ? 'candidate' : 'employer',
  })
  // 23505 -> already attributed; carry on to the backfill either way.

  const { data: refRow } = await admin
    .from('affiliate_referrals')
    .select('id, commission_status')
    .eq('referred_user_id', acct.user_id)
    .maybeSingle()
  if (!refRow || refRow.commission_status !== 'pending') return

  // Has this person already made a qualifying purchase? Backfill the commission.
  let amount = 0
  let ref = ''
  const { data: emps } = await admin
    .from('employers')
    .select('id')
    .eq('user_id', acct.user_id)
  const empIds = (emps ?? []).map((e) => e.id as string)
  if (empIds.length) {
    const { data: cps } = await admin
      .from('credit_purchases')
      .select('package, created_at')
      .in('employer_id', empIds)
      .eq('status', 'paid')
      .order('created_at', { ascending: true })
    for (const p of cps ?? []) {
      const c = QUALIFYING.credit(p.package as string)
      if (c > 0) {
        amount = c
        ref = p.package as string
        break
      }
    }
  }
  if (!amount) {
    const { data: cands } = await admin
      .from('candidates')
      .select('id')
      .eq('user_id', acct.user_id)
    const candIds = (cands ?? []).map((c) => c.id as string)
    if (candIds.length) {
      const { data: ms } = await admin
        .from('memberships')
        .select('plan, created_at')
        .in('candidate_id', candIds)
        .eq('status', 'active')
        .order('created_at', { ascending: true })
      for (const m of ms ?? []) {
        const c = QUALIFYING.membership(m.plan as string)
        if (c > 0) {
          amount = c
          ref = m.plan as string
          break
        }
      }
    }
  }

  if (amount > 0) {
    await admin
      .from('affiliate_referrals')
      .update({
        purchase_source: 'backfill',
        purchase_ref: ref,
        commission_usd: amount,
        commission_status: 'earned',
        earned_at: new Date().toISOString(),
      })
      .eq('id', refRow.id)
      .eq('commission_status', 'pending')
  }
}
