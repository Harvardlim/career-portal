// Data layer for the partly.asia matching flow: postings ("needs"), the
// 10-match shortlist, contact releases, lead unlocks, verification, badges,
// notifications and affiliate commissions. Everything that changes state goes
// through the SECURITY DEFINER functions in supabase/migrations/20260920*.
import { useCallback, useEffect, useState } from 'react'
import { apiViaProxy, supabase } from './supabase'
import { SITE_URL } from './site'
import { currentLocale, tr } from './i18n'
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

export const EXPERT_COUNTRIES = ['SG', 'MY', 'ID', 'TH', 'VN', 'PH'] as const
export type ExpertCountry = (typeof EXPERT_COUNTRIES)[number]

/** Stored as-is on the candidate row, so always English. */
export const ID_TYPE_EN: Record<ExpertCountry, string> = {
  SG: 'NRIC / FIN',
  MY: 'MyKad',
  ID: 'KTP',
  TH: 'Thai National ID',
  VN: 'CCCD',
  PH: 'PhilSys National ID',
}

/** Same ID types, named in the active language for display. */
export const ID_TYPE_BY_COUNTRY: Record<ExpertCountry, string> = {
  SG: 'NRIC / FIN',
  MY: 'MyKad',
  ID: 'KTP',
  get TH() {
    return tr('id.type.th')
  },
  VN: 'CCCD',
  get PH() {
    return tr('id.type.ph')
  },
}

/** Same formats the expert-identity edge function enforces ,  keep in sync. */
export const ID_LAST4_FORMAT: Record<ExpertCountry, { pattern: RegExp; hint: string; example: string }> = {
  SG: { pattern: /^[0-9]{3}[A-Z]$/, get hint() { return tr('id.hint.sg') }, example: '567D' },
  MY: { pattern: /^[0-9]{4}$/, get hint() { return tr('id.hint.last4') }, example: '1234' },
  ID: { pattern: /^[0-9]{4}$/, get hint() { return tr('id.hint.nik') }, example: '1234' },
  TH: { pattern: /^[0-9]{4}$/, get hint() { return tr('id.hint.last4') }, example: '1234' },
  VN: { pattern: /^[0-9]{4}$/, get hint() { return tr('id.hint.last4') }, example: '1234' },
  PH: { pattern: /^[0-9]{4}$/, get hint() { return tr('id.hint.psn') }, example: '1234' },
}

/** Null when the digits are fine for that country, else a message to show. */
export function idLast4Problem(country: ExpertCountry, last4: string): string | null {
  const f = ID_LAST4_FORMAT[country]
  if (f.pattern.test(last4)) return null
  return tr('val.id_last4', { idType: ID_TYPE_BY_COUNTRY[country], hint: f.hint, example: f.example })
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

/** Every price is shown in both currencies: "S$199 · USD 145". */
export function formatBoth(p: PricingCountry, local: number, usd: number): string {
  return `${formatLocal(p, local)} · ${formatUsd(usd)}`
}

/** A recorded payment (badge row, lead payment) in both currencies, from the amounts stored with it. */
export function formatPaid(
  p: PricingCountry | undefined,
  paid: { currency: string; amount_local: number; amount_usd: number },
): string {
  const local = p ? formatLocal(p, paid.amount_local) : `${paid.currency} ${Number(paid.amount_local).toLocaleString('en-US')}`
  return `${local} · ${formatUsd(Number(paid.amount_usd))}`
}

/* ---------- Postings (a Business's need) ---------- */

export type ProjectType = 'hourly' | 'project' | 'time_based' | 'fractional' | 'ongoing' | 'full_time'

export const PROJECT_TYPES: { value: ProjectType; label: string; hint: string }[] = [
  { value: 'hourly', get label() { return tr('pt.hourly') }, get hint() { return tr('pt.hourly.hint') } },
  { value: 'project', get label() { return tr('pt.project') }, get hint() { return tr('pt.project.hint') } },
  { value: 'time_based', get label() { return tr('pt.time_based') }, get hint() { return tr('pt.time_based.hint') } },
  { value: 'fractional', get label() { return tr('pt.fractional') }, get hint() { return tr('pt.fractional.hint') } },
  { value: 'ongoing', get label() { return tr('pt.ongoing') }, get hint() { return tr('pt.ongoing.hint') } },
  { value: 'full_time', get label() { return tr('pt.full_time') }, get hint() { return tr('pt.full_time.hint') } },
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

/** Human-readable problem with a posting's details, or null when every detail is filled in. */
export function validatePostingInput(
  input: PostingInput,
  opts: { requireSubcategory?: boolean } = {},
): string | null {
  if (input.title.trim().length < 5) return tr('val.title')
  if (!input.main_category_id) return tr('val.main_category')
  if (opts.requireSubcategory && input.subcategory_ids.length === 0) return tr('val.subcategory')
  if (input.description.trim().length < 30) {
    return tr('val.brief')
  }
  if (!input.country) return tr('val.country')
  if (!input.project_type) return tr('val.project_type')
  if (!input.project_duration?.trim()) return tr('val.duration')
  if (input.skill_requirements.length === 0) return tr('val.skills')
  if (!Number.isFinite(input.people_required) || input.people_required < 1) return tr('val.people')
  if (input.budget_min == null || input.budget_max == null) return tr('val.budget_range')
  if (input.budget_min <= 0 || input.budget_max <= 0) return tr('val.budget_positive')
  if (input.budget_min > input.budget_max) return tr('val.budget_order')
  return null
}

/** How long a need stays open for applications. */
export const NEED_LIVE_DAYS = 30

export async function createPosting(
  employerId: string,
  companyName: string,
  input: PostingInput,
): Promise<string> {
  const problem = validatePostingInput(input)
  if (problem) throw new Error(problem)

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
      expires_at: new Date(Date.now() + NEED_LIVE_DAYS * 86_400_000).toISOString(),
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
  expires_at: string | null
  description: string | null
  // Legacy job-board columns, used when the partly fields are empty.
  job_type: string | null
  location: string | null
  salary_label: string | null
  tags: string[] | null
  suspended: boolean
  suspended_reason: string | null
}

const POSTING_COLUMNS =
  'id,slug,title,company_name,country,project_type,project_duration,budget_min,budget_max,budget_currency,people_required,skill_requirements,category,main_category_id,status,matching_status,matches_generated_at,closed_at,posted_at,expires_at,description,job_type,location,salary_label,tags,suspended,suspended_reason'

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
  categoryName?: string
  /** Any of these category names (an expert's own categories). Ignored when categoryId is set. */
  categoryNames?: string[]
  country?: string
  projectType?: ProjectType | ''
  minBudget?: number
  q?: string
}

export type OpenNeedRow = PostingRow & {
  subcategories: { id: string; name: string }[]
  applied: boolean
  /** The posting business's verification tier, shown to experts as Basic / Fully verified. */
  business_basic_verified: boolean
  business_badge_verified: boolean
}

/**
 * Experts may only apply to needs in a category they serve (their expert
 * categories). A posting with no category at all isn't restricted. The
 * database enforces the same rule on every application.
 */
export function isOutsideExpertise(postingCategory: string | null | undefined, expertise: string[] | null | undefined): boolean {
  if (!postingCategory) return false
  const mine = (expertise ?? []).map((c) => c.trim().toLowerCase())
  return !mine.includes(postingCategory.trim().toLowerCase())
}

export async function fetchOpenNeeds(filters: NeedFilters, candidateId?: string): Promise<OpenNeedRow[]> {
  // Every active job owned by a business is an open need -- including rows
  // created before the partly fields existed, which carry only the legacy
  // category name / location / job_type columns. A posting with no business
  // (a bare backoffice draft) can never draw matches, so it isn't listed, and
  // the database refuses applications to it. 'released' postings stay listed:
  // new applicants still fill any free slots on the shortlist.
  let q = supabase
    .from('jobs')
    .select(`${POSTING_COLUMNS}, job_subcategories(subcategories(id,name)), employer:employers(basic_verified,verified_badge_until)`)
    .eq('status', 'active')
    .eq('suspended', false)
    .not('employer_id', 'is', null)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .in('matching_status', ['open', 'matched', 'released'])
    .order('posted_at', { ascending: false })
    .limit(100)
  if (!filters.categoryId && filters.categoryNames && filters.categoryNames.length > 0) {
    q = q.in('category', filters.categoryNames)
  }
  if (filters.categoryId) {
    q = filters.categoryName
      ? q.or(`main_category_id.eq.${filters.categoryId},category.eq.${filters.categoryName.replace(/,/g, ' ')}`)
      : q.eq('main_category_id', filters.categoryId)
  }
  if (filters.country) {
    const name = COUNTRY_NAMES[filters.country]
    q = name ? q.or(`country.eq.${filters.country},location.ilike.%${name}%`) : q.eq('country', filters.country)
  }
  if (filters.projectType) q = q.eq('project_type', filters.projectType)
  if (filters.minBudget) q = q.or(`budget_max.gte.${filters.minBudget},salary_max.gte.${filters.minBudget}`)
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
      employer: { basic_verified: boolean; verified_badge_until: string | null } | null
    }
    return {
      ...r,
      business_basic_verified: !!r.employer?.basic_verified,
      business_badge_verified:
        !!r.employer?.verified_badge_until && new Date(r.employer.verified_badge_until) > new Date(),
      subcategories: (r.job_subcategories ?? [])
        .map((s) => s.subcategories)
        .filter((s): s is { id: string; name: string } => !!s),
      applied: appliedIds.has(r.id),
    }
  })
}

/** The Expert's own opt-in; there is no cold outreach from the platform. */
export async function applyToNeed(jobId: string, candidateId: string, userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('job_applications')
    .insert({ job_id: jobId, candidate_id: candidateId, user_id: userId })
    .select('id')
    .single()
  if (error) {
    if (error.code === '23505') return
    throw error
  }
  // Automation: emails the business a new applicant. Best-effort ,  a failed
  // send never blocks the application, which is already recorded.
  supabase.functions.invoke('notify-application', { body: { application_id: data.id } }).catch(() => {})
}

/** Duplicates a posting's details into a fresh, open one. */
export async function repostPosting(jobId: string, employerId: string, companyName: string): Promise<string> {
  const posting = await fetchPosting(jobId)
  if (!posting) throw new Error('Posting not found')
  const { data: subs } = await supabase.from('job_subcategories').select('subcategory_id').eq('job_id', jobId)

  return createPosting(employerId, companyName, {
    title: posting.title,
    description: posting.description ?? '',
    country: posting.country ?? 'SG',
    project_type: posting.project_type ?? 'project',
    project_duration: posting.project_duration,
    budget_min: posting.budget_min,
    budget_max: posting.budget_max,
    budget_currency: posting.budget_currency ?? 'USD',
    people_required: posting.people_required,
    skill_requirements: posting.skill_requirements,
    main_category_id: posting.main_category_id ?? '',
    subcategory_ids: (subs ?? []).map((s) => s.subcategory_id as string),
  })
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
  rating_count: number
  avg_stars: number | null
  business_name: string | null
  application_id: string | null
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
  const n = Number(data ?? 0)
  if (n > 0) {
    // Automation: emails every newly released expert, alongside the in-app notice.
    supabase.functions
      .invoke('notify-interest', { body: { job_id: jobId, candidate_ids: candidateIds } })
      .then(({ data, error }) => {
        if (error) console.warn('notify-interest failed', error)
        else if ((data as { delivered?: number } | null)?.delivered === 0) console.warn('notify-interest: no email delivered', data)
      })
      .catch((err) => console.warn('notify-interest failed', err))
  }
  return n
}

/**
 * "I'm interested" on an applicant: draws the fixed shortlist if it hasn't been
 * drawn yet, then releases contact to that expert. The expert is notified (in
 * app + email) and has 2 days to pay to unlock -- nothing is ever "hired" here.
 */
export async function expressInterest(jobId: string, candidateId: string): Promise<'released' | 'already'> {
  await generateMatches(jobId)
  const matches = await fetchMatches(jobId)
  if (!matches.some((m) => m.candidate_id === candidateId)) {
    throw new Error(
      tr('err.not_on_shortlist'),
    )
  }
  const n = await releaseContact(jobId, [candidateId])
  return n > 0 ? 'released' : 'already'
}

export async function markNoFurtherMatches(jobId: string): Promise<void> {
  const { error } = await supabase.rpc('mark_no_further_matches', { p_job_id: jobId })
  if (error) throw error
}

export async function closePosting(jobId: string): Promise<number> {
  const { data, error } = await supabase.rpc('close_posting', { p_job_id: jobId })
  if (error) throw error
  // Automation: emails every applicant who wasn't hired that the posting closed.
  supabase.functions.invoke('notify-job-closed', { body: { job_id: jobId } }).catch(() => {})
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
  candidate_rating_count: number
  candidate_avg_stars: number | null
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
    slug: string
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

const LEAD_JOB = 'job:jobs(id,slug,title,category,country,project_type,project_duration,budget_min,budget_max,budget_currency,description)'

export async function fetchMyLeads(candidateId: string): Promise<LeadRow[]> {
  const { data, error } = await supabase
    .from('contact_release_details')
    .select(`*, ${LEAD_JOB}`)
    .eq('candidate_id', candidateId)
    .order('released_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as LeadRow[]
}

/** Leads still inside their 2-day unlock window ,  what the "warm leads" badge counts. */
export async function fetchWarmLeadCount(candidateId: string): Promise<number> {
  const { count, error } = await supabase
    .from('contact_release_details')
    .select('id', { count: 'exact', head: true })
    .eq('candidate_id', candidateId)
    .eq('window_open', true)
  if (error) throw error
  return count ?? 0
}

/** Live warm-lead count for the signed-in expert; refreshes every minute and on focus. */
export function useWarmLeadCount(candidateId: string | null | undefined): number {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!candidateId) {
      setCount(0)
      return
    }
    let alive = true
    const load = () =>
      fetchWarmLeadCount(candidateId)
        .then((n) => alive && setCount(n))
        .catch((err) => console.error('warm lead count', err))
    void load()
    const t = setInterval(load, 60_000)
    window.addEventListener('focus', load)
    return () => {
      alive = false
      clearInterval(t)
      window.removeEventListener('focus', load)
    }
  }, [candidateId])
  return count
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
  employer_rating_count: number
  employer_avg_stars: number | null
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
    let message = tr('err.checkout')
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
  if (!url) throw new Error(tr('err.no_checkout_url'))
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
  /** Null once the file has been auto-purged (see partly-sweep); the decision below still stands. */
  doc_path: string | null
  status: 'pending' | 'approved' | 'rejected'
  notes: string | null
  reviewed_at: string | null
  purged_at: string | null
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

/**
 * The FREE basic identity check: last 4 characters of the local ID. Self-serve
 * ,  this sets identity_verified immediately, so a free account can apply
 * right away. The digits are encrypted server-side and never come back down.
 */
export async function saveIdentityDigits(countryCode: string, last4: string, signupUserId?: string): Promise<void> {
  // signupUserId: only at registration with email confirmation on, when there
  // is no session yet (the function accepts it for a fresh unconfirmed account).
  const { data, error } = await supabase.functions.invoke('expert-identity', {
    body: { country_code: countryCode, last4, ...(signupUserId ? { user_id: signupUserId } : {}) },
  })
  if (error) {
    const ctx = (error as { context?: Response }).context
    if (ctx && typeof ctx.json === 'function') {
      const parsed = (await ctx.json().catch(() => null)) as { error?: string } | null
      if (parsed?.error) throw new Error(parsed.error)
    }
    throw new Error(error.message || tr('err.save_id'))
  }
  if (!(data as { ok?: boolean } | null)?.ok) throw new Error(tr('err.save_id'))
}

export type BadgeStatus = 'pending' | 'awaiting_review' | 'active' | 'superseded' | 'expired' | 'cancelled'

export type BadgeRow = {
  id: string
  status: BadgeStatus
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

/**
 * What an Expert must fill in before applying to anything. Returns the missing
 * items ([] when the profile is complete) ,  mirrored by a database trigger.
 */
export function missingApplyProfile(c: {
  years_experience?: string | null
  past_experience?: string | null
  expertise_field?: string[] | null
}): string[] {
  const missing: string[] = []
  const years = (c.years_experience ?? '').trim()
  if (!years || years === 'Select...') missing.push(tr('prof.years'))
  if (!(c.past_experience ?? '').trim()) missing.push(tr('prof.summary'))
  if ((c.expertise_field ?? []).length === 0) missing.push(tr('prof.categories'))
  return missing
}

/** A Verified badge can only be renewed in the last 30 days of its term (mirrors the checkout function). */
export const RENEWAL_WINDOW_DAYS = 30

/** The date renewing opens for a badge that runs until `until`, or null once it is already open. */
export function renewalOpensOn(until: string | null | undefined, now = new Date()): Date | null {
  if (!until) return null
  const opens = new Date(new Date(until).getTime() - RENEWAL_WINDOW_DAYS * 24 * 60 * 60 * 1000)
  return opens > now ? opens : null
}

/** Any identity document uploaded for this expert ,  the badge requires one, but not approval. */
export async function hasUploadedIdentityDoc(candidateId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('verification_documents')
    .select('id')
    .eq('owner_kind', 'candidate')
    .eq('owner_id', candidateId)
    .eq('doc_type', 'identity')
    .limit(1)
  if (error) throw error
  return (data ?? []).length > 0
}

/* ---------- Business Verified badge ---------- */

/** Any registration document uploaded for this business ,  the badge requires one, but not approval. */
export async function hasUploadedRegistrationDoc(employerId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('verification_documents')
    .select('id')
    .eq('owner_kind', 'employer')
    .eq('owner_id', employerId)
    .eq('doc_type', 'business_registration')
    .limit(1)
  if (error) throw error
  return (data ?? []).length > 0
}

export async function fetchMyEmployerBadges(employerId: string): Promise<BadgeRow[]> {
  const { data, error } = await supabase
    .from('employer_verified_badges')
    .select('id,status,country_code,currency,amount_local,amount_usd,purchased_at,starts_at,expires_at,renewed_from')
    .eq('employer_id', employerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as BadgeRow[]
}

export function startEmployerBadgeCheckout(pay: PayCurrency): Promise<never> {
  return invokeCheckout({ kind: 'employer_verified_badge', pay })
}

/* ---------- Reports ---------- */

export type ReportTargetKind = 'job' | 'employer' | 'candidate' | 'rating'

export async function fileReport(args: {
  targetKind: ReportTargetKind
  targetId: string
  reason: string
  details?: string
  reporterEmail?: string
}): Promise<void> {
  const { data: session } = await supabase.auth.getUser()
  const { error } = await supabase.from('reports').insert({
    reporter_user_id: session.user?.id ?? null,
    reporter_email: args.reporterEmail ?? session.user?.email ?? null,
    target_kind: args.targetKind,
    target_id: args.targetId,
    reason: args.reason,
    details: args.details ?? null,
  })
  if (error) throw error
}

/* ---------- Issue reports (product feedback) ---------- */

export const ISSUE_CATEGORIES = [
  { value: 'bug', get label() { return tr('issue.bug') } },
  { value: 'payment', get label() { return tr('issue.payment') } },
  { value: 'account', get label() { return tr('issue.account') } },
  { value: 'suggestion', get label() { return tr('issue.suggestion') } },
  { value: 'other', get label() { return tr('issue.other') } },
] as const

export type IssueCategory = (typeof ISSUE_CATEGORIES)[number]['value']

/** Files a product issue as the signed-in user; staff see it in the backoffice. */
export async function fileIssueReport(args: { category: IssueCategory; message: string }): Promise<void> {
  const message = args.message.trim()
  if (message.length < 5) throw new Error(tr('err.issue_short'))
  const { data } = await supabase.auth.getUser()
  const user = data.user
  if (!user) throw new Error(tr('err.issue_signin'))

  const [{ data: cand }, { data: emp }] = await Promise.all([
    supabase.from('candidates').select('id').eq('user_id', user.id).maybeSingle(),
    supabase.from('employers').select('id').eq('user_id', user.id).maybeSingle(),
  ])

  const { error } = await supabase.from('issue_reports').insert({
    user_id: user.id,
    user_email: user.email ?? null,
    user_role: emp ? 'business' : cand ? 'expert' : null,
    category: args.category,
    message,
    page_url: window.location.href,
    user_agent: navigator.userAgent,
  })
  if (error) throw error
}

/* ---------- Ratings ---------- */

export type RatingKind = 'candidate' | 'employer'

export type Rating = {
  id: string
  release_id: string
  rater_kind: RatingKind
  rater_user_id: string
  ratee_kind: RatingKind
  ratee_id: string
  stars: number
  comment: string | null
  created_at: string
  updated_at: string
}

/** Submits or updates the caller's own rating for a release they were part of (must be 'paid'). */
export async function submitRating(releaseId: string, stars: number, comment: string): Promise<void> {
  const { error } = await supabase.rpc('submit_rating', {
    p_release_id: releaseId,
    p_stars: stars,
    p_comment: comment.trim() || null,
  })
  if (error) throw error
}

/** The caller's own rating for a release, if they've already rated it (so the widget can prefill/edit). */
export async function fetchMyRating(releaseId: string, raterKind: RatingKind): Promise<Rating | null> {
  const { data, error } = await supabase
    .from('ratings')
    .select('*')
    .eq('release_id', releaseId)
    .eq('rater_kind', raterKind)
    .maybeSingle()
  if (error) throw error
  return (data as Rating | null) ?? null
}

export type RatingWithAuthor = Rating & { rater_name: string | null }

/** Public ratings for a candidate or employer, newest first, with the rater's display name. */
export async function fetchRatingsFor(ratee: RatingKind, rateeId: string): Promise<RatingWithAuthor[]> {
  const { data, error } = await supabase
    .from('ratings')
    .select('*')
    .eq('ratee_kind', ratee)
    .eq('ratee_id', rateeId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  const rows = (data ?? []) as Rating[]
  if (rows.length === 0) return []

  const raterKind = ratee === 'candidate' ? 'employer' : 'candidate'
  const userIds = [...new Set(rows.map((r) => r.rater_user_id))]
  const { data: names } = await supabase
    .from(raterKind === 'employer' ? 'employers' : 'candidates')
    .select(raterKind === 'employer' ? 'user_id, company_name' : 'user_id, full_name')
    .in('user_id', userIds)
  const nameByUser = new Map(
    ((names ?? []) as Record<string, string>[]).map((n) => [
      n.user_id,
      (raterKind === 'employer' ? n.company_name : n.full_name) ?? null,
    ]),
  )

  return rows.map((r) => ({ ...r, rater_name: nameByUser.get(r.rater_user_id) ?? null }))
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
  const { session, loading: sessionLoading } = useSession()
  const [rows, setRows] = useState<NotificationRow[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (sessionLoading) return
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
  }, [session, sessionLoading])

  useEffect(() => {
    void reload()
    if (!session) return
    if (apiViaProxy) {
      // The site-origin proxy can't carry WebSockets, so poll instead of
      // subscribing to realtime.
      const timer = setInterval(() => void reload(), 30_000)
      const onFocus = () => void reload()
      window.addEventListener('focus', onFocus)
      return () => {
        clearInterval(timer)
        window.removeEventListener('focus', onFocus)
      }
    }
    // Topic must be unique per hook instance: supabase-js returns the existing
    // channel for a repeated topic, and calling .on() on an already-subscribed
    // channel throws. The layout badge and the notifications page both mount
    // this hook at once (and StrictMode double-mounts it in dev).
    const topic = `notifications:${session.user.id}:${Math.random().toString(36).slice(2, 10)}`
    const channel = supabase
      .channel(topic)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` },
        () => void reload(),
      )
      .subscribe()
    return () => {
      void channel.unsubscribe().then(() => supabase.removeChannel(channel))
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
  salary_label?: string | null
  project_type?: ProjectType | null
}): string {
  const cur = p.budget_currency ?? 'USD'
  const fmt = (n: number) => n.toLocaleString('en-US')
  // An hourly need's budget is a rate, not a total.
  const per = p.project_type === 'hourly' ? tr('budget.per_hour') : ''
  if (p.budget_min != null && p.budget_max != null) return `${cur} ${fmt(p.budget_min)} – ${fmt(p.budget_max)}${per}`
  if (p.budget_min != null) return tr('budget.from', { amount: `${cur} ${fmt(p.budget_min)}${per}` })
  if (p.budget_max != null) return tr('budget.up_to', { amount: `${cur} ${fmt(p.budget_max)}${per}` })
  if (p.salary_label) return p.salary_label
  return tr('budget.on_request')
}

export function projectTypeLabel(t: ProjectType | null | undefined, legacyJobType?: string | null): string {
  return PROJECT_TYPES.find((p) => p.value === t)?.label ?? legacyJobType ?? ', '
}

/** True once a need's expiry date has passed (no expiry = still live). */
export function isExpired(expiresAt: string | null | undefined): boolean {
  return !!expiresAt && new Date(expiresAt).getTime() <= Date.now()
}

/** Country name for a posting: the new ISO code, else the legacy free-text location. */
export function postingCountry(p: { country: string | null; location?: string | null }): string {
  if (p.country) return countryName(p.country)
  return p.location ?? ', '
}

const COUNTRY_CODES = ['SG', 'MY', 'ID', 'TH', 'VN', 'US', 'GB', 'AU', 'HK', 'PH', 'IN', 'JP', 'KR', 'CN', 'DE', 'FR', 'NL', 'AE'] as const

/** English names. Some columns store the country by name, so those keep using these and translate only the label. */
export const COUNTRY_NAMES_EN: Record<string, string> = {
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

/** Region name in the active language (falls back to the code if the browser has no data). */
function regionName(code: string): string {
  try {
    return new Intl.DisplayNames([currentLocale()], { type: 'region' }).of(code) ?? code
  } catch {
    return code
  }
}

// Getters, so names follow the language switcher; Object.values() reads them fresh each render.
export const COUNTRY_NAMES: Record<string, string> = Object.defineProperties(
  {} as Record<string, string>,
  {
    ...Object.fromEntries(COUNTRY_CODES.map((c) => [c, { enumerable: true, get: () => regionName(c) }])),
    OTHER: { enumerable: true, get: () => tr('country.other') },
  },
)

export function countryName(code: string | null | undefined): string {
  if (!code) return ', '
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
  if (!until) return { label: ', ', expired: true, secondsLeft: 0 }
  const secondsLeft = Math.max(0, Math.floor((new Date(until).getTime() - now) / 1000))
  const d = Math.floor(secondsLeft / 86400)
  const h = Math.floor((secondsLeft % 86400) / 3600)
  const m = Math.floor((secondsLeft % 3600) / 60)
  const s = secondsLeft % 60
  const label =
    d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`
  return { label, expired: secondsLeft === 0, secondsLeft }
}

/** Business registration number formats, per the spec's per-country validation. */
export const BUSINESS_REG_FORMATS: Record<string, { label: string; placeholder: string; pattern: RegExp; hint: string }> = {
  SG: { label: 'UEN', placeholder: '202412345K', pattern: /^[0-9]{8,9}[A-Z]$|^[TSR][0-9]{2}[A-Z]{2}[0-9]{4}[A-Z]$/i, get hint() { return tr('reg.sg.hint') } },
  MY: { get label() { return tr('reg.my.label') }, placeholder: '202301012345 (1234567-X)', pattern: /^[0-9]{12}$|^[0-9]{6,7}-[A-Z]$/i, get hint() { return tr('reg.my.hint') } },
  ID: { label: 'NIB', placeholder: '1234567890123', pattern: /^[0-9]{13}$/, get hint() { return tr('reg.id.hint') } },
  TH: { get label() { return tr('reg.th.label') }, placeholder: '0105561012345', pattern: /^[0-9]{13}$/, get hint() { return tr('reg.th.hint') } },
  VN: { get label() { return tr('reg.vn.label') }, placeholder: '0312345678', pattern: /^[0-9]{10}(-[0-9]{3})?$/, get hint() { return tr('reg.vn.hint') } },
  PH: { get label() { return tr('reg.ph.label') }, placeholder: 'CS201912345', pattern: /^[A-Z0-9][A-Z0-9-]{5,15}$/i, get hint() { return tr('reg.ph.hint') } },
}

export function validateBusinessRegNo(country: string, value: string): string | null {
  const f = BUSINESS_REG_FORMATS[country]
  const v = value.trim()
  if (!v) return tr('val.reg_no')
  if (f && !f.pattern.test(v)) return tr('val.reg_no_format', { label: f.label, hint: f.hint })
  if (!f && v.length < 4) return tr('val.reg_no_full')
  return null
}

// Consumer mailbox providers. A business must sign up with an address on its
// own domain, so these are refused. Keep in sync with public.is_free_email_domain()
// (supabase/migrations/20260928120000_business_profile_required.sql).
const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'icloud.com', 'me.com', 'mac.com', 'msn.com', 'live.com',
  'aol.com', 'proton.me', 'protonmail.com', 'pm.me', 'mail.com', 'zohomail.com', 'yandex.com',
  'yandex.ru', 'mail.ru', 'qq.com', '163.com', '126.com', 'sina.com', 'naver.com', 'daum.net',
  'hanmail.net', 'inbox.com', 'tutanota.com', 'tuta.io', 'rediffmail.com', 'ymail.com',
  'rocketmail.com', 'gmx.com', 'gmx.net', 'gmx.de',
])
// Providers that run under many country domains (yahoo.com.sg, hotmail.co.th, ...).
const FREE_EMAIL_LABELS = new Set(['yahoo', 'hotmail', 'outlook', 'live', 'gmx'])

export function isFreeEmailDomain(email: string): boolean {
  const domain = email.trim().toLowerCase().split('@')[1] ?? ''
  return FREE_EMAIL_DOMAINS.has(domain) || FREE_EMAIL_LABELS.has(domain.split('.')[0])
}

// Dot-atom local part, dot-separated domain labels, and a 2+ letter TLD (so "a@b.c" and "a@b" fail).
const EMAIL_SHAPE =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/

/** Format check for any email (experts may use Gmail, Yahoo, etc.). Businesses use validateBusinessEmail. */
export function validateEmail(email: string): string | null {
  const v = email.trim()
  if (!v) return tr('val.email')
  const local = v.split('@')[0]
  if (
    v.length > 254 ||
    local.length > 64 ||
    v.includes('..') ||
    local.startsWith('.') ||
    local.endsWith('.') ||
    !EMAIL_SHAPE.test(v)
  ) {
    return tr('val.email_valid')
  }
  return null
}

export function validateBusinessEmail(email: string): string | null {
  const v = email.trim()
  const formatErr = validateEmail(v)
  if (formatErr) return formatErr
  if (isFreeEmailDomain(v)) {
    return tr('val.email_business')
  }
  return null
}

/** Digits with an optional leading + and common separators; 8–15 digits (E.164 max). */
export function validatePhone(value: string): string | null {
  const v = value.trim()
  if (!v) return tr('val.phone')
  const digits = v.replace(/\D/g, '')
  const shapeOk = /^\+?[0-9(][0-9\s().-]*$/.test(v) && !/[\s.-]{2,}/.test(v) && !/[\s.-]$/.test(v)
  if (!shapeOk || digits.length < 8 || digits.length > 15) {
    return tr('val.phone_valid')
  }
  return null
}

/** Business profile free text (rich-text safe) must carry real content, not just tags or a stray letter. */
export const MIN_BUSINESS_TEXT = 20
export function plainTextLength(html: string): number {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim().length
}

/**
 * Masks a business name for the public job detail page: contact only ever
 * exchanges after a paid unlock, so the real name and every contact method
 * stay hidden until then. "Acme Consulting Pte Ltd" -> "A••• C•••••••• P•• L••".
 */
export function maskCompanyName(name: string | null | undefined): string {
  if (!name) return tr('lbl.verified_business')
  return name
    .split(' ')
    .map((word) => (word.length <= 1 ? word : word[0] + '•'.repeat(Math.min(word.length - 1, 8))))
    .join(' ')
}
