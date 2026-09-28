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
  /** Null once auto-purged 90 days after review (see partly-sweep) , the decision below still stands. */
  doc_path: string | null
  status: 'pending' | 'approved' | 'rejected'
  notes: string | null
  reviewed_at: string | null
  purged_at: string | null
  created_at: string
  owner_name: string | null
  owner_email: string | null
  owner_country: string | null
  owner_reg_no: string | null
  owner_verified: boolean
  /** The affiliate who referred this owner (link or HR invitation), or null for a direct sign-up. */
  referred_by: { name: string | null; code: string; via_invite: boolean } | null
}

type OwnerRef = { userId: string | null; email: string | null }

/**
 * Batch "who referred this user" lookup for a set of owners. Matches the claimed
 * referral (referred_user_id) first, then a still-open HR invitation addressed to
 * the owner's email , same precedence as fetchReferredBy in registrations.ts.
 */
async function fetchReferrers(owners: OwnerRef[]): Promise<Map<string, VerificationItem['referred_by']>> {
  const sb = client()
  const userIds = [...new Set(owners.map((o) => o.userId).filter((v): v is string => !!v))]
  const emails = [...new Set(owners.map((o) => o.email?.toLowerCase()).filter((v): v is string => !!v))]
  type RefRow = {
    referred_user_id: string | null
    invited_email: string | null
    affiliate: { referral_code: string; user_id: string } | null
  }
  const sel = 'referred_user_id, invited_email, affiliate:affiliates ( referral_code, user_id )'
  const [byUser, byEmail] = await Promise.all([
    userIds.length ? sb.from('affiliate_referrals').select(sel).in('referred_user_id', userIds) : { data: [], error: null },
    emails.length
      ? sb.from('affiliate_referrals').select(sel).is('referred_user_id', null).in('invited_email', emails)
      : { data: [], error: null },
  ])
  if (byUser.error) throw byUser.error
  if (byEmail.error) throw byEmail.error
  const userRows = (byUser.data ?? []) as unknown as RefRow[]
  const emailRows = (byEmail.data ?? []) as unknown as RefRow[]

  const affUserIds = [
    ...new Set([...userRows, ...emailRows].map((r) => r.affiliate?.user_id).filter((v): v is string => !!v)),
  ]
  const names = new Map<string, string>()
  if (affUserIds.length) {
    const [c, e] = await Promise.all([
      sb.from('candidates').select('user_id, full_name').in('user_id', affUserIds),
      sb.from('employers').select('user_id, company_name').in('user_id', affUserIds),
    ])
    for (const r of (e.data ?? []) as { user_id: string; company_name: string }[]) names.set(r.user_id, r.company_name)
    for (const r of (c.data ?? []) as { user_id: string; full_name: string }[]) names.set(r.user_id, r.full_name)
  }

  const toRef = (r: RefRow): VerificationItem['referred_by'] => ({
    name: r.affiliate ? (names.get(r.affiliate.user_id) ?? null) : null,
    code: r.affiliate?.referral_code ?? ',',
    via_invite: !r.referred_user_id,
  })
  const byUserId = new Map(userRows.map((r) => [r.referred_user_id as string, r]))
  const byInvite = new Map(emailRows.map((r) => [(r.invited_email ?? '').toLowerCase(), r]))

  const out = new Map<string, VerificationItem['referred_by']>()
  for (const o of owners) {
    const r = (o.userId && byUserId.get(o.userId)) || (o.email && byInvite.get(o.email.toLowerCase())) || null
    if (o.userId) out.set(o.userId, r ? toRef(r) : null)
  }
  return out
}

export async function fetchVerificationQueue(): Promise<VerificationItem[]> {
  const sb = client()
  const { data, error } = await sb
    .from('verification_documents')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) throw error
  const docs = (data ?? []) as Omit<
    VerificationItem,
    'owner_name' | 'owner_email' | 'owner_country' | 'owner_reg_no' | 'owner_verified' | 'referred_by'
  >[]

  const candIds = docs.filter((d) => d.owner_kind === 'candidate').map((d) => d.owner_id)
  const empIds = docs.filter((d) => d.owner_kind === 'employer').map((d) => d.owner_id)
  const [cands, emps] = await Promise.all([
    candIds.length
      ? sb.from('candidates').select('id, user_id, full_name, email, country_code, identity_verified').in('id', candIds)
      : Promise.resolve({ data: [] as unknown[] }),
    empIds.length
      ? sb.from('employers').select('id, user_id, company_name, business_email, country_code, reg_no, registration_verified').in('id', empIds)
      : Promise.resolve({ data: [] as unknown[] }),
  ])
  const cmap = new Map(
    ((cands.data ?? []) as { id: string; user_id: string | null; full_name: string; email: string; country_code: string | null; identity_verified: boolean }[]).map((c) => [c.id, c]),
  )
  const emap = new Map(
    ((emps.data ?? []) as { id: string; user_id: string | null; company_name: string; business_email: string; country_code: string | null; reg_no: string; registration_verified: boolean }[]).map((e) => [e.id, e]),
  )

  const owners: OwnerRef[] = [
    ...[...cmap.values()].map((c) => ({ userId: c.user_id, email: c.email })),
    ...[...emap.values()].map((e) => ({ userId: e.user_id, email: e.business_email })),
  ]
  // Attribution is context for the reviewer , never let it block the queue.
  const referrers = await fetchReferrers(owners).catch(() => new Map<string, VerificationItem['referred_by']>())

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
        referred_by: (c?.user_id && referrers.get(c.user_id)) || null,
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
      referred_by: (e?.user_id && referrers.get(e.user_id)) || null,
    }
  })
}

/** Count only, for the sidebar badge , avoids pulling the full queue + owner joins. */
export async function fetchPendingVerificationCount(): Promise<number> {
  const { count, error } = await client()
    .from('verification_documents')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
  if (error) throw error
  return count ?? 0
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
  suspended: boolean
  suspended_reason: string | null
  applications: number
  matches: number
  released: number
  unlocked: number
}

export async function fetchPostings(): Promise<PostingRow[]> {
  const { data, error } = await client()
    .from('jobs')
    .select(
      'id,title,company_name,country,category,project_type,status,matching_status,posted_at,closed_at,suspended,suspended_reason,job_applications(count),posting_matches(count),contact_releases(status)',
    )
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

/** Freezes/reinstates a single posting , disappears from every public listing immediately. */
export async function setJobSuspended(jobId: string, suspended: boolean, reason: string | null, adminId: string): Promise<void> {
  const { error } = await client().rpc('admin_set_job_suspended', {
    p_job_id: jobId,
    p_suspended: suspended,
    p_reason: reason,
    p_admin_id: adminId,
  })
  if (error) throw error
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

/* ---------- Reports ---------- */

export type ReportRow = {
  id: string
  reporter_user_id: string | null
  reporter_email: string | null
  target_kind: 'job' | 'employer' | 'candidate'
  target_id: string
  reason: string
  details: string | null
  status: 'open' | 'reviewed' | 'dismissed'
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  target_label: string | null
}

export async function fetchReports(): Promise<ReportRow[]> {
  const sb = client()
  const { data, error } = await sb
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) throw error
  const rows = (data ?? []) as Omit<ReportRow, 'target_label'>[]

  const jobIds = rows.filter((r) => r.target_kind === 'job').map((r) => r.target_id)
  const empIds = rows.filter((r) => r.target_kind === 'employer').map((r) => r.target_id)
  const candIds = rows.filter((r) => r.target_kind === 'candidate').map((r) => r.target_id)

  const [jobs, emps, cands] = await Promise.all([
    jobIds.length ? sb.from('jobs').select('id, title').in('id', jobIds) : Promise.resolve({ data: [] as unknown[] }),
    empIds.length ? sb.from('employers').select('id, company_name').in('id', empIds) : Promise.resolve({ data: [] as unknown[] }),
    candIds.length ? sb.from('candidates').select('id, full_name').in('id', candIds) : Promise.resolve({ data: [] as unknown[] }),
  ])
  const jobMap = new Map(((jobs.data ?? []) as { id: string; title: string }[]).map((j) => [j.id, j.title]))
  const empMap = new Map(((emps.data ?? []) as { id: string; company_name: string }[]).map((e) => [e.id, e.company_name]))
  const candMap = new Map(((cands.data ?? []) as { id: string; full_name: string }[]).map((c) => [c.id, c.full_name]))

  return rows.map((r) => ({
    ...r,
    target_label:
      r.target_kind === 'job' ? (jobMap.get(r.target_id) ?? null)
      : r.target_kind === 'employer' ? (empMap.get(r.target_id) ?? null)
      : (candMap.get(r.target_id) ?? null),
  }))
}

export async function updateReportStatus(id: string, status: ReportRow['status'], adminId: string): Promise<void> {
  const { error } = await client()
    .from('reports')
    .update({ status, reviewed_by: adminId, reviewed_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

/* ---------- Issue reports (product feedback from signed-in users) ---------- */

export type IssueRow = {
  id: string
  user_id: string
  user_email: string | null
  user_role: 'expert' | 'business' | null
  category: 'bug' | 'payment' | 'account' | 'suggestion' | 'other'
  message: string
  page_url: string | null
  user_agent: string | null
  status: 'open' | 'in_progress' | 'resolved'
  staff_note: string | null
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
}

export async function fetchIssueReports(): Promise<IssueRow[]> {
  const { data, error } = await client()
    .from('issue_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) throw error
  return (data ?? []) as IssueRow[]
}

export async function fetchOpenIssueCount(): Promise<number> {
  const { count, error } = await client()
    .from('issue_reports')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'open')
  if (error) throw error
  return count ?? 0
}

export async function updateIssueStatus(id: string, status: IssueRow['status'], adminId: string): Promise<void> {
  const resolved = status === 'resolved'
  const { error } = await client()
    .from('issue_reports')
    .update({
      status,
      resolved_by: resolved ? adminId : null,
      resolved_at: resolved ? new Date().toISOString() : null,
    })
    .eq('id', id)
  if (error) throw error
}

/* ---------- Ratings ---------- */

export type RatingRow = {
  id: string
  release_id: string
  rater_kind: 'candidate' | 'employer'
  rater_user_id: string
  ratee_kind: 'candidate' | 'employer'
  ratee_id: string
  stars: number
  comment: string | null
  created_at: string
  rater_label: string | null
  ratee_label: string | null
}

export async function fetchRatings(): Promise<RatingRow[]> {
  const sb = client()
  const { data, error } = await sb
    .from('ratings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) throw error
  const rows = (data ?? []) as Omit<RatingRow, 'rater_label' | 'ratee_label'>[]
  if (rows.length === 0) return []

  const candIds = [...new Set(rows.filter((r) => r.rater_kind === 'candidate' || r.ratee_kind === 'candidate').map((r) => (r.rater_kind === 'candidate' ? r.rater_user_id : r.ratee_id)))]
  const empIds = [...new Set(rows.filter((r) => r.ratee_kind === 'employer').map((r) => r.ratee_id))]
  const empUserIds = [...new Set(rows.filter((r) => r.rater_kind === 'employer').map((r) => r.rater_user_id))]

  const [candByUser, candById, empById, empByUser] = await Promise.all([
    sb.from('candidates').select('user_id, full_name').in('user_id', candIds.length ? candIds : ['00000000-0000-0000-0000-000000000000']),
    sb.from('candidates').select('id, full_name').in('id', rows.filter((r) => r.ratee_kind === 'candidate').map((r) => r.ratee_id)),
    sb.from('employers').select('id, company_name').in('id', empIds.length ? empIds : ['00000000-0000-0000-0000-000000000000']),
    sb.from('employers').select('user_id, company_name').in('user_id', empUserIds.length ? empUserIds : ['00000000-0000-0000-0000-000000000000']),
  ])

  const candNameByUser = new Map(((candByUser.data ?? []) as { user_id: string; full_name: string }[]).map((c) => [c.user_id, c.full_name]))
  const candNameById = new Map(((candById.data ?? []) as { id: string; full_name: string }[]).map((c) => [c.id, c.full_name]))
  const empNameById = new Map(((empById.data ?? []) as { id: string; company_name: string }[]).map((e) => [e.id, e.company_name]))
  const empNameByUser = new Map(((empByUser.data ?? []) as { user_id: string; company_name: string }[]).map((e) => [e.user_id, e.company_name]))

  return rows.map((r) => ({
    ...r,
    rater_label: r.rater_kind === 'candidate' ? (candNameByUser.get(r.rater_user_id) ?? null) : (empNameByUser.get(r.rater_user_id) ?? null),
    ratee_label: r.ratee_kind === 'candidate' ? (candNameById.get(r.ratee_id) ?? null) : (empNameById.get(r.ratee_id) ?? null),
  }))
}

export async function deleteRating(id: string): Promise<void> {
  const { error } = await client().from('ratings').delete().eq('id', id)
  if (error) throw error
}
