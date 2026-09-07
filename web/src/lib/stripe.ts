import { supabase } from './supabase'
import { SITE_URL } from './site'

/** Keys the `stripe-checkout` edge function understands. Amounts/credits live
 *  server-side in supabase/functions/_shared/catalog.ts. */
export type CreditPackageKey = 'standard' | 'referral' | 'repeat_1' | 'repeat_2'
export type MembershipPlanKey = 'candidate_monthly' | 'candidate_yearly'

export type CheckoutArgs =
  | { kind: 'credits'; pkg: CreditPackageKey }
  | { kind: 'membership'; plan: MembershipPlanKey }

/**
 * Opens Stripe Checkout for a one-time purchase. Resolves only if something went
 * wrong before the redirect; on success the browser navigates away to Stripe.
 */
export async function startCheckout(args: CheckoutArgs): Promise<never> {
  const { data, error } = await supabase.functions.invoke('stripe-checkout', {
    body: { ...args, origin: SITE_URL },
  })

  if (error) {
    // FunctionsHttpError carries the function's JSON body on `context`.
    let message = 'Could not start checkout. Please try again.'
    const ctx = (error as { context?: Response }).context
    if (ctx && typeof ctx.json === 'function') {
      try {
        const parsed = (await ctx.json()) as { error?: string }
        if (parsed?.error) message = parsed.error
      } catch {
        /* keep default */
      }
    } else if (error.message) {
      message = error.message
    }
    throw new Error(message)
  }

  const url = (data as { url?: string } | null)?.url
  if (!url) throw new Error('Stripe did not return a checkout URL.')
  window.location.href = url
  // Give the redirect a tick; callers can `await` without a resolve path.
  return new Promise<never>(() => {})
}

export type CheckoutOutcome = 'success' | 'cancelled' | null

/** Reads `?checkout=` set by the Stripe return URLs. */
export function readCheckoutOutcome(search: string): CheckoutOutcome {
  const v = new URLSearchParams(search).get('checkout')
  return v === 'success' || v === 'cancelled' ? v : null
}

/** Reads both `?checkout=` and the `?session_id=` Stripe appends on success. */
export function readCheckoutParams(search: string): {
  outcome: CheckoutOutcome
  sessionId: string | null
} {
  const p = new URLSearchParams(search)
  const v = p.get('checkout')
  return {
    outcome: v === 'success' || v === 'cancelled' ? v : null,
    sessionId: p.get('session_id'),
  }
}

/**
 * Verifies a completed Checkout Session server-side and applies fulfilment
 * (activates the membership / grants the credits) right away, so the user
 * doesn't have to wait for the Stripe webhook. Returns whether it's active.
 */
export async function confirmCheckout(sessionId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('stripe-confirm', {
      body: { session_id: sessionId },
    })
    if (error) return false
    return !!(data as { active?: boolean } | null)?.active
  } catch {
    return false
  }
}
