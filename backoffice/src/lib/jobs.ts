import { supabase, isSupabaseConfigured } from './supabase'

export const jobsEnabled = isSupabaseConfigured

export type JobRow = {
  id: string
  slug: string | null
  title: string
  employer_id: string | null
  company_name: string | null
  category: string | null
  job_type: string | null
  workplace_type: string | null
  location: string | null
  salary_min: number | null
  salary_max: number | null
  salary_type: string | null
  salary_label: string | null
  hours: string | null
  duration: string | null
  apply_method: string | null
  apply_url: string | null
  apply_email: string | null
  status: string
  featured: boolean
  description: string | null
  responsibilities: string | null
  requirements: string | null
  created_by_admin: string | null
  posted_at: string | null
  created_at: string
  expires_at: string | null
  applications: number
}

/** slug is a placeholder until the job's first real save. */
export const isPlaceholderSlug = (slug: string | null): boolean =>
  !slug || slug.startsWith('untitled-')

export const slugify = (s: string): string =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** Canonical edit URL: id for lookup + a readable name segment. */
export const jobEditPath = (id: string, slug: string | null): string =>
  `/jobs/edit/${id}/${slug && !isPlaceholderSlug(slug) ? slug : 'new'}`

/** Fields the backoffice edit page can change. */
export type JobPatch = {
  slug?: string
  title: string
  employer_id: string | null
  company_name: string | null
  category: string | null
  job_type: string | null
  workplace_type: string | null
  location: string | null
  salary_min: number | null
  salary_max: number | null
  salary_type: string | null
  salary_label: string | null
  hours: string | null
  duration: string | null
  apply_method: string | null
  apply_url: string | null
  apply_email: string | null
  status: string
  featured: boolean
  description: string | null
  responsibilities: string | null
  requirements: string | null
  expires_at: string | null
}

const JOB_SELECT =
  'id, slug, title, employer_id, company_name, category, job_type, workplace_type, location, salary_min, salary_max, salary_type, salary_label, hours, duration, apply_method, apply_url, apply_email, status, featured, description, responsibilities, requirements, created_by_admin, posted_at, created_at, expires_at, job_applications(count)'

const client = () => {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

type RawJob = Omit<JobRow, 'applications'> & {
  job_applications: { count: number }[] | null
}

const mapJob = (j: RawJob): JobRow => ({
  id: j.id,
  slug: j.slug,
  title: j.title,
  employer_id: j.employer_id,
  company_name: j.company_name,
  category: j.category,
  job_type: j.job_type,
  workplace_type: j.workplace_type,
  location: j.location,
  salary_min: j.salary_min,
  salary_max: j.salary_max,
  salary_type: j.salary_type,
  salary_label: j.salary_label,
  hours: j.hours,
  duration: j.duration,
  apply_method: j.apply_method,
  apply_url: j.apply_url,
  apply_email: j.apply_email,
  status: j.status,
  featured: j.featured,
  description: j.description,
  responsibilities: j.responsibilities,
  requirements: j.requirements,
  created_by_admin: j.created_by_admin,
  posted_at: j.posted_at,
  created_at: j.created_at,
  expires_at: j.expires_at,
  applications: j.job_applications?.[0]?.count ?? 0,
})

export async function fetchJobs(): Promise<JobRow[]> {
  const { data, error } = await client()
    .from('jobs')
    .select(JOB_SELECT)
    .order('created_at', { ascending: false })
  if (error) throw error
  return ((data ?? []) as unknown as RawJob[]).map(mapJob)
}

export async function fetchJob(id: string): Promise<JobRow | null> {
  const { data, error } = await client().from('jobs').select(JOB_SELECT).eq('id', id).maybeSingle()
  if (error) throw error
  return data ? mapJob(data as unknown as RawJob) : null
}

export async function updateJob(id: string, patch: JobPatch): Promise<void> {
  const { error } = await client().from('jobs').update(patch).eq('id', id)
  if (error) throw error
}

/** Creates a blank draft job and returns its id, for the "Add job" flow. */
export async function createDraftJob(adminId: string | null): Promise<string> {
  const { data, error } = await client()
    .from('jobs')
    .insert({
      // title / company_name are NOT NULL — empty strings show as blank / "Select…".
      title: '',
      company_name: '',
      slug: `untitled-${Date.now().toString(36)}`,
      status: 'draft',
      apply_method: 'on_platform',
      created_by_admin: adminId,
    })
    .select('id')
    .single()
  if (error) throw error
  return (data as { id: string }).id
}

export type Applicant = {
  id: string
  status: string
  applied_at: string
  cover_letter: string | null
  candidate: { full_name: string | null; email: string | null } | null
}

export async function fetchApplicants(jobId: string): Promise<Applicant[]> {
  const { data, error } = await client()
    .from('job_applications')
    .select('id, status, applied_at, cover_letter, candidate:candidates ( full_name, email )')
    .eq('job_id', jobId)
    .order('applied_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as Applicant[]
}

export async function deleteJob(id: string): Promise<void> {
  const { error } = await client().from('jobs').delete().eq('id', id)
  if (error) throw error
}

export async function deleteJobs(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const { error } = await client().from('jobs').delete().in('id', ids)
  if (error) throw error
}

/** A job is "live" when active and not past its expiry. */
export function isJobLive(job: JobRow): boolean {
  if (job.status !== 'active') return false
  if (job.expires_at && new Date(job.expires_at).getTime() < Date.now()) return false
  return true
}
