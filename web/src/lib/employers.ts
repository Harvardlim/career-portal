import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useSession } from './useSession'

export type EmployerListRow = {
  id: string
  company_name: string
  field: string[]
  business_details: string | null
  logo_url: string | null
  open_jobs: number
  location: string | null
}

export type EmployerRow = {
  id: string
  company_name: string
  reg_no: string
  field: string[]
  looking_for: string[]
  business_email: string
  business_details: string | null
  logo_url: string | null
  about: string | null
  website: string | null
  industry: string | null
  size: string | null
  location: string | null
  phone: string | null
  founded: string | null
}

const EMPLOYER_COLS =
  'id, company_name, reg_no, field, looking_for, business_email, business_details, logo_url, about, website, industry, size, location, phone, founded'

export async function fetchMyEmployer(userId: string): Promise<EmployerRow | null> {
  const { data, error } = await supabase
    .from('employers')
    .select(EMPLOYER_COLS)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return (data as EmployerRow) ?? null
}

export async function updateMyEmployer(
  employerId: string,
  patch: Partial<Omit<EmployerRow, 'id'>>,
): Promise<void> {
  // RLS ("Users can update their own employer profile") enforces ownership.
  const { error } = await supabase
    .from('employers')
    .update(patch)
    .eq('id', employerId)
  if (error) throw error
}

/** Uploads a company logo to the public `avatars` bucket, returns its URL. */
export async function uploadEmployerLogo(
  userId: string,
  file: File,
): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const path = `${userId}/logo.${ext}`
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true })
  if (error) throw error
  const url = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
  return `${url}?v=${Date.now()}`
}

/** The signed-in employer's row + auth user id, for the /employer/* pages. */
export function useEmployer() {
  const { session, loading: sessionLoading } = useSession()
  const [employer, setEmployer] = useState<EmployerRow | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!session) {
      setEmployer(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      setEmployer(await fetchMyEmployer(session.user.id))
    } catch (err) {
      console.error('load employer', err)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    if (!sessionLoading) void reload()
  }, [sessionLoading, reload])

  return {
    employer,
    session,
    loading: loading || sessionLoading,
    reload,
  }
}

/* ---------- Employer jobs + stats ---------- */

export type EmployerJobRow = {
  id: string
  slug: string
  title: string
  job_type: string | null
  status: string
  posted_at: string
  expires_at: string | null
  first_published_at: string | null
  credit_charged: boolean
  salary_label: string | null
  applications: number
}

export async function fetchEmployerJobs(
  employerId: string,
): Promise<EmployerJobRow[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select(
      'id, slug, title, job_type, status, posted_at, expires_at, first_published_at, credit_charged, salary_label, job_applications(count)',
    )
    .eq('employer_id', employerId)
    .order('posted_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((j) => ({
    id: j.id,
    slug: j.slug,
    title: j.title,
    job_type: j.job_type,
    status: j.status,
    posted_at: j.posted_at,
    expires_at: j.expires_at,
    first_published_at: j.first_published_at,
    credit_charged: !!j.credit_charged,
    salary_label: j.salary_label,
    applications:
      Array.isArray(j.job_applications) && j.job_applications[0]
        ? (j.job_applications[0].count as number)
        : 0,
  }))
}

export async function updateJobStatus(
  jobId: string,
  status: 'active' | 'expired' | 'draft',
): Promise<void> {
  const { error } = await supabase.from('jobs').update({ status }).eq('id', jobId)
  if (error) throw error
}

/* ---------- Job credits (1 credit / post, 30-day window) ---------- */

export const JOB_LIVE_DAYS = 30
const DAY_MS = 86_400_000

/** Credits the employer has left to spend (paid − used). */
export async function fetchCreditsLeft(employerId: string): Promise<number> {
  const { data, error } = await supabase
    .from('employer_credit_balances')
    .select('credits_left')
    .eq('employer_id', employerId)
    .maybeSingle()
  if (error) throw error
  return Number(data?.credits_left ?? 0)
}

/** Record that 1 credit was spent. Used by publish/extend and by Post a Job
 *  when a brand-new job is created straight into 'active'. */
export async function spendJobCredit(
  employerId: string,
  reason: string,
): Promise<void> {
  const { error } = await supabase
    .from('credit_usage')
    .insert({ employer_id: employerId, credits: 1, reason })
  if (error) throw error
}

/** Thrown when a publish/extend needs a credit the employer doesn't have. */
export class NoCreditError extends Error {
  constructor() {
    super('You need at least 1 credit. Buy credits to continue.')
    this.name = 'NoCreditError'
  }
}

/**
 * Publish a job. The first time a job is published it costs 1 credit and its
 * 30-day live window starts; toggling an already-charged job back to published
 * is free and keeps the original expiry.
 */
export async function publishJob(
  employerId: string,
  job: { id: string; title: string; credit_charged: boolean; first_published_at: string | null },
): Promise<void> {
  const firstTime = !job.credit_charged
  if (firstTime && (await fetchCreditsLeft(employerId)) < 1) {
    throw new NoCreditError()
  }

  const patch: Record<string, unknown> = { status: 'active' }
  if (firstTime) {
    const now = new Date()
    const anchor = job.first_published_at
      ? new Date(job.first_published_at)
      : now
    patch.credit_charged = true
    patch.first_published_at = anchor.toISOString()
    patch.expires_at = new Date(anchor.getTime() + JOB_LIVE_DAYS * DAY_MS).toISOString()
  }

  const { error } = await supabase.from('jobs').update(patch).eq('id', job.id)
  if (error) throw error
  if (firstTime) await spendJobCredit(employerId, `Job post: ${job.title}`)
}

/** Add another 30 days of live time to a job. Costs 1 credit. */
export async function extendJob(
  employerId: string,
  job: { id: string; title: string; expires_at: string | null },
): Promise<string> {
  if ((await fetchCreditsLeft(employerId)) < 1) throw new NoCreditError()
  const base = job.expires_at ? new Date(job.expires_at) : new Date()
  const from = base.getTime() > Date.now() ? base : new Date()
  const next = new Date(from.getTime() + JOB_LIVE_DAYS * DAY_MS).toISOString()
  const { error } = await supabase
    .from('jobs')
    .update({ expires_at: next, status: 'active' })
    .eq('id', job.id)
  if (error) throw error
  await spendJobCredit(employerId, `Job extend: ${job.title}`)
  return next
}

export async function deleteJob(jobId: string): Promise<void> {
  const { error } = await supabase.from('jobs').delete().eq('id', jobId)
  if (error) throw error
}

export async function fetchEmployerStats(employerId: string): Promise<{
  openJobs: number
  applications: number
  savedCandidates: number
}> {
  const jobIds = (
    await supabase.from('jobs').select('id').eq('employer_id', employerId)
  ).data?.map((j) => j.id as string) ?? []

  const [open, apps, saved] = await Promise.all([
    supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('employer_id', employerId)
      .eq('status', 'active'),
    jobIds.length
      ? supabase
          .from('job_applications')
          .select('id', { count: 'exact', head: true })
          .in('job_id', jobIds)
      : Promise.resolve({ count: 0 }),
    supabase
      .from('saved_candidates')
      .select('id', { count: 'exact', head: true })
      .eq('employer_id', employerId),
  ])
  return {
    openJobs: open.count ?? 0,
    applications: apps.count ?? 0,
    savedCandidates: saved.count ?? 0,
  }
}

/* ---------- HR team invitations ---------- */

/** Sends one "join our hiring team" email to a single HR address, from
 *  no-reply@partly.asia, via the `send-hr-invite` edge function. The invite +
 *  referral are recorded even if the email itself can't be delivered;
 *  `delivered` says whether the email actually went out. */
export async function sendHrInvite(
  email: string,
  message: string,
): Promise<{ delivered: boolean }> {
  const { data, error } = await supabase.functions.invoke('send-hr-invite', {
    body: { email, message },
  })
  if (error) {
    let msg = 'Could not send the invitation. Please try again.'
    const ctx = (error as { context?: Response }).context
    if (ctx && typeof ctx.json === 'function') {
      try {
        const parsed = (await ctx.json()) as { error?: string }
        if (parsed?.error) msg = parsed.error
      } catch {
        /* keep default */
      }
    } else if (error.message) {
      msg = error.message
    }
    throw new Error(msg)
  }
  const res = data as { ok?: boolean; delivered?: boolean } | null
  if (!res?.ok) {
    throw new Error('Could not send the invitation. Please try again.')
  }
  return { delivered: !!res.delivered }
}

export type HrInviteRow = {
  id: string
  email: string
  message: string | null
  sent_at: string
}

/** Every HR invitation this employer has sent, newest first. */
export async function fetchHrInvites(
  employerId: string,
): Promise<HrInviteRow[]> {
  const { data, error } = await supabase
    .from('hr_invites')
    .select('id, email, message, sent_at')
    .eq('employer_id', employerId)
    .order('sent_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as HrInviteRow[]
}

/* ---------- Applications ---------- */

export type ApplicationStatus = 'active' | 'shortlisted' | 'rejected' | 'hired'

export type ApplicationRow = {
  id: string
  status: ApplicationStatus
  applied_at: string
  cover_letter: string | null
  job: { id: string; title: string } | null
  resume: { id: string; file_name: string; storage_path: string } | null
  candidate: {
    id: string
    full_name: string
    email: string | null
    contact_number: string | null
    title: string | null
    years_experience: string | null
    education: string | null
    expertise_field: string[] | null
  } | null
}

/** Short-lived signed URL for a resume in the private `resumes` bucket. */
export async function resumeSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('resumes')
    .createSignedUrl(storagePath, 60 * 5)
  if (error) throw error
  return data.signedUrl
}

export async function fetchApplications(
  employerId: string,
): Promise<ApplicationRow[]> {
  const jobIds =
    (await supabase.from('jobs').select('id').eq('employer_id', employerId)).data?.map(
      (j) => j.id as string,
    ) ?? []
  if (jobIds.length === 0) return []
  const { data, error } = await supabase
    .from('job_applications')
    .select(
      'id, status, applied_at, cover_letter, job:jobs(id,title), resume:candidate_resumes(id,file_name,storage_path), candidate:candidates(id,full_name,email,contact_number,title,years_experience,education,expertise_field)',
    )
    .in('job_id', jobIds)
    .order('applied_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as ApplicationRow[]
}

export async function fetchApplicationById(
  id: string,
): Promise<ApplicationRow | null> {
  const { data, error } = await supabase
    .from('job_applications')
    .select(
      'id, status, applied_at, cover_letter, job:jobs(id,title), resume:candidate_resumes(id,file_name,storage_path), candidate:candidates(id,full_name,email,contact_number,title,years_experience,education,expertise_field)',
    )
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data as unknown as ApplicationRow) ?? null
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
): Promise<void> {
  const { error } = await supabase
    .from('job_applications')
    .update({ status })
    .eq('id', id)
  if (error) throw error
}

/* ---------- Saved candidates ---------- */

export type SavedCandidateRow = {
  id: string
  created_at: string
  /** Latest application this candidate made to one of the employer's jobs,
   *  so the list can link straight to the applicant detail view. */
  application_id: string | null
  candidate: {
    id: string
    full_name: string
    email: string | null
    title: string | null
    years_experience: string | null
    expertise_field: string[] | null
  } | null
}

export async function fetchSavedCandidates(
  employerId: string,
): Promise<SavedCandidateRow[]> {
  const { data, error } = await supabase
    .from('saved_candidates')
    .select(
      'id, created_at, candidate:candidates(id,full_name,email,title,years_experience,expertise_field)',
    )
    .eq('employer_id', employerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  const rows = (data ?? []) as unknown as SavedCandidateRow[]

  const candidateIds = rows
    .map((r) => r.candidate?.id)
    .filter((v): v is string => !!v)
  if (candidateIds.length === 0) {
    return rows.map((r) => ({ ...r, application_id: null }))
  }

  const jobIds =
    (await supabase.from('jobs').select('id').eq('employer_id', employerId)).data?.map(
      (j) => j.id as string,
    ) ?? []
  const latestByCandidate = new Map<string, string>()
  if (jobIds.length > 0) {
    const { data: apps } = await supabase
      .from('job_applications')
      .select('id, candidate_id, applied_at')
      .in('job_id', jobIds)
      .in('candidate_id', candidateIds)
      .order('applied_at', { ascending: false })
    for (const a of apps ?? []) {
      const cid = a.candidate_id as string
      if (!latestByCandidate.has(cid)) latestByCandidate.set(cid, a.id as string)
    }
  }
  return rows.map((r) => ({
    ...r,
    application_id: r.candidate
      ? latestByCandidate.get(r.candidate.id) ?? null
      : null,
  }))
}

export async function saveCandidate(
  employerId: string,
  userId: string,
  candidateId: string,
): Promise<void> {
  const { error } = await supabase.from('saved_candidates').insert({
    employer_id: employerId,
    user_id: userId,
    candidate_id: candidateId,
  })
  if (error && error.code !== '23505') throw error // ignore duplicate
}

export async function unsaveCandidate(
  employerId: string,
  candidateId: string,
): Promise<void> {
  const { error } = await supabase
    .from('saved_candidates')
    .delete()
    .eq('employer_id', employerId)
    .eq('candidate_id', candidateId)
  if (error) throw error
}

/* ---------- Billing ---------- */

export type CreditBalance = {
  credits_purchased: number
  credits_used: number
  credits_left: number
  total_spent_usd: number
  last_purchase_at: string | null
}

export type PurchaseRow = {
  id: string
  package: string
  amount_usd: number
  credits: number
  status: string
  created_at: string
}

export type UsageRow = {
  id: string
  credits: number
  reason: string | null
  created_at: string
}

export type EmployerMembershipStatus = {
  is_active: boolean
  started_at: string | null
  expires_at: string | null
}

/** Whether the employer holds an active paying-member term. Granted by the
 *  first credit-package purchase; while active the pricing page shows the
 *  discounted "add credits" repeat tiers instead of first-time packages. */
export async function fetchEmployerMembership(
  employerId: string,
): Promise<EmployerMembershipStatus> {
  const { data, error } = await supabase
    .from('employer_membership_status')
    .select('is_active, started_at, expires_at')
    .eq('employer_id', employerId)
    .maybeSingle()
  if (error) throw error
  return (
    (data as EmployerMembershipStatus | null) ?? {
      is_active: false,
      started_at: null,
      expires_at: null,
    }
  )
}

export async function fetchEmployerBilling(employerId: string): Promise<{
  balance: CreditBalance | null
  purchases: PurchaseRow[]
  usage: UsageRow[]
}> {
  const [balanceRes, purchasesRes, usageRes] = await Promise.all([
    supabase
      .from('employer_credit_balances')
      .select(
        'credits_purchased, credits_used, credits_left, total_spent_usd, last_purchase_at',
      )
      .eq('employer_id', employerId)
      .maybeSingle(),
    supabase
      .from('credit_purchases')
      .select('id, package, amount_usd, credits, status, created_at')
      .eq('employer_id', employerId)
      .order('created_at', { ascending: false }),
    supabase
      .from('credit_usage')
      .select('id, credits, reason, created_at')
      .eq('employer_id', employerId)
      .order('created_at', { ascending: false }),
  ])
  if (balanceRes.error) throw balanceRes.error
  if (purchasesRes.error) throw purchasesRes.error
  if (usageRes.error) throw usageRes.error
  return {
    balance: (balanceRes.data as CreditBalance) ?? null,
    purchases: (purchasesRes.data ?? []) as PurchaseRow[],
    usage: (usageRes.data ?? []) as UsageRow[],
  }
}

/**
 * Employers for the public "Find Employers" page: the employers table plus a
 * live count (and a representative location) derived from their active jobs.
 */
export async function fetchEmployers(): Promise<EmployerListRow[]> {
  const [{ data: employers, error: eErr }, { data: jobs, error: jErr }] =
    await Promise.all([
      supabase
        .from('employers')
        .select('id, company_name, field, business_details, logo_url, location')
        .order('created_at', { ascending: false }),
      supabase
        .from('jobs')
        .select('employer_id, location')
        .eq('status', 'active'),
    ])
  if (eErr) throw eErr
  if (jErr) throw jErr

  const byEmployer = new Map<string, { count: number; location: string | null }>()
  for (const j of jobs ?? []) {
    if (!j.employer_id) continue
    const cur = byEmployer.get(j.employer_id) ?? { count: 0, location: null }
    cur.count += 1
    if (!cur.location && j.location) cur.location = j.location
    byEmployer.set(j.employer_id, cur)
  }

  return (employers ?? []).map((e) => {
    const agg = byEmployer.get(e.id)
    return {
      id: e.id,
      company_name: e.company_name,
      field: Array.isArray(e.field) ? e.field : [],
      business_details: e.business_details ?? null,
      logo_url: e.logo_url ?? null,
      open_jobs: agg?.count ?? 0,
      location: e.location ?? agg?.location ?? null,
    }
  })
}

/** Deterministic brand-ish colour for an employer with no uploaded logo. */
export function logoColor(name: string): string {
  const palette = [
    '#0a65cc',
    '#ea4c89',
    '#ff4500',
    '#1da1f2',
    '#6fda44',
    '#191f33',
    '#eb5252',
    '#7c3aed',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0
  return palette[Math.abs(hash) % palette.length]
}
