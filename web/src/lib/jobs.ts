import { supabase } from './supabase'
import type { Job } from '@/data/jobs'

export type JobRow = {
  id: string
  slug: string
  title: string
  company_name: string
  logo_bg: string | null
  light_logo: boolean
  company_logo_url: string | null
  location: string | null
  workplace_type: string | null
  job_type: string | null
  category: string | null
  role: string | null
  tags: string[]
  salary_min: number | null
  salary_max: number | null
  salary_type: string | null
  salary_label: string | null
  hours: string | null
  duration: string | null
  education: string | null
  experience: string | null
  job_level: string | null
  vacancies: string | null
  summary: string | null
  description: string | null
  responsibilities: string | null
  requirements: string | null
  benefits: string | null
  apply_method: string
  apply_url: string | null
  apply_email: string | null
  company_about: string | null
  company_website: string | null
  company_email: string | null
  company_phone: string | null
  company_industry: string | null
  company_size: string | null
  company_founded: string | null
  featured: boolean
  status: string
  posted_at: string
  expires_at: string | null
  /** Live company profile, joined on the detail view. */
  employer: {
    company_name: string | null
    about: string | null
    website: string | null
    phone: string | null
    business_email: string | null
    industry: string | null
    size: string | null
    location: string | null
    logo_url: string | null
    founded: string | null
    reg_no: string | null
  } | null
}

const LIST_COLS =
  'id, slug, title, company_name, logo_bg, light_logo, company_logo_url, location, workplace_type, job_type, category, role, salary_label, salary_min, salary_max, salary_type, education, experience, job_level, tags, featured, posted_at'

export async function fetchJobs(): Promise<JobRow[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select(LIST_COLS)
    .eq('status', 'active')
    .order('posted_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as JobRow[]
}

const JOB_EMPLOYER_JOIN =
  'employer:employers(company_name, about, website, phone, business_email, industry, size, location, logo_url, founded, reg_no)'

export async function fetchJobBySlug(slug: string): Promise<JobRow | null> {
  const { data, error } = await supabase
    .from('jobs')
    .select(`*, ${JOB_EMPLOYER_JOIN}`)
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  return (data as unknown as JobRow) ?? null
}

export async function fetchNewestJob(): Promise<JobRow | null> {
  const { data, error } = await supabase
    .from('jobs')
    .select(`*, ${JOB_EMPLOYER_JOIN}`)
    .eq('status', 'active')
    .order('posted_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return (data as unknown as JobRow) ?? null
}

export async function fetchRelatedJobs(
  category: string | null,
  excludeSlug: string,
  limit = 6,
): Promise<JobRow[]> {
  let q = supabase
    .from('jobs')
    .select(LIST_COLS)
    .eq('status', 'active')
    .neq('slug', excludeSlug)
    .order('posted_at', { ascending: false })
    .limit(limit)
  if (category) q = q.eq('category', category)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as JobRow[]
}

/** Same field set the backoffice job editor (JobEditForm) writes. */
export type NewJobInput = {
  title: string
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
  status: string
  featured: boolean
  expires_at: string | null
  summary: string | null
  description: string | null
  responsibilities: string | null
  requirements: string | null
  benefits: string | null
  /** Set when a job is created straight into 'active' — it has paid its credit
   *  and its 30-day window is anchored here. */
  credit_charged?: boolean
  first_published_at?: string | null
}

export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'job'
  )
}

/** "$50-$85/hourly" style label — matches the backoffice's buildSalaryLabel. */
export function buildSalaryLabel(
  min: number | null,
  max: number | null,
  type: string | null,
): string | null {
  if (min == null && max == null) return null
  const per = type ? `/${type.toLowerCase()}` : ''
  if (min != null && max != null)
    return `$${min.toLocaleString()}-$${max.toLocaleString()}${per}`
  return `$${(min ?? max)!.toLocaleString()}${per}`
}

export async function createJob(
  employerId: string,
  input: NewJobInput,
): Promise<string> {
  const slug = `${slugify(input.title)}-${Math.random().toString(36).slice(2, 7)}`
  const { error } = await supabase.from('jobs').insert({
    employer_id: employerId,
    slug,
    apply_method: 'on_platform',
    posted_at: new Date().toISOString(),
    ...input,
  })
  if (error) throw error
  return slug
}

export function jobSalaryText(j: Pick<JobRow, 'salary_label' | 'salary_min' | 'salary_max' | 'salary_type'>): string {
  if (j.salary_label) return j.salary_label
  if (j.salary_min != null && j.salary_max != null) {
    const per = j.salary_type ? `/${j.salary_type.toLowerCase()}` : ''
    return `$${j.salary_min.toLocaleString()}-$${j.salary_max.toLocaleString()}${per}`
  }
  return 'Negotiable'
}

/** Adapt a DB row to the fixture `Job` shape so <JobCard> can render it. */
export function toCardJob(j: JobRow): Job {
  return {
    id: j.slug,
    slug: j.slug,
    jobId: j.id,
    title: j.title,
    company: j.company_name,
    logoBg: j.logo_bg ?? '#2563eb',
    lightLogo: j.light_logo,
    location: j.location ?? '',
    type: j.job_type ?? j.workplace_type ?? 'Full Time',
    salary: jobSalaryText(j),
    featured: j.featured,
  }
}
