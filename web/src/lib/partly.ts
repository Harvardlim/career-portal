// Data layer for the partly.asia matching flow: postings ("needs"), the
// 10-match shortlist, contact releases, lead unlocks, verification, badges,
// notifications and affiliate commissions. Everything that changes state goes
// through the SECURITY DEFINER functions in supabase/migrations/20260920*.
import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { SITE_URL } from './site'
import { useSession } from './useSession'

/* ---------- Pricing ---------- */

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
  affiliate_lead_local: number
  affiliate_lead_usd: number
  affiliate_badge_local: number
  affiliate_badge_usd: number
  active: boolean
  sort_order: number
}

export const EXPERT_COUNTRIES = ['SG', 'MY', 'ID', 'TH', 'VN'] as const
export type ExpertCountry = (typeof EXPERT_COUNTRIES)[number]

export const ID_TYPE_BY_COUNTRY: Record<ExpertCountry, string> = {
  SG: 'NRIC / FIN',
  MY: 'MyKad',
  ID: 'KTP',
  TH: 'Thai National ID',
  VN: 'CCCD',
}

export async function fetchPricing(): Promise<PricingCountry[]> {
  const { data, error } = await supabase
    .from('pricing_countries')
    .select('*')
    .eq('active', true)
    .order('sort_order')
  if (error) throw error
  return (data ?? []) as PricingCountry[]
}

export function usePricing() {
  const [rows, setRows] = useState<PricingCountry[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let alive = true
    fetchPricing()
      .then((r) => alive && setRows(r))
      .catch((err) => console.error('pricing', err))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])
  return { pricing: rows, loading }
}

export function formatLocal(p: PricingCountry, amount: number): string {
  const n =
    p.zero_decimal || Number.isInteger(amount)
      ? amount.toLocaleString('en-US')
      : amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${p.currency_symbol}${n}`
}

export function formatUsd(amount: number): string {
  return `USD ${amount.toLocaleString('en-US')}`
}

/* ---------- Postings (a Business's need) ---------- */

export type ProjectType = 'hourly' | 'project' | 'time_based' | 'fractional' | 'ongoing'

export const PROJECT_TYPES: { value: ProjectType; label: string; hint: string }[] = [
  { value: 'hourly', label: 'Hourly', hint: 'Pay by the hour, as needed' },
  { value: 'project', label: 'Project-based', hint: 'A defined deliverable' },
  { value: 'time_based', label: 'Time-based', hint: 'e.g. 1 month, 3 months' },
  { value: 'fractional', label: 'Fractional', hint: 'A few days a week, ongoing' },
  { value: 'ongoing', label: 'Ongoing', hint: 'Open-ended engagement' },
]

export type MatchingStatus =
  | 'open'
  | 'matched'
  | 'released'
  | 'no_further_matches'
  | 'closed'

export type PostingInput = {
  title: string
  description: string
  country: string
  project_type: ProjectType
  project_duration: string | null
  budget_min: number | null
  budget_max: number | null
  budget_currency: string
  people_required: number
  skill_requirements: string[]
  main_category_id: string
  subcategory_ids: string[]
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

export async function createPosting(
  employerId: string,
  companyName: string,
  input: PostingInput,
): Promise<string> {
  const { subcategory_ids, ...fields } = input
  const { data: cat } = await supabase
    .from('categories')
    .select('name')
    .eq('id', input.main_category_id)
    .maybeSingle()

  const { data, error } = await supabase
    .from('jobs')
    .insert({
      ...fields,
      employer_id: employerId,
      company_name: companyName,
      category: cat?.name ?? null,
      slug: `${slugify(input.title)}-${Math.random().toString(36).slice(2, 8)}`,
      status: 'active',
      matching_status: 'open',
      apply_method: 'on_platform',
      posted_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (error) throw error

  if (subcategory_ids.length > 0) {
    const { error: subErr } = await supabase
      .from('job_subcategories')
      .insert(subcategory_ids.map((subcategory_id) => ({ job_id: data.id, subcategory_id })))
    if (subErr) throw subErr
  }
  return data.id as string
}

export type PostingRow = {
  id: string
  slug: string
  title: string
  company_name: string
  country: string | null
  project_type: ProjectType | null
  project_duration: string | null
  budget_min: number | null
  budget_max: number | null
  budget_currency: string | null
  people_required: number
  skill_requirements: string[]
  category: string | null
  main_category_id: string | null
  status: string
  matching_status: MatchingStatus
  matches_generated_at: string | null
  closed_at: string | null
  posted_at: string
  description: string | null
}

const POSTING_COLUMNS =
  'id,slug,title,company_name,country,project_type,project_duration,budget_min,budget_max,budget_currency,people_required,skill_requirements,category,main_category_id,status,matching_status,matches_generated_at,closed_at,posted_at,description'

export type MyPostingRow = PostingRow & {
  applications: number
  matches: number
  released: number
  unlocked: number
}

export async function fetchMyPostings(employerId: string): Promise<MyPostingRow[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select(
      `${POSTING_COLUMNS}, job_applications(count), posting_matches(count), contact_releases(status)`,
    )
    .eq('employer_id', employerId)
    .order('posted_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => {
    const r = row as unknown as PostingRow & {
      job_applications: { count: number }[]
      posting_matches: { count: number }[]
      contact_releases: { status: string }[]
    }
    return {
      ...r,
      applications: r.job_applications?.[0]?.count ?? 0,
      matches: r.posting_matches?.[0]?.count ?? 0,
      released: r.contact_releases?.length ?? 0,
      unlocked: r.contact_releases?.filter((c) => c.status === 'paid').length ?? 0,
    }
  })
}

export async function fetchPosting(id: string): Promise<PostingRow | null> {
  const { data, error } = await supabase.from('jobs').select(POSTING_COLUMNS).eq('id', id).maybeSingle()
  if (error) throw error
  return (data as PostingRow | null) ?? null
}

/* ---------- Open needs feed (Expert side) ---------- */

export type NeedFilters = {
  categoryId?: string
  country?: string
  projectType?: ProjectType | ''
  q?: string
}

export type OpenNeedRow = PostingRow & {
  subcategories: { id: string; name: string }[]
  applied: boolean
}

export async function fetchOpenNeeds(filters: NeedFilters, candidateId?: string): Promise<OpenNeedRow[]> {
  let q = supabase
    .from('jobs')
    .select(`${POSTING_COLUMNS}, job_subcategories(subcategories(id,name))`)
    .eq('status', 'active')
    .in('matching_status', ['open', 'matched'])
    .not('main_category_id', 'is', null)
    .order('posted_at', { ascending: false })
    .limit(100)
  if (filters.categoryId) q = q.eq('main_category_id', filters.categoryId)
  if (filters.country) q = q.eq('country', filters.country)
  if (filters.projectType) q = q.eq('project_type', filters.projectType)
  if (filters.q) q = q.ilike('title', `%${filters.q}%`)
  const { data, error } = await q
  if (error) throw error

  let appliedIds = new Set<string>()
  if (candidateId) {
    const { data: apps } = await supabase
      .from('job_applications')
      .select('job_id')
      .eq('candidate_id', candidateId)
    appliedIds = new Set((apps ?? []).map((a) => a.job_id as string))
  }

  return (data ?? []).map((row) => {
    const r = row as unknown as PostingRow & {
      job_subcategories: { subcategories: { id: string; name: string } | null }[]
    }
    return {
      ...r,
      subcategories: (r.job_subcategories ?? [])
        .map((s) => s.subcategories)
        .filter((s): s is { id: string; name: string } => !!s),
      applied: appliedIds.has(r.id),
    }
  })
}

/** The Expert's own opt-in; there is no cold outreach from the platform. */
export async function applyToNeed(jobId: string, candidateId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('job_applications')
    .insert({ job_id: jobId, candidate_id: candidateId, user_id: userId })
  if (error && error.code !== '23505') throw error
}

/* ---------- Matches (Business side) ---------- */

export type MatchCard = {
  match_id: string
  job_id: string
  rank: number
  score: number
  candidate_id: string
  full_name: string
  headline: string | null
  title: string | null
  avatar_path: string | null
  years_experience: string | null
  expertise_field: string[] | null
  country_code: string | null
  identity_verified: boolean
  badge_verified: boolean
  public_slug: string | null
  release_id: string | null
  release_status: 'awaiting_payment' | 'paid' | 'cold' | 'job_closed' | null
  window_expires_at: string | null
  paid_at: string | null
}

export async function generateMatches(jobId: string): Promise<number> {
  const { data, error } = await supabase.rpc('generate_posting_matches', { p_job_id: jobId })
  if (error) throw error
  return Number(data ?? 0)
}

export async function fetchMatches(jobId: string): Promise<MatchCard[]> {
  const { data, error } = await supabase
    .from('match_candidate_cards')
    .select('*')
    .eq('job_id', jobId)
    .order('rank')
  if (error) throw error
  return (data ?? []) as MatchCard[]
}

export async function releaseContact(jobId: string, candidateIds: string[]): Promise<number> {
  const { data, error } = await supabase.rpc('release_contact', {
    p_job_id: jobId,
    p_candidate_ids: candidateIds,
  })
  if (error) throw error
  return Number(data ?? 0)
}

export async function markNoFurtherMatches(jobId: string): Promise<void> {
  const { error } = await supabase.rpc('mark_no_further_matches', { p_job_id: jobId })
  if (error) throw error
}

export async function closePosting(jobId: string): Promise<number> {
  const { data, error } = await supabase.rpc('close_posting', { p_job_id: jobId })
  if (error) throw error
  return Number(data ?? 0)
}

export type BusinessContact = {
  release_id: string
  job_id: string
  posting_title: string
  candidate_id: string
  full_name: string
  headline: string | null
  email: string
  contact_number: string
  linkedin_url: string | null
  badge_verified: boolean
  paid_at: string
  contact_expires_at: string
}

export async function fetchBusinessContacts(jobId?: string): Promise<BusinessContact[]> {
  let q = supabase.from('business_lead_contacts').select('*').order('paid_at', { ascending: false })
  if (jobId) q = q.eq('job_id', jobId)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as BusinessContact[]
}

/* ---------- Leads (Expert side) ---------- */

export type LeadStatus = 'awaiting_payment' | 'paid' | 'cold' | 'job_closed'

export type LeadRow = {
  id: string
  job_id: string
  released_at: string
  window_expires_at: string
  status: LeadStatus
  paid_at: string | null
  contact_expires_at: string | null
  ended_reason: string | null
  cohort_size: number
  others_released: number
  window_open: boolean
  seconds_left: number
  contact_visible: boolean
  job: {
    id: string
    title: string
    category: string | null
    country: string | null
    project_type: ProjectType | null
    project_duration: string | null
    budget_min: number | null
    budget_max: number | null
    budget_currency: string | null
    description: string | null
  } | null
}

const LEAD_JOB = 'job:jobs(id,title,category,country,project_type,project_duration,budget_min,budget_max,budget_currency,description)'

export async function fetchMyLeads(candidateId: string): Promise<LeadRow[]> {
  const { data, error } = await supabase
    .from('contact_release_details')
    .select(`*, ${LEAD_JOB}`)
    .eq('candidate_id', candidateId)
    .order('released_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as LeadRow[]
}

export async function fetchLead(releaseId: string): Promise<LeadRow | null> {
  const { data, error } = await supabase
    .from('contact_release_details')
    .select(`*, ${LEAD_JOB}`)
    .eq('id', releaseId)
    .maybeSingle()
  if (error) throw error
  return (data as unknown as LeadRow | null) ?? null
}

export type ExpertContact = {
  release_id: string
  job_id: string
  posting_title: string
  company_name: string
  business_email: string
  phone: string | null
  website: string | null
  location: string | null
  paid_at: string
  contact_expires_at: string
}

export async function fetchLeadContact(releaseId: string): Promise<ExpertContact | null> {
  const { data, error } = await supabase
    .from('expert_lead_contacts')
    .select('*')
    .eq('release_id', releaseId)
    .maybeSingle()
  if (error) throw error
  return (data as ExpertContact | null) ?? null
}

export type PayCurrency = 'local' | 'usd'

async function invokeCheckout(body: Record<string, unknown>): Promise<never> {
  const { data, error } = await supabase.functions.invoke('stripe-checkout', {
    body: { ...body, origin: SITE_URL },
  })
  if (error) {
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
  return new Promise<never>(() => {})
}

export function startLeadUnlock(releaseId: string, pay: PayCurrency): Promise<never> {
  return invokeCheckout({ kind: 'lead_unlock', release_id: releaseId, pay })
}

export function startBadgeCheckout(pay: PayCurrency): Promise<never> {
  return invokeCheckout({ kind: 'verified_badge', pay })
}

/* ---------- Verification ---------- */

export type VerificationDoc = {
  id: string
  owner_kind: 'candidate' | 'employer'
  owner_id: string
  doc_type: 'identity' | 'business_registration' | 'credential'
  doc_path: string
  status: 'pending' | 'approved' | 'rejected'
  notes: string | null
  reviewed_at: string | null
  created_at: string
}

export async function fetchMyVerificationDocs(userId: string): Promise<VerificationDoc[]> {
  const { data, error } = await supabase
    .from('verification_documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as VerificationDoc[]
}

export async function uploadVerificationDoc(args: {
  userId: string
  ownerKind: 'candidate' | 'employer'
  ownerId: string
  docType: VerificationDoc['doc_type']
  file: File
}): Promise<void> {
  const ext = args.file.name.split('.').pop()?.toLowerCase() ?? 'bin'
  const path = `${args.userId}/${args.docType}-${Date.now()}.${ext}`
  const { error: upErr } = await supabase.storage
    .from('verification-docs')
    .upload(path, args.file, { upsert: false })
  if (upErr) throw upErr
  const { error } = await supabase.from('verification_documents').insert({
    owner_kind: args.ownerKind,
    owner_id: args.ownerId,
    user_id: args.userId,
    doc_type: args.docType,
    doc_path: path,
  })
  if (error) throw error
}

/** The digits are encrypted server-side and never come back down. */
export async function saveIdentityDigits(countryCode: string, last5: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('expert-identity', {
    body: { country_code: countryCode, last5 },
  })
  if (error) {
    const ctx = (error as { context?: Response }).context
    if (ctx && typeof ctx.json === 'function') {
      const parsed = (await ctx.json().catch(() => null)) as { error?: string } | null
      if (parsed?.error) throw new Error(parsed.error)
    }
    throw new Error(error.message || 'Could not save your ID details.')
  }
  if (!(data as { ok?: boolean } | null)?.ok) throw new Error('Could not save your ID details.')
}

export type BadgeRow = {
  id: string
  status: 'pending' | 'active' | 'superseded' | 'expired' | 'cancelled'
  country_code: string | null
  currency: string
  amount_local: number
  amount_usd: number
  purchased_at: string | null
  starts_at: string | null
  expires_at: string | null
  renewed_from: string | null
}

export async function fetchMyBadges(candidateId: string): Promise<BadgeRow[]> {
  const { data, error } = await supabase
    .from('verified_badges')
    .select('id,status,country_code,currency,amount_local,amount_usd,purchased_at,starts_at,expires_at,renewed_from')
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as BadgeRow[]
}

/* ---------- Notifications ---------- */

export type NotificationRow = {
  id: string
  kind: string
  title: string
  body: string | null
  link: string | null
  payload: Record<string, unknown>
  read_at: string | null
  created_at: string
}

export async function fetchNotifications(userId: string, limit = 30): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as NotificationRow[]
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null)
  if (error) throw error
}

export function useNotifications() {
  const { session } = useSession()
  const [rows, setRows] = useState<NotificationRow[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!session) {
      setRows([])
      setLoading(false)
      return
    }
    try {
      setRows(await fetchNotifications(session.user.id))
    } catch (err) {
      console.error('notifications', err)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    void reload()
    if (!session) return
    const channel = supabase
      .channel(`notifications:${session.user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` },
        () => void reload(),
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [session, reload])

  const unread = rows.filter((r) => !r.read_at).length
  return { notifications: rows, unread, loading, reload }
}

/* ---------- Affiliate ledger ---------- */

export type CommissionRow = {
  id: string
  event_type: 'badge_purchase' | 'badge_renewal' | 'lead_unlock'
  country_code: string | null
  currency: string
  amount_local: number
  amount_usd: number
  status: 'earned' | 'paid' | 'void'
  earned_at: string
  paid_at: string | null
}

export type AffiliateBalance = {
  affiliate_id: string
  referral_code: string
  commission_events: number
  earned_usd: number
  paid_usd: number
  owed_usd: number
  payout_eligible: boolean
}

export async function fetchMyCommissions(affiliateId: string): Promise<CommissionRow[]> {
  const { data, error } = await supabase
    .from('affiliate_commissions')
    .select('id,event_type,country_code,currency,amount_local,amount_usd,status,earned_at,paid_at')
    .eq('affiliate_id', affiliateId)
    .order('earned_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as CommissionRow[]
}

export async function fetchMyBalance(userId: string): Promise<AffiliateBalance | null> {
  const { data, error } = await supabase
    .from('affiliate_balances')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return (data as AffiliateBalance | null) ?? null
}

/* ---------- Helpers ---------- */

export function budgetLabel(p: {
  budget_min: number | null
  budget_max: number | null
  budget_currency: string | null
}): string {
  const cur = p.budget_currency ?? 'USD'
  const fmt = (n: number) => n.toLocaleString('en-US')
  if (p.budget_min != null && p.budget_max != null) return `${cur} ${fmt(p.budget_min)} – ${fmt(p.budget_max)}`
  if (p.budget_min != null) return `From ${cur} ${fmt(p.budget_min)}`
  if (p.budget_max != null) return `Up to ${cur} ${fmt(p.budget_max)}`
  return 'Budget on request'
}

export function projectTypeLabel(t: ProjectType | null | undefined): string {
  return PROJECT_TYPES.find((p) => p.value === t)?.label ?? '—'
}

export const COUNTRY_NAMES: Record<string, string> = {
  SG: 'Singapore',
  MY: 'Malaysia',
  ID: 'Indonesia',
  TH: 'Thailand',
  VN: 'Vietnam',
  US: 'United States',
  GB: 'United Kingdom',
  AU: 'Australia',
  HK: 'Hong Kong',
  PH: 'Philippines',
  IN: 'India',
  JP: 'Japan',
  KR: 'South Korea',
  CN: 'China',
  DE: 'Germany',
  FR: 'France',
  NL: 'Netherlands',
  AE: 'United Arab Emirates',
  OTHER: 'Other',
}

export function countryName(code: string | null | undefined): string {
  if (!code) return '—'
  return COUNTRY_NAMES[code] ?? code
}

/** "1d 3h 12m" style countdown; ticks once a second while mounted. */
export function useCountdown(until: string | null | undefined): {
  label: string
  expired: boolean
  secondsLeft: number
} {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  if (!until) return { label: '—', expired: true, secondsLeft: 0 }
  const secondsLeft = Math.max(0, Math.floor((new Date(until).getTime() - now) / 1000))
  const d = Math.floor(secondsLeft / 86400)
  const h = Math.floor((secondsLeft % 86400) / 3600)
  const m = Math.floor((secondsLeft % 3600) / 60)
  const s = secondsLeft % 60
  const label =
    d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`
  return { label, expired: secondsLeft === 0, secondsLeft }
}
