// Creates a Stripe Checkout Session for a one-time purchase and returns its URL
// for the browser to redirect to. Two kinds:
//
//   { kind: 'credits',     pkg:  'standard' | 'referral' | 'repeat_1' | 'repeat_2' }
//   { kind: 'membership',  plan: 'candidate_monthly' | 'candidate_yearly' }
//
// partly.asia products (fixed per-country prices from public.pricing_countries):
//   { kind: 'lead_unlock',    release_id: uuid, pay: 'local' | 'usd' }
//   { kind: 'verified_badge', pay: 'local' | 'usd' }
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
import { formatLocal, isPayCurrency, loadPricing, stripeLineAmount } from '../_shared/partly.ts'

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
    if (body.kind === 'lead_unlock') {
      return await checkoutLeadUnlock(body, userId, email, origin)
    }
    if (body.kind === 'verified_badge') {
      return await checkoutVerifiedBadge(body, userId, email, origin)
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

// --- partly.asia -----------------------------------------------------------

async function expertForUser(userId: string) {
  const { data, error } = await admin
    .from('candidates')
    .select('id, full_name, country_code, verified_badge_until')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data as {
    id: string
    full_name: string
    country_code: string | null
    verified_badge_until: string | null
  } | null
}

/**
 * Pay to unlock a released contact. The amount is the expert's market's fixed
 * lead fee; the window must still be open, and nothing is ever charged for a
 * lead that has already gone cold.
 */
async function checkoutLeadUnlock(
  body: Record<string, unknown>,
  userId: string,
  email: string | undefined,
  origin: string,
): Promise<Response> {
  const releaseId = typeof body.release_id === 'string' ? body.release_id : ''
  if (!releaseId) return json({ error: 'Missing release_id' }, 400)
  const pay = isPayCurrency(body.pay) ? body.pay : 'local'

  const expert = await expertForUser(userId)
  if (!expert) return json({ error: 'No expert profile for this account' }, 400)

  const { data: release, error: relErr } = await admin
    .from('contact_releases')
    .select('id, job_id, candidate_id, status, window_expires_at, jobs(title, company_name)')
    .eq('id', releaseId)
    .maybeSingle()
  if (relErr) throw relErr
  if (!release || release.candidate_id !== expert.id) {
    return json({ error: 'This lead is not yours' }, 403)
  }
  if (release.status === 'paid') return json({ error: 'You have already unlocked this contact' }, 409)
  if (release.status !== 'awaiting_payment' || new Date(release.window_expires_at) <= new Date()) {
    return json({ error: 'This lead has gone cold — the 2-day window has closed.' }, 409)
  }

  const price = await loadPricing(admin, expert.country_code)
  if (!price) {
    return json({ error: 'Set your country on your profile before unlocking a lead.' }, 400)
  }
  const line = stripeLineAmount(price, 'lead', pay)

  // One pending payment row per release; a second attempt re-uses it.
  const { data: payment, error: payErr } = await admin
    .from('lead_unlock_payments')
    .upsert(
      {
        release_id: release.id,
        candidate_id: expert.id,
        job_id: release.job_id,
        country_code: price.code,
        currency: line.currency.toUpperCase(),
        amount_local: line.amount_local,
        amount_usd: line.amount_usd,
        pay_currency: pay,
        status: 'pending',
      },
      { onConflict: 'release_id' },
    )
    .select('id')
    .single()
  if (payErr) throw payErr

  const job = (release as { jobs?: { title?: string; company_name?: string } | null }).jobs
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: line.currency,
          unit_amount: line.unit_amount,
          product_data: {
            name: `Unlock contact — ${job?.title ?? 'released lead'}`,
            description:
              pay === 'usd'
                ? `partly.asia released-lead fee (USD, forex absorbed) — ${formatLocal(price, line.amount_local)} in ${price.currency}`
                : `partly.asia released-lead fee — fixed ${price.name} price`,
          },
        },
      },
    ],
    // Let the Checkout page live only as long as the lead window (Stripe
    // requires 30 min .. 24 h). The release status is checked again at
    // fulfilment, so a lead the sweep already marked cold can't be paid for.
    expires_at: Math.max(
      Math.floor(Date.now() / 1000) + 31 * 60,
      Math.min(
        Math.floor(new Date(release.window_expires_at).getTime() / 1000),
        Math.floor(Date.now() / 1000) + 24 * 60 * 60 - 60,
      ),
    ),
    success_url: `${origin}/dashboard/leads/${release.id}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/dashboard/leads/${release.id}?checkout=cancelled`,
    metadata: {
      kind: 'lead_unlock',
      release_id: release.id,
      payment_id: payment.id,
      candidate_id: expert.id,
      country_code: price.code,
    },
  })

  await admin
    .from('lead_unlock_payments')
    .update({ stripe_session_id: session.id })
    .eq('id', payment.id)

  return json({ url: session.url })
}

/** Buy or renew the annual Verified badge at the expert's market's fixed fee. */
async function checkoutVerifiedBadge(
  body: Record<string, unknown>,
  userId: string,
  email: string | undefined,
  origin: string,
): Promise<Response> {
  const pay = isPayCurrency(body.pay) ? body.pay : 'local'

  const expert = await expertForUser(userId)
  if (!expert) return json({ error: 'No expert profile for this account' }, 400)

  const price = await loadPricing(admin, expert.country_code)
  if (!price) {
    return json({ error: 'Set your country on your profile before buying a badge.' }, 400)
  }
  const line = stripeLineAmount(price, 'badge', pay)

  // A renewal chains to the current active term so it extends rather than resets.
  const { data: current } = await admin
    .from('verified_badges')
    .select('id, expires_at')
    .eq('candidate_id', expert.id)
    .eq('status', 'active')
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: badge, error: insErr } = await admin
    .from('verified_badges')
    .insert({
      candidate_id: expert.id,
      user_id: userId,
      status: 'pending',
      country_code: price.code,
      currency: line.currency.toUpperCase(),
      amount_local: line.amount_local,
      amount_usd: line.amount_usd,
      pay_currency: pay,
      renewed_from: current?.id ?? null,
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
          currency: line.currency,
          unit_amount: line.unit_amount,
          product_data: {
            name: current ? 'Verified badge — annual renewal' : 'Verified badge — 1 year',
            description:
              pay === 'usd'
                ? `partly.asia Verified credential badge (USD, forex absorbed) — ${formatLocal(price, line.amount_local)} in ${price.currency}`
                : `partly.asia Verified credential badge — fixed ${price.name} price`,
          },
        },
      },
    ],
    success_url: `${origin}/dashboard/verification?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/dashboard/verification?checkout=cancelled`,
    metadata: {
      kind: 'verified_badge',
      badge_id: badge.id,
      candidate_id: expert.id,
      country_code: price.code,
      renewal: current ? '1' : '0',
    },
  })

  await admin
    .from('verified_badges')
    .update({ stripe_session_id: session.id })
    .eq('id', badge.id)

  return json({ url: session.url })
}
