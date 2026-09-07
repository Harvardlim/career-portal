// Browser-return fulfilment. The success page calls this with the
// {CHECKOUT_SESSION_ID} from the return URL; we fetch the session straight from
// Stripe, check it's paid AND belongs to the signed-in user, then run the same
// shared fulfilment the webhook uses. This makes membership/credits go active
// immediately on return, without waiting on (or even configuring) the webhook.
//
// Required secrets:
//   STRIPE_SECRET_KEY            - sk_test_... / sk_live_...
//   SUPABASE_URL                 - injected by the platform
//   SUPABASE_SERVICE_ROLE_KEY    - injected by the platform
//
// Local dev: supabase functions serve stripe-confirm --no-verify-jwt

import Stripe from 'npm:stripe@17.7.0'
import { createClient } from 'npm:@supabase/supabase-js@2.114.0'
import { corsHeaders, json } from '../_shared/cors.ts'
import { fulfilCheckoutSession } from '../_shared/fulfil.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  httpClient: Stripe.createFetchHttpClient(),
})

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
  const userId = userData.user.id

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }
  const sessionId = typeof body.session_id === 'string' ? body.session_id : ''
  if (!sessionId) return json({ error: 'Missing session_id' }, 400)

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const meta = session.metadata ?? {}

    // Ownership check: the session's employer/candidate must be this user's.
    if (meta.kind === 'credits') {
      const { data: emp } = await admin
        .from('employers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()
      if (!emp || emp.id !== meta.employer_id) {
        return json({ error: 'Not your checkout session' }, 403)
      }
    } else if (meta.kind === 'membership') {
      const { data: cand } = await admin
        .from('candidates')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()
      if (!cand || cand.id !== meta.candidate_id) {
        return json({ error: 'Not your checkout session' }, 403)
      }
    } else {
      return json({ error: 'Unrecognised checkout session' }, 400)
    }

    const result = await fulfilCheckoutSession(admin, session)
    return json({
      active: result === 'granted' || result === 'already_done',
      result,
    })
  } catch (err) {
    console.error('stripe-confirm', err)
    return json({ error: err instanceof Error ? err.message : 'Confirm failed' }, 400)
  }
})
