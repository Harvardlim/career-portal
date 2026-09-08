import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useSession } from './useSession'
import { fetchMyCandidate, type CandidateProfileRow } from './candidateProfile'

/** A row from public.jobs, as joined onto applications / saved jobs / alerts. */
export type JobRow = {
  id: string
  slug: string
  title: string
  company_name: string
  logo_bg: string | null
  light_logo: boolean
  location: string | null
  job_type: string | null
  salary_label: string | null
  status: string
  expires_at: string | null
}

const JOB_COLUMNS =
  'id,slug,title,company_name,logo_bg,light_logo,location,job_type,salary_label,status,expires_at'

export type AppliedJobRecord = {
  id: string
  status: string
  applied_at: string
  job: JobRow | null
}

export type SavedJobRecord = {
  id: string
  created_at: string
  job: JobRow | null
}

export type MembershipRecord = {
  id: string
  plan: string
  period: string | null
  status: string
  amount_usd: number
  started_at: string
  expires_at: string | null
  created_at?: string
}

/**
 * Loads the signed-in user's candidate profile row (via candidateProfile.ts,
 * the same source the Settings tabs use) plus the auth user id, so the
 * dashboard activity pages can scope their queries.
 */
export function useCandidate() {
  const { session, loading: sessionLoading } = useSession()
  const [candidate, setCandidate] = useState<CandidateProfileRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!session) {
      setCandidate(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      setCandidate(await fetchMyCandidate(session.user.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    if (!sessionLoading) void reload()
  }, [sessionLoading, reload])

  return { candidate, loading: loading || sessionLoading, error, reload, session }
}

export async function fetchAppliedJobs(candidateId: string): Promise<AppliedJobRecord[]> {
  const { data, error } = await supabase
    .from('job_applications')
    .select(`id,status,applied_at,job:jobs(${JOB_COLUMNS})`)
    .eq('candidate_id', candidateId)
    .order('applied_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as AppliedJobRecord[]
}

export async function fetchSavedJobs(candidateId: string): Promise<SavedJobRecord[]> {
  const { data, error } = await supabase
    .from('saved_jobs')
    .select(`id,created_at,job:jobs(${JOB_COLUMNS})`)
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as SavedJobRecord[]
}

export type PriorityJobRow = JobRow & {
  category: string | null
  role: string | null
  tags: string[] | null
  /** true when the job also matches the candidate's preferred subcategory. */
  matchesSub: boolean
}

/**
 * Active, non-expired jobs in the candidate's preferred category, best matches
 * first. When a subcategory is set, jobs whose role/title/tags mention it are
 * flagged `matchesSub` and sorted to the top.
 */
export async function fetchPriorityJobs(
  category: string,
  subcategory: string | null,
): Promise<PriorityJobRow[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select(`${JOB_COLUMNS},category,role,tags`)
    .eq('status', 'active')
    .eq('category', category)
    .order('featured', { ascending: false })
    .order('posted_at', { ascending: false })
  if (error) throw error

  const now = Date.now()
  const sub = subcategory?.trim().toLowerCase() ?? ''
  const rows = ((data ?? []) as unknown as Omit<PriorityJobRow, 'matchesSub'>[])
    .filter((j) => !j.expires_at || new Date(j.expires_at).getTime() > now)
    .map((j) => {
      const hay = [j.role, j.title, ...(j.tags ?? [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return { ...j, matchesSub: sub !== '' && hay.includes(sub) }
    })
  rows.sort((a, b) => Number(b.matchesSub) - Number(a.matchesSub))
  return rows
}

export async function fetchMembership(candidateId: string): Promise<MembershipRecord | null> {
  const { data, error } = await supabase
    .from('memberships')
    .select('id,plan,period,status,amount_usd,started_at,expires_at,created_at')
    .eq('candidate_id', candidateId)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  const m = (data as MembershipRecord | null) ?? null
  // An 'active' row whose term has ended is effectively over -> Free plan.
  return m && membershipIsCurrent(m) ? m : null
}

/** True while the membership term is still running (not past its end date). */
export function membershipIsCurrent(m: MembershipRecord | null): boolean {
  if (!m) return false
  const end = membershipEndDate(m)
  return !end || end.getTime() > Date.now()
}

/** All completed membership purchases for this candidate, newest first
 *  (excludes never-completed 'pending' checkouts). */
export async function fetchMembershipHistory(
  candidateId: string,
): Promise<MembershipRecord[]> {
  const { data, error } = await supabase
    .from('memberships')
    .select('id,plan,period,status,amount_usd,started_at,expires_at,created_at')
    .eq('candidate_id', candidateId)
    .neq('status', 'pending')
    .order('started_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as MembershipRecord[]
}

/** The membership's end date: the real `expires_at` if set, else one billing
 *  period after `started_at` for older rows. */
export function membershipEndDate(m: MembershipRecord | null): Date | null {
  if (!m) return null
  if (m.expires_at) return new Date(m.expires_at)
  const end = new Date(m.started_at)
  const p = (m.period ?? '').toLowerCase()
  if (p.startsWith('year')) end.setFullYear(end.getFullYear() + 1)
  else if (p.startsWith('month')) end.setMonth(end.getMonth() + 1)
  else return null
  return end
}

export async function fetchDashboardCounts(candidateId: string) {
  const [applied, saved] = await Promise.all([
    supabase
      .from('job_applications')
      .select('id', { count: 'exact', head: true })
      .eq('candidate_id', candidateId),
    supabase
      .from('saved_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('candidate_id', candidateId),
  ])
  return {
    applied: applied.count ?? 0,
    saved: saved.count ?? 0,
  }
}

/** "4 Days Remaining" / "Job Expire" helper shared by the job rows. */
export function expiryLabel(expiresAt: string | null): { text: string; expired: boolean } {
  if (!expiresAt) return { text: 'Open', expired: false }
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return { text: 'Job Expire', expired: true }
  const days = Math.ceil(ms / 86_400_000)
  return { text: `${days} Day${days === 1 ? '' : 's'} Remaining`, expired: false }
}

export async function toggleSavedJob(
  candidateId: string,
  userId: string,
  jobId: string,
  saved: boolean,
) {
  if (saved) {
    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('candidate_id', candidateId)
      .eq('job_id', jobId)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('saved_jobs')
      .insert({ candidate_id: candidateId, user_id: userId, job_id: jobId })
    if (error) throw error
  }
}
