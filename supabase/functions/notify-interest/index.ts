// Emails every expert a business just released contact to ("interest"),
// alongside the in-app notification release_contact() already writes. The email
// says what unlocking costs, in both currencies, and links straight to the lead.
//
// Body: { job_id: uuid, candidate_ids: uuid[] }
// The caller must own the posting, and only experts who really were released
// to (an awaiting-payment contact_releases row) are emailed.
//
// Required secrets: RESEND_API_KEY, RESEND_FROM (optional), SITE_URL (optional)
// Local dev: supabase functions serve notify-interest --no-verify-jwt

import { createClient } from 'npm:@supabase/supabase-js@2.114.0'
import { corsHeaders, json } from '../_shared/cors.ts'
import { emailShell, escapeHtml, sendEmail, SITE_URL } from '../_shared/email.ts'
import { formatLocal, loadPricing } from '../_shared/partly.ts'

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'Not signed in' }, 401)
  const { data: userData, error: userErr } = await admin.auth.getUser(token)
  if (userErr || !userData.user) return json({ error: 'Not signed in' }, 401)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }
  const jobId = typeof body.job_id === 'string' ? body.job_id : ''
  const candidateIds = Array.isArray(body.candidate_ids)
    ? body.candidate_ids.filter((v): v is string => typeof v === 'string')
    : []
  if (!jobId || candidateIds.length === 0) return json({ error: 'Missing job_id or candidate_ids' }, 400)

  const { data: job } = await admin
    .from('jobs')
    .select('title, company_name, employer_id, employers(user_id)')
    .eq('id', jobId)
    .maybeSingle()

  const ownerUserId = (job as { employers?: { user_id?: string } | null } | null)?.employers?.user_id
  if (!job || ownerUserId !== userData.user.id) {
    return json({ error: 'Not your posting' }, 403)
  }

  // Only experts the business actually released contact to -- never an arbitrary id.
  const { data: releases } = await admin
    .from('contact_releases')
    .select('id, candidate_id')
    .eq('job_id', jobId)
    .eq('status', 'awaiting_payment')
    .in('candidate_id', candidateIds)
  const releaseByCandidate = new Map((releases ?? []).map((r) => [r.candidate_id as string, r.id as string]))

  const { data: candidates } = await admin
    .from('candidates')
    .select('id, email, full_name, country_code')
    .in('id', [...releaseByCandidate.keys()])

  let delivered = 0
  for (const c of candidates ?? []) {
    if (!c.email) continue

    let feeLine = 'a small fixed fee'
    try {
      const price = await loadPricing(admin, c.country_code)
      if (price) {
        feeLine = `<b>${escapeHtml(formatLocal(price, price.lead_fee_local))}</b> or <b>USD ${price.lead_fee_usd.toLocaleString('en-US')}</b> (USD: forex exchange absorbed)`
      }
    } catch (err) {
      console.error('notify-interest pricing', err)
    }

    const company = escapeHtml(job.company_name ?? 'A business')
    const title = escapeHtml(job.title ?? 'your application')
    const ok = await sendEmail(
      c.email,
      `A business is interested in you — "${job.title}"`,
      emailShell(
        'You have a warm lead',
        `<p><b>${company}</b> is interested in you for <b>"${title}"</b> and has released their contact.</p>
         <p>Pay ${feeLine} within <b>2 days</b> to unlock their contact details — yours are shared with them at the same time. If you don't pay, the lead simply goes cold and you are never charged.</p>`,
        `${SITE_URL}/dashboard/leads/${releaseByCandidate.get(c.id)}`,
        'Pay to unlock contact',
      ),
    )
    if (ok) delivered++
  }

  return json({ ok: true, delivered, total: (candidates ?? []).length })
})
