// Emails every expert a business just released contact to ("interest"),
// alongside the in-app notification release_contact() already writes.
//
// Body: { job_id: uuid, candidate_ids: uuid[] }
// The caller must own the posting.
//
// Required secrets: RESEND_API_KEY, RESEND_FROM (optional), SITE_URL (optional)
// Local dev: supabase functions serve notify-interest --no-verify-jwt

import { createClient } from 'npm:@supabase/supabase-js@2.114.0'
import { corsHeaders, json } from '../_shared/cors.ts'
import { emailShell, sendEmail, SITE_URL } from '../_shared/email.ts'

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

  const { data: candidates } = await admin
    .from('candidates')
    .select('id, email, full_name')
    .in('id', candidateIds)

  let delivered = 0
  for (const c of candidates ?? []) {
    if (!c.email) continue
    const ok = await sendEmail(
      c.email,
      `A business is interested — "${job.title}"`,
      emailShell(
        'You have a warm lead',
        `<p><b>${job.company_name ?? 'A business'}</b> released contact for <b>"${job.title}"</b>.</p>
         <p>You have 2 days to unlock their contact details for a small fixed fee — if you don't, there's no charge.</p>`,
        `${SITE_URL}/dashboard/leads`,
        'View warm lead',
      ),
    )
    if (ok) delivered++
  }

  return json({ ok: true, delivered, total: (candidates ?? []).length })
})
