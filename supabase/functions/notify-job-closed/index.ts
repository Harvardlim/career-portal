// Emails every applicant who wasn't hired (no paid contact release) when a
// business closes a posting -- alongside the in-app "lead went cold" notice
// close_posting() already sends to released-but-unpaid experts.
//
// Body: { job_id: uuid }
// The caller must own the posting.
//
// Required secrets: RESEND_API_KEY, RESEND_FROM (optional), SITE_URL (optional)
// Local dev: supabase functions serve notify-job-closed --no-verify-jwt

import { createClient } from 'npm:@supabase/supabase-js@2.114.0'
import { corsHeaders, json } from '../_shared/cors.ts'
import { emailShell, sendEmail } from '../_shared/email.ts'

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
  if (!jobId) return json({ error: 'Missing job_id' }, 400)

  const { data: job } = await admin
    .from('jobs')
    .select('title, employer_id, employers(user_id)')
    .eq('id', jobId)
    .maybeSingle()

  const ownerUserId = (job as { employers?: { user_id?: string } | null } | null)?.employers?.user_id
  if (!job || ownerUserId !== userData.user.id) {
    return json({ error: 'Not your posting' }, 403)
  }

  const [{ data: applications }, { data: paidReleases }] = await Promise.all([
    admin.from('job_applications').select('candidate_id, candidates(email)').eq('job_id', jobId),
    admin.from('contact_releases').select('candidate_id').eq('job_id', jobId).eq('status', 'paid'),
  ])

  const paidIds = new Set((paidReleases ?? []).map((r) => r.candidate_id as string))
  const unselected = (applications ?? []).filter((a) => !paidIds.has(a.candidate_id as string))

  let delivered = 0
  for (const a of unselected) {
    const email = (a as { candidates?: { email?: string } | null }).candidates?.email
    if (!email) continue
    const ok = await sendEmail(
      email,
      `This posting has closed — "${job.title}"`,
      emailShell(
        'This posting has closed',
        `<p><b>"${job.title}"</b> is now closed. You weren't selected this time — no fee was ever charged for it.</p>
         <p>Keep an eye on your dashboard for new open needs that fit your expertise.</p>`,
      ),
    )
    if (ok) delivered++
  }

  return json({ ok: true, delivered, total: unselected.length })
})
