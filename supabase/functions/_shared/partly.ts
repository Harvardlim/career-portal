// partly.asia pricing helpers for the edge functions. Prices are FIXED per
// market and live in public.pricing_countries (editable from the backoffice),
// so nothing here hard-codes an amount -- the client only ever sends a release
// id / a currency choice, and the amount is resolved server-side.

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.114.0'

export type PricingCountry = {
  code: string
  name: string
  currency: string
  currency_symbol: string
  zero_decimal: boolean
  lead_fee_local: number
  lead_fee_usd: number
  badge_fee_local: number
  badge_fee_usd: number
  active: boolean
}

export type PayCurrency = 'local' | 'usd'

export function isPayCurrency(v: unknown): v is PayCurrency {
  return v === 'local' || v === 'usd'
}

export async function loadPricing(
  admin: SupabaseClient,
  countryCode: string | null | undefined,
): Promise<PricingCountry | null> {
  if (!countryCode) return null
  const { data, error } = await admin
    .from('pricing_countries')
    .select('*')
    .eq('code', countryCode)
    .eq('active', true)
    .maybeSingle()
  if (error) throw error
  return (data as PricingCountry | null) ?? null
}

/** What Stripe will charge for a product, in the currency the expert chose. */
export function stripeLineAmount(
  price: PricingCountry,
  product: 'lead' | 'badge',
  pay: PayCurrency,
): { currency: string; unit_amount: number; amount_local: number; amount_usd: number } {
  const amount_local = product === 'lead' ? price.lead_fee_local : price.badge_fee_local
  const amount_usd = product === 'lead' ? price.lead_fee_usd : price.badge_fee_usd

  if (pay === 'usd') {
    return { currency: 'usd', unit_amount: Math.round(amount_usd * 100), amount_local, amount_usd }
  }
  // Zero-decimal currencies (VND) are charged in whole units; the rest in cents.
  const unit_amount = price.zero_decimal
    ? Math.round(amount_local)
    : Math.round(amount_local * 100)
  return { currency: price.currency.toLowerCase(), unit_amount, amount_local, amount_usd }
}

export function formatLocal(price: PricingCountry, amount: number): string {
  const n = price.zero_decimal || Number.isInteger(amount)
    ? amount.toLocaleString('en-US')
    : amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${price.currency_symbol}${n}`
}

/** "S$199 · USD 145" -- every payment is described in both currencies. */
export function bothCurrencies(price: PricingCountry, amountLocal: number, amountUsd: number): string {
  return `${formatLocal(price, amountLocal)} · USD ${amountUsd.toLocaleString('en-US')}`
}
