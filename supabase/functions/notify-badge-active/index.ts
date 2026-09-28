// Emails the owner of a Fully verified badge the moment the badge goes live
// after document approval (the second of the two badge emails; the first is the
// payment email sent by _shared/fulfil.ts). Works for both the expert badge and
// the business badge.
//
// Called by the backoffice right after an approval succeeds.
// Body: { document_id: uuid }
//
// Idempotent: the badge row is claimed by stamping activation_emailed_at
// before sending, so a repeat call (or re-approving the document) is a no-op.
// If the send itself fails the stamp is cleared so a later call can retry.
//
// Auth note: like every other backoffice-called function (see
// admin-suspend-account) this trusts the caller; verify_jwt is off in
// config.toml. It can only ever email a badge owner about their own badge, and
// only once per badge.
//
// Required secrets: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (injected),
// RESEND_API_KEY (+ optional RESEND_FROM, SITE_URL)

import { createClient } from 'npm:@supabase/supabase-js@2.114.0'
import { corsHeaders, json } from '../_shared/cors.ts'
import { emailShell, escapeHtml, sendEmail, SITE_URL } from '../_shared/email.ts'

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

type Owner = { table: 'verified_badges' | 'employer_verified_badges'; fk: 'candidate_id' | 'employer_id' }
const OWNER: Record<string, Owner> = {
  candidate: { table: 'verified_badges', fk: 'candidate_id' },
  employer: { table: 'employer_verified_badges', fk: 'employer_id' },
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }
  const documentId = typeof body.document_id === 'string' ? body.document_id : ''
  if (!documentId) return json({ error: 'Missing document_id' }, 400)

  try {
    const { data: doc } = await admin
      .from('verification_documents')
      .select('owner_kind, owner_id, status')
      .eq('id', documentId)
      .maybeSingle()
    if (!doc || doc.status !== 'approved') return json({ ok: true, sent: false, reason: 'document not approved' })
    const owner = OWNER[doc.owner_kind as string]
    if (!owner) return json({ ok: true, sent: false, reason: 'not a badge owner kind' })

    // The badge this approval switched on, if it hasn't been announced yet.
    const { data: badge } = await admin
      .from(owner.table)
      .select('id, expires_at')
      .eq(owner.fk, doc.owner_id)
      .eq('status', 'active')
      .is('activation_emailed_at', null)
      .order('starts_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!badge) return json({ ok: true, sent: false, reason: 'no unannounced active badge' })

    // Claim it first so a concurrent or repeated call can't send a second email.
    const { data: claimed } = await admin
      .from(owner.table)
      .update({ activation_emailed_at: new Date().toISOString() })
      .eq('id', badge.id)
      .is('activation_emailed_at', null)
      .select('id')
    if (!claimed || claimed.length === 0) return json({ ok: true, sent: false, reason: 'already announced' })

    const isExpert = doc.owner_kind === 'candidate'
    const { data: person } = isExpert
      ? await admin.from('candidates').select('email, full_name').eq('id', doc.owner_id).maybeSingle()
      : await admin.from('employers').select('business_email, company_name').eq('id', doc.owner_id).maybeSingle()
    const p = (person ?? {}) as Record<string, string | null>
    const to = (isExpert ? p.email : p.business_email) ?? ''
    const name = ((isExpert ? p.full_name : p.company_name) ?? '').trim()
    const until = badge.expires_at ? fmtDate(badge.expires_at as string) : null

    const html = emailShell(
      isExpert ? 'You’re Fully verified' : 'Your business is Fully verified',
      `<p>${name ? `Hi ${escapeHtml(name)}, ` : ''}${
        isExpert
          ? 'your identity document has been approved and your <b>Fully verified badge is now live</b>.'
          : 'your registration document has been approved and your <b>Fully verified business badge is now live</b>.'
      }</p>
       <p>${
         isExpert
           ? 'The badge shows on your expert profile and gives you priority in match ranking.'
           : 'The badge now shows on your postings, which helps you attract better experts.'
       }${until ? ` It stays active until <b>${escapeHtml(until)}</b>.` : ''}</p>`,
      `${SITE_URL}${isExpert ? '/dashboard/verification' : '/employer/verification'}`,
      'View my badge',
    )
    const sent = await sendEmail(
      to,
      isExpert ? 'You’re Fully verified — your badge is live' : 'Your business is Fully verified — your badge is live',
      html,
    )
    if (!sent) {
      // Let a later call retry instead of silently losing the email.
      await admin.from(owner.table).update({ activation_emailed_at: null }).eq('id', badge.id)
      return json({ ok: true, sent: false, reason: 'email delivery failed' })
    }
    return json({ ok: true, sent: true })
  } catch (err) {
    console.error('notify-badge-active', err)
    return json({ error: err instanceof Error ? err.message : 'Could not send badge email' }, 400)
  }
})
