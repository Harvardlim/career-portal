import { supabase, isSupabaseConfigured } from './supabase'

export const registrationsEnabled = isSupabaseConfigured

export type MembershipLite = {
  plan: string
  period: string | null
  amount_usd: number
  status: string
  started_at: string
  expires_at: string | null
}

export type Candidate = {
  id: string
  user_id: string | null
  full_name: string
  email: string
  contact_number: string
  expertise_field: string[]
  years_experience: string | null
  past_experience: string | null
  resume_path: string | null
  avatar_path: string | null
  interests: string[]
  referral_opt_in: boolean
  created_at: string
  memberships: MembershipLite[]
}

/** The candidate's current paid membership, if any. */
export function activeMembership(c: Candidate): MembershipLite | null {
  return (
    c.memberships.find((m) => m.status === 'active') ??
    c.memberships.find((m) => m.status === 'pending') ??
    null
  )
}

/** "Paid" / "Pending" / … — friendlier than the raw membership status. */
export function membershipStatusLabel(status: string): string {
  if (status === 'active') return 'Paid'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export type Employer = {
  id: string
  user_id: string | null
  company_name: string
  reg_no: string
  field: string[]
  business_email: string
  business_details: string
  looking_for: string[]
  logo_url: string | null
  referral_opt_in: boolean
  created_at: string
}

const client = () => {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

const CANDIDATE_COLS =
  'id, user_id, full_name, email, contact_number, expertise_field, years_experience, past_experience, resume_path, avatar_path, interests, referral_opt_in, created_at, memberships ( plan, period, amount_usd, status, started_at, expires_at )'

const EMPLOYER_COLS =
  'id, user_id, company_name, reg_no, field, business_email, business_details, looking_for, logo_url, referral_opt_in, created_at'

const normCandidate = (c: Candidate): Candidate => ({ ...c, memberships: c.memberships ?? [] })

export async function fetchCandidates(): Promise<Candidate[]> {
  const { data, error } = await client()
    .from('candidates')
    .select(CANDIDATE_COLS)
    .order('created_at', { ascending: false })
  if (error) throw error
  return ((data ?? []) as unknown as Candidate[]).map(normCandidate)
}

export async function fetchCandidate(id: string): Promise<Candidate | null> {
  const { data, error } = await client()
    .from('candidates')
    .select(CANDIDATE_COLS)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data ? normCandidate(data as unknown as Candidate) : null
}

export async function fetchEmployers(): Promise<Employer[]> {
  const { data, error } = await client()
    .from('employers')
    .select(EMPLOYER_COLS)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Employer[]
}

export async function fetchEmployer(id: string): Promise<Employer | null> {
  const { data, error } = await client()
    .from('employers')
    .select(EMPLOYER_COLS)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data as Employer | null) ?? null
}

/** Delete a candidate row and, if present, its uploaded resume file. Removing
 *  the file is best-effort so a missing/already-deleted object doesn't fail the
 *  whole operation. */
export async function deleteCandidate(id: string, resumePath?: string): Promise<void> {
  const sb = client()
  const { error } = await sb.from('candidates').delete().eq('id', id)
  if (error) throw error
  if (resumePath) {
    await sb.storage.from('resumes').remove([resumePath])
  }
}

export async function deleteEmployer(id: string): Promise<void> {
  const { error } = await client().from('employers').delete().eq('id', id)
  if (error) throw error
}

export type ReferredBy = {
  affiliate_name: string | null
  affiliate_code: string
  referred_at: string
  commission_status: string
  /** true when it came from an emailed invitation rather than a shared link. */
  via_invite: boolean
}

/**
 * Which affiliate referred this registered user, if any. Matches on the auth
 * user_id first (link or claimed invite), then falls back to a still-open
 * invitation addressed to their email.
 */
export async function fetchReferredBy(
  userId: string | null,
  email?: string | null,
): Promise<ReferredBy | null> {
  const sb = client()
  const sel =
    'referred_at, commission_status, referred_user_id, invited_email, affiliate:affiliates ( referral_code, user_id )'

  let data: unknown = null
  if (userId) {
    const r = await sb.from('affiliate_referrals').select(sel).eq('referred_user_id', userId).maybeSingle()
    if (r.error) throw r.error
    data = r.data
  }
  if (!data && email) {
    const r = await sb.from('affiliate_referrals').select(sel).ilike('invited_email', email).maybeSingle()
    if (r.error) throw r.error
    data = r.data
  }
  if (!data) return null

  const row = data as {
    referred_at: string
    commission_status: string
    referred_user_id: string | null
    affiliate: { referral_code: string; user_id: string } | null
  }
  const aff = row.affiliate
  let name: string | null = null
  if (aff?.user_id) {
    const [c, e] = await Promise.all([
      sb.from('candidates').select('full_name').eq('user_id', aff.user_id).maybeSingle(),
      sb.from('employers').select('company_name').eq('user_id', aff.user_id).maybeSingle(),
    ])
    name =
      (c.data as { full_name?: string } | null)?.full_name ??
      (e.data as { company_name?: string } | null)?.company_name ??
      null
  }
  return {
    affiliate_name: name,
    affiliate_code: aff?.referral_code ?? '—',
    referred_at: row.referred_at,
    commission_status: row.commission_status,
    via_invite: !row.referred_user_id,
  }
}

export type CandidateResume = {
  id: string
  storage_path: string
  file_name: string
  size_bytes: number | null
  created_at: string
}

/** CVs a candidate uploaded from their dashboard (separate from the single
 *  resume_path captured at registration). */
export async function fetchCandidateResumes(candidateId: string): Promise<CandidateResume[]> {
  const { data, error } = await client()
    .from('candidate_resumes')
    .select('id, storage_path, file_name, size_bytes, created_at')
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as CandidateResume[]
}

export type ResumeLinks = { view: string; download: string; name: string }

/** Signed links for a resume in the private "resumes" bucket. `view` opens
 *  inline in the browser; `download` forces a file download. Valid for 1 hour. */
export async function getResumeLinks(path: string): Promise<ResumeLinks> {
  const bucket = client().storage.from('resumes')
  const [view, download] = await Promise.all([
    bucket.createSignedUrl(path, 60 * 60),
    bucket.createSignedUrl(path, 60 * 60, { download: true }),
  ])
  if (view.error) throw view.error
  if (download.error) throw download.error
  return {
    view: view.data.signedUrl,
    download: download.data.signedUrl,
    name: path.split('/').pop() || 'resume',
  }
}
