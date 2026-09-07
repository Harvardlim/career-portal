// Creates a Stripe Checkout Session for a one-time purchase and returns its URL
// for the browser to redirect to. Two kinds:
//
//   { kind: 'credits',     pkg:  'standard' | 'referral' | 'repeat_1' | 'repeat_2' }
//   { kind: 'membership',  plan: 'candidate_monthly' | 'candidate_yearly' }
//
// The caller is identified from their Supabase JWT (sent automatically by
// supabase-js `functions.invoke`). A matching row is written to
// credit_purchases / memberships with status 'pending' and the session id; the
// `stripe-webhook` function flips it to paid/active once Stripe confirms.
//
// Required secrets (supabase secrets set NAME=value):
//   STRIPE_SECRET_KEY            - sk_test_... / sk_live_...
//   SUPABASE_URL                 - injected by the platform
//   SUPABASE_SERVICE_ROLE_KEY    - injected by the platform
//
// Local dev: supabase functions serve stripe-checkout --no-verify-jwt

import Stripe from 'npm:stripe@17.7.0'
import { createClient } from 'npm:@supabase/supabase-js@2.114.0'
import { corsHeaders, json } from '../_shared/cors.ts'
import {
  CREDIT_PACKAGES,
  EMPLOYER_MEMBERSHIP_DAYS,
  MEMBERSHIP_PLANS,
  isCreditPackageKey,
  isMembershipPlanKey,
} from '../_shared/catalog.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { httpClient: Stripe.createFetchHttpClient() })

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const SITE_FALLBACK = Deno.env.get('SITE_URL') ?? 'https://trial.partly.asia'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  // Who is calling?
  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'Not signed in' }, 401)
  const { data: userData, error: userErr } = await admin.auth.getUser(token)
  if (userErr || !userData.user) return json({ error: 'Not signed in' }, 401)
  const userId = userData.user.id
  const email = userData.user.email ?? undefined

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const origin =
    (typeof body.origin === 'string' && body.origin) ||
    req.headers.get('origin') ||
    SITE_FALLBACK

  try {
    if (body.kind === 'credits') {
      return await checkoutCredits(body, userId, email, origin)
    }
    if (body.kind === 'membership') {
      return await checkoutMembership(body, userId, email, origin)
    }
    return json({ error: 'Unknown checkout kind' }, 400)
  } catch (err) {
    console.error('stripe-checkout', err)
    const message = err instanceof Error ? err.message : 'Checkout failed'
    return json({ error: message }, 400)
  }
})

async function checkoutCredits(
  body: Record<string, unknown>,
  userId: string,
  email: string | undefined,
  origin: string,
): Promise<Response> {
  if (!isCreditPackageKey(body.pkg)) return json({ error: 'Unknown package' }, 400)
  const pkg = CREDIT_PACKAGES[body.pkg]

  const { data: employer, error: empErr } = await admin
    .from('employers')
    .select('id, company_name')
    .eq('user_id', userId)
    .maybeSingle()
  if (empErr) throw empErr
  if (!employer) return json({ error: 'No employer profile for this account' }, 400)

  // First-time vs repeat pricing is gated on an active membership term.
  const { data: term } = await admin
    .from('employer_memberships')
    .select('id')
    .eq('employer_id', employer.id)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()
  const hasActiveTerm = !!term

  if (pkg.firstTime && hasActiveTerm) {
    return json(
      { error: 'This account already has credits — use the repeat purchase tiers.' },
      409,
    )
  }
  if (!pkg.firstTime && !hasActiveTerm) {
    return json(
      { error: 'Repeat pricing needs an active membership — buy a starter package first.' },
      409,
    )
  }

  const { data: purchase, error: insErr } = await admin
    .from('credit_purchases')
    .insert({
      employer_id: employer.id,
      package: pkg.label,
      amount_usd: pkg.amount / 100,
      credits: pkg.credits,
      status: 'pending',
    })
    .select('id')
    .single()
  if (insErr) throw insErr

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: pkg.amount,
          product_data: {
            name: `${pkg.label} — ${pkg.credits} job credits`,
            description: 'Career Portal job-posting credits',
          },
        },
      },
    ],
    success_url: `${origin}/employer/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/employer/pricing?checkout=cancelled`,
    metadata: {
      kind: 'credits',
      purchase_id: purchase.id,
      employer_id: employer.id,
      package_key: pkg.key,
      package_label: pkg.label,
      credits: String(pkg.credits),
      grant_membership: pkg.firstTime ? String(EMPLOYER_MEMBERSHIP_DAYS) : '0',
    },
  })

  await admin
    .from('credit_purchases')
    .update({ stripe_session_id: session.id })
    .eq('id', purchase.id)

  return json({ url: session.url })
}

async function checkoutMembership(
  body: Record<string, unknown>,
  userId: string,
  email: string | undefined,
  origin: string,
): Promise<Response> {
  if (!isMembershipPlanKey(body.plan)) return json({ error: 'Unknown plan' }, 400)
  const plan = MEMBERSHIP_PLANS[body.plan]

  const { data: candidate, error: candErr } = await admin
    .from('candidates')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()
  if (candErr) throw candErr
  if (!candidate) return json({ error: 'No candidate profile for this account' }, 400)

  const { data: membership, error: insErr } = await admin
    .from('memberships')
    .insert({
      candidate_id: candidate.id,
      plan: plan.label,
      amount_usd: plan.amount / 100,
      period: plan.period,
      status: 'pending',
    })
    .select('id')
    .single()
  if (insErr) throw insErr

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: plan.amount,
          product_data: {
            name: plan.label,
            description: `Career Portal membership — ${plan.days} days`,
          },
        },
      },
    ],
    success_url: `${origin}/dashboard/membership?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/dashboard/membership?checkout=cancelled`,
    metadata: {
      kind: 'membership',
      membership_id: membership.id,
      candidate_id: candidate.id,
      plan_key: plan.key,
      plan_label: plan.label,
      days: String(plan.days),
    },
  })

  await admin
    .from('memberships')
    .update({ stripe_session_id: session.id })
    .eq('id', membership.id)

  return json({ url: session.url })
}
