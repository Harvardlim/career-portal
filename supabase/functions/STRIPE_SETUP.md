# Stripe payments — setup

Two edge functions plus one migration wire Stripe Checkout into the app.

| Piece | What it does |
| --- | --- |
| `migrations/20260907120000_stripe.sql` | `stripe_*` columns on `credit_purchases` / `memberships`, a `pending` lifecycle, the `employer_memberships` term table + `employer_membership_status` view, and it drops the old public INSERT policies (money-in rows are now written only by the webhook). |
| `functions/stripe-checkout` | Browser calls it (`supabase.functions.invoke`) → creates a Checkout Session, writes a `pending` row, returns the hosted URL to redirect to. |
| `functions/stripe-confirm` | The success page calls it with the returned `session_id` → fetches the session from Stripe, checks it's paid **and** belongs to the caller, then fulfils immediately. This is why membership/credits go active straight after payment without the webhook. |
| `functions/stripe-webhook` | Stripe calls it on `checkout.session.completed` → same fulfilment, as a fallback for users who close the tab before returning. Needs `STRIPE_WEBHOOK_SECRET`. |

`stripe-confirm` and `stripe-webhook` share `functions/_shared/fulfil.ts`, and every
write is guarded on the row still being `pending`, so whichever runs first wins and
the other is a no-op.

Prices, credit counts and term lengths live in `functions/_shared/catalog.ts` — the
client only sends a key (`standard`, `candidate_yearly`, …).

## 1. Deploy the migration

```bash
supabase db push
```

## 2. Set secrets

```bash
supabase secrets set \
  STRIPE_SECRET_KEY=sk_live_xxx \
  STRIPE_WEBHOOK_SECRET=whsec_xxx
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically on deploy.

## 3. Deploy the functions

```bash
supabase functions deploy stripe-checkout
supabase functions deploy stripe-confirm
supabase functions deploy stripe-webhook
```

`config.toml` sets `verify_jwt = true` for `stripe-checkout` / `stripe-confirm`
and `false` for `stripe-webhook`.

## 4. Register the webhook (recommended, not required)

Fulfilment already happens on return from Stripe via `stripe-confirm`. The
webhook covers the case where the buyer closes the tab before returning.

Stripe Dashboard → Developers → Webhooks → Add endpoint:

- URL: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
- Events: `checkout.session.completed`

Copy the signing secret (`whsec_…`) into `STRIPE_WEBHOOK_SECRET` (step 2) and
re-deploy `stripe-webhook`.

## Local dev

```bash
cp supabase/functions/.env.example supabase/functions/.env   # fill in keys
supabase functions serve stripe-checkout --env-file supabase/functions/.env --no-verify-jwt
supabase functions serve stripe-webhook  --env-file supabase/functions/.env --no-verify-jwt
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
```

Test cards: `4242 4242 4242 4242`, any future expiry / CVC.

## Flows wired in the web app

- **Candidate membership** — `/dashboard/membership` → "Upgrade" (one-time, 30 or 365 days).
- **Employer first purchase** — `/employer/pricing` Standard ($999) / Referral ($499);
  grants 3 credits + a 365-day membership term.
- **Employer repeat ("add credits")** — same page, unlocked once the term is active:
  1st repeat $399 / 3 credits, 2nd repeat $199 / 5 credits.
- `/employer/checkout?pkg=<key>` is a thin confirm dialog that redirects to Stripe.

Return URLs land back on `/employer/billing` or `/dashboard/membership` with
`?checkout=success|cancelled`; the balance/plan updates once the webhook fires.
