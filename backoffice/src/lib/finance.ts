import { supabase, isSupabaseConfigured } from './supabase'

export const financeEnabled = isSupabaseConfigured

export type Purchase = {
  id: string
  employer_id: string
  package: string
  amount_usd: number
  credits: number
  status: string
  created_at: string
  employer: { company_name: string; business_email: string } | null
}

export type CreditBalance = {
  employer_id: string
  company_name: string | null
  business_email: string | null
  credits_purchased: number
  credits_used: number
  credits_left: number
  total_spent_usd: number
  last_purchase_at: string | null
}

export type Membership = {
  id: string
  candidate_id: string
  plan: string
  amount_usd: number
  period: string | null
  status: string
  started_at: string
  candidate: { full_name: string; email: string } | null
}

const client = () => {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

export async function fetchPurchases(): Promise<Purchase[]> {
  const { data, error } = await client()
    .from('credit_purchases')
    .select(
      'id, employer_id, package, amount_usd, credits, status, created_at, employer:employers ( company_name, business_email )',
    )
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as Purchase[]
}

export async function fetchCreditBalances(): Promise<CreditBalance[]> {
  const { data, error } = await client()
    .from('employer_credit_balances')
    .select('*')
    .order('credits_left', { ascending: false })
  if (error) throw error
  return (data ?? []) as CreditBalance[]
}

export async function fetchMemberships(): Promise<Membership[]> {
  const { data, error } = await client()
    .from('memberships')
    .select(
      'id, candidate_id, plan, amount_usd, period, status, started_at, candidate:candidates ( full_name, email )',
    )
    .order('started_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as Membership[]
}
