// Backoffice data layer for the partly.asia flow: pricing, manual
// verification, postings / releases, lead + badge revenue and affiliate
// commission payouts.
import { supabase, isSupabaseConfigured } from './supabase'

export const partlyEnabled = isSupabaseConfigured

const client = () => {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

/* ---------- Pricing ---------- */

export type PricingRow = {
  code: string
  name: string
  currency: string
  currency_symbol: string
  zero_decimal: boolean
  lead_fee_local: number
  lead_fee_usd: number
  badge_fee_local: number
  badge_fee_usd: number
  affiliate_lead_local: number
  affiliate_lead_usd: number
  affiliate_badge_local: number
  affiliate_badge_usd: number
  active: boolean
  sort_order: number
  updated_at: string
}

export async function fetchPricing(): Promise<PricingRow[]> {
  const { data, error } = await client().from('pricing_countries').select('*').order('sort_order')
  if (error) throw error
  return (data ?? []) as PricingRow[]
}

export async function updatePricing(code: string, patch: Partial<PricingRow>): Promise<void> {
  const { error } = await client()
    .from('pricing_countries')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('code', code)
  if (error) throw error
}

/* ---------- Verification queue ---------- */

export type VerificationItem = {
  id: string
  owner_kind: 'candidate' | 'employer'
  owner_id: string
  doc_type: string
  doc_path: string
  status: 'pending' | 'approved' | 'rejected'
  notes: string | null
  reviewed_at: string | null
  created_at: string
  owner_name: string | null
  owner_email: string | null
  owner_country: string | null
  owner_reg_no: string | null
  owner_verified: boolean
}

export async function fetchVerificationQueue(): Promise<VerificationItem[]> {
  const sb = client()
  const { data, error } = await sb
    .from('verification_documents')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) throw error
  const docs = (data ?? []) as Omit<VerificationItem, 'owner_name' | 'owner_email' | 'owner_country' | 'owner_reg_no' | 'owner_verified'>[]

  const candIds = docs.filter((d) => d.owner_kind === 'candidate').map((d) => d.owner_id)
  const empIds = docs.filter((d) => d.owner_kind === 'employer').map((d) => d.owner_id)
  const [cands, emps] = await Promise.all([
    candIds.length
      ? sb.from('candidates').select('id, full_name, email, country_code, identity_verified').in('id', candIds)
      : Promise.resolve({ data: [] as unknown[] }),
    empIds.length
      ? sb.from('employers').select('id, company_name, business_email, country_code, reg_no, registration_verified').in('id', empIds)
      : Promise.resolve({ data: [] as unknown[] }),
  ])
  const cmap = new Map(
    ((cands.data ?? []) as { id: string; full_name: string; email: string; country_code: string | null; identity_verified: boolean }[]).map((c) => [c.id, c]),
  )
  const emap = new Map(
    ((emps.data ?? []) as { id: string; company_name: string; business_email: string; country_code: string | null; reg_no: string; registration_verified: boolean }[]).map((e) => [e.id, e]),
  )

  return docs.map((d) => {
    if (d.owner_kind === 'candidate') {
      const c = cmap.get(d.owner_id)
      return {
        ...d,
        owner_name: c?.full_name ?? null,
        owner_email: c?.email ?? null,
        owner_country: c?.country_code ?? null,
        owner_reg_no: null,
        owner_verified: c?.identity_verified ?? false,
      }
    }
    const e = emap.get(d.owner_id)
    return {
      ...d,
      owner_name: e?.company_name ?? null,
      owner_email: e?.business_email ?? null,
      owner_country: e?.country_code ?? null,
      owner_reg_no: e?.reg_no ?? null,
      owner_verified: e?.registration_verified ?? false,
    }
  })
}

export async function verificationDocUrl(path: string): Promise<string> {
  const { data, error } = await client().storage.from('verification-docs').createSignedUrl(path, 600)
  if (error) throw error
  return data.signedUrl
}

export async function reviewVerification(
  documentId: string,
  approve: boolean,
  adminId: string,
  notes?: string,
): Promise<void> {
  const { error } = await client().rpc('admin_review_verification', {
    p_document_id: documentId,
    p_approve: approve,
    p_admin_id: adminId,
    p_notes: notes ?? null,
  })
  if (error) throw error
}

/* ---------- Postings & releases ---------- */

export type PostingRow = {
  id: string
  title: string
  company_name: string
  country: string | null
  category: string | null
  project_type: string | null
  status: string
  matching_status: string
  posted_at: string
  closed_at: string | null
  applications: number
  matches: number
  released: number
  unlocked: number
}

export async function fetchPostings(): Promise<PostingRow[]> {
  const { data, error } = await client()
    .from('jobs')
    .select(
      'id,title,company_name,country,category,project_type,status,matching_status,posted_at,closed_at,job_applications(count),posting_matches(count),contact_releases(status)',
    )
    .not('main_category_id', 'is', null)
    .order('posted_at', { ascending: false })
    .limit(500)
  if (error) throw error
  return (data ?? []).map((r) => {
    const row = r as unknown as PostingRow & {
      job_applications: { count: number }[]
      posting_matches: { count: number }[]
      contact_releases: { status: string }[]
    }
    return {
      ...row,
      applications: row.job_applications?.[0]?.count ?? 0,
      matches: row.posting_matches?.[0]?.count ?? 0,
      released: row.contact_releases?.length ?? 0,
      unlocked: row.contact_releases?.filter((c) => c.status === 'paid').length ?? 0,
    }
  })
}

export async function adminClosePosting(jobId: string, adminId: string): Promise<number> {
  const { data, error } = await client().rpc('admin_close_posting', { p_job_id: jobId, p_admin_id: adminId })
  if (error) throw error
  return Number(data ?? 0)
}

export type ReleaseRow = {
  id: string
  job_id: string
  released_at: string
  window_expires_at: string
  status: string
  paid_at: string | null
  contact_expires_at: string | null
  ended_reason: string | null
  cohort_size: number
  window_open: boolean
  job: { title: string; company_name: string } | null
  candidate: { full_name: string; email: string; country_code: string | null } | null
}

export async function fetchReleases(): Promise<ReleaseRow[]> {
  const { data, error } = await client()
    .from('contact_release_details')
    .select(
      'id,job_id,released_at,window_expires_at,status,paid_at,contact_expires_at,ended_reason,cohort_size,window_open,job:jobs(title,company_name),candidate:candidates(full_name,email,country_code)',
    )
    .order('released_at', { ascending: false })
    .limit(500)
  if (error) throw error
  return (data ?? []) as unknown as ReleaseRow[]
}

/* ---------- Revenue ---------- */

export type LeadPaymentRow = {
  id: string
  status: string
  country_code: string | null
  currency: string
  amount_local: number
  amount_usd: number
  pay_currency: string
  created_at: string
  paid_at: string | null
  stripe_session_id: string | null
  job: { title: string; company_name: string } | null
  candidate: { full_name: string; email: string } | null
}

export async function fetchLeadPayments(): Promise<LeadPaymentRow[]> {
  const { data, error } = await client()
    .from('lead_unlock_payments')
    .select(
      'id,status,country_code,currency,amount_local,amount_usd,pay_currency,created_at,paid_at,stripe_session_id,job:jobs(title,company_name),candidate:candidates(full_name,email)',
    )
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) throw error
  return (data ?? []) as unknown as LeadPaymentRow[]
}

export type BadgeRow = {
  id: string
  status: string
  country_code: string | null
  currency: string
  amount_local: number
  amount_usd: number
  pay_currency: string
  renewed_from: string | null
  purchased_at: string | null
  expires_at: string | null
  created_at: string
  candidate: { full_name: string; email: string } | null
}

export async function fetchBadges(): Promise<BadgeRow[]> {
  const { data, error } = await client()
    .from('verified_badges')
    .select(
      'id,status,country_code,currency,amount_local,amount_usd,pay_currency,renewed_from,purchased_at,expires_at,created_at,candidate:candidates(full_name,email)',
    )
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) throw error
  return (data ?? []) as unknown as BadgeRow[]
}

/* ---------- Affiliate commissions & payouts ---------- */

export type CommissionRow = {
  id: string
  affiliate_id: string
  event_type: string
  country_code: string | null
  currency: string
  amount_local: number
  amount_usd: number
  status: string
  payout_id: string | null
  earned_at: string
  paid_at: string | null
  affiliate: { referral_code: string; user_id: string } | null
  affiliate_name: string | null
}

export type PayoutRow = {
  id: string
  affiliate_id: string
  amount_usd: number
  status: string
  method: string | null
  reference: string | null
  notes: string | null
  requested_at: string
  paid_at: string | null
  affiliate: { referral_code: string; user_id: string } | null
  affiliate_name: string | null
}

export type BalanceRow = {
  affiliate_id: string
  user_id: string
  referral_code: string
  commission_events: number
  earned_usd: number
  paid_usd: number
  owed_usd: number
  payout_eligible: boolean
  name: string | null
}

async function namesByUserId(userIds: string[]): Promise<Map<string, string>> {
  const sb = client()
  const ids = [...new Set(userIds.filter(Boolean))]
  if (ids.length === 0) return new Map()
  const [c, e] = await Promise.all([
    sb.from('candidates').select('user_id, full_name').in('user_id', ids),
    sb.from('employers').select('user_id, company_name').in('user_id', ids),
  ])
  const map = new Map<string, string>()
  for (const r of (e.data ?? []) as { user_id: string; company_name: string }[]) map.set(r.user_id, r.company_name)
  for (const r of (c.data ?? []) as { user_id: string; full_name: string }[]) map.set(r.user_id, r.full_name)
  return map
}

export async function fetchCommissionData(): Promise<{
  balances: BalanceRow[]
  commissions: CommissionRow[]
  payouts: PayoutRow[]
}> {
  const sb = client()
  const [b, c, p] = await Promise.all([
    sb.from('affiliate_balances').select('*').order('owed_usd', { ascending: false }),
    sb
      .from('affiliate_commissions')
      .select('*, affiliate:affiliates(referral_code,user_id)')
      .order('earned_at', { ascending: false })
      .limit(1000),
    sb
      .from('affiliate_payouts')
      .select('*, affiliate:affiliates(referral_code,user_id)')
      .order('requested_at', { ascending: false })
      .limit(500),
  ])
  if (b.error) throw b.error
  if (c.error) throw c.error
  if (p.error) throw p.error

  const balances = (b.data ?? []) as BalanceRow[]
  const commissions = (c.data ?? []) as unknown as CommissionRow[]
  const payouts = (p.data ?? []) as unknown as PayoutRow[]
  const names = await namesByUserId([
    ...balances.map((x) => x.user_id),
    ...commissions.map((x) => x.affiliate?.user_id ?? ''),
    ...payouts.map((x) => x.affiliate?.user_id ?? ''),
  ])
  return {
    balances: balances.map((x) => ({ ...x, name: names.get(x.user_id) ?? null })),
    commissions: commissions.map((x) => ({ ...x, affiliate_name: names.get(x.affiliate?.user_id ?? '') ?? null })),
    payouts: payouts.map((x) => ({ ...x, affiliate_name: names.get(x.affiliate?.user_id ?? '') ?? null })),
  }
}

/** Bundle every earned commission for an affiliate into one pending payout. */
export async function createPayout(affiliateId: string): Promise<void> {
  const sb = client()
  const { data: rows, error } = await sb
    .from('affiliate_commissions')
    .select('id, amount_usd')
    .eq('affiliate_id', affiliateId)
    .eq('status', 'earned')
  if (error) throw error
  const list = (rows ?? []) as { id: string; amount_usd: number }[]
  if (list.length === 0) throw new Error('Nothing to pay out')
  const total = list.reduce((s, r) => s + Number(r.amount_usd), 0)

  const { data: payout, error: pErr } = await sb
    .from('affiliate_payouts')
    .insert({ affiliate_id: affiliateId, amount_usd: total, status: 'pending' })
    .select('id')
    .single()
  if (pErr) throw pErr

  const { error: uErr } = await sb
    .from('affiliate_commissions')
    .update({ payout_id: payout.id })
    .in(
      'id',
      list.map((r) => r.id),
    )
  if (uErr) throw uErr
}

export async function markPayoutPaid(payoutId: string, reference: string, method: string): Promise<void> {
  const sb = client()
  const now = new Date().toISOString()
  const { error } = await sb
    .from('affiliate_payouts')
    .update({ status: 'paid', paid_at: now, reference: reference || null, method: method || null })
    .eq('id', payoutId)
  if (error) throw error
  const { error: cErr } = await sb
    .from('affiliate_commissions')
    .update({ status: 'paid', paid_at: now })
    .eq('payout_id', payoutId)
    .eq('status', 'earned')
  if (cErr) throw cErr
}
