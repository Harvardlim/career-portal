// Stripe webhook: the reliable fallback for fulfilment (the browser-return path
// is stripe-confirm). Stripe calls this after a Checkout Session completes; we
// verify the signature, then run the shared fulfilment. Idempotent.
//
// Configure in the Stripe Dashboard (Developers > Webhooks) pointing at this
// function's URL, subscribed to at least: checkout.session.completed
//
// Required secrets (supabase secrets set NAME=value):
//   STRIPE_SECRET_KEY            - sk_test_... / sk_live_...
//   STRIPE_WEBHOOK_SECRET        - whsec_... shown when you create the endpoint
//   SUPABASE_URL                 - injected by the platform
//   SUPABASE_SERVICE_ROLE_KEY    - injected by the platform
//
// Local dev:
//   supabase functions serve stripe-webhook --no-verify-jwt
//   stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook

import Stripe from 'npm:stripe@17.7.0'
import { createClient } from 'npm:@supabase/supabase-js@2.114.0'
import { fulfilCheckoutSession } from '../_shared/fulfil.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  httpClient: Stripe.createFetchHttpClient(),
})
const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  if (!signature) return new Response('Missing signature', { status: 400 })

  const payload = await req.text()
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature, WEBHOOK_SECRET)
  } catch (err) {
    console.error('signature verification failed', err)
    return new Response('Bad signature', { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const result = await fulfilCheckoutSession(
        admin,
        event.data.object as Stripe.Checkout.Session,
      )
      console.log('webhook fulfil', result)
    }
  } catch (err) {
    console.error('fulfilment failed', event.type, err)
    return new Response('Fulfilment error', { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
