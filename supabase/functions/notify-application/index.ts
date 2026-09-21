// Emails a business the moment an expert applies to their posting.
//
// Body: { application_id: uuid }
// The caller must be the applicant (their JWT's auth user must own the
// application) -- this only ever fires right after applyToNeed() succeeds.
//
// Required secrets: RESEND_API_KEY, RESEND_FROM (optional), SITE_URL (optional)
// Local dev: supabase functions serve notify-application --no-verify-jwt

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
  const applicationId = typeof body.application_id === 'string' ? body.application_id : ''
  if (!applicationId) return json({ error: 'Missing application_id' }, 400)

  const { data: application } = await admin
    .from('job_applications')
    .select('id, user_id, job_id, jobs(title, employer_id), candidates(full_name)')
    .eq('id', applicationId)
    .maybeSingle()

  if (!application || application.user_id !== userData.user.id) {
    return json({ error: 'Not your application' }, 403)
  }

  const job = (application as { jobs?: { title?: string; employer_id?: string } | null }).jobs
  const candidate = (application as { candidates?: { full_name?: string } | null }).candidates
  if (!job?.employer_id) return json({ ok: true, delivered: false })

  const { data: employer } = await admin
    .from('employers')
    .select('business_email, company_name')
    .eq('id', job.employer_id)
    .maybeSingle()

  if (!employer?.business_email) return json({ ok: true, delivered: false })

  const delivered = await sendEmail(
    employer.business_email,
    `New applicant for "${job.title ?? 'your posting'}"`,
    emailShell(
      'You have a new applicant',
      `<p><b>${candidate?.full_name ?? 'An expert'}</b> just applied to <b>${job.title ?? 'your posting'}</b>.</p>
       <p>Review your matches and release contact to the ones you'd like to hear from — you only pay them nothing; they pay a small fixed fee once you release contact.</p>`,
      `${SITE_URL}/employer/postings/${application.job_id}/matches`,
      'Review matches',
    ),
  )

  return json({ ok: true, delivered })
})
