import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppShell } from '@/layouts/AppShell'
import { Breadcrumb } from '@/components/app/Breadcrumb'
import { InfoCard, OverviewGrid } from '@/components/app/InfoCard'
import { JobCard } from '@/components/jobs/JobCard'
import { CompanyLogo } from '@/components/jobs/CompanyLogo'
import { SaveJobButton } from '@/components/jobs/SaveJobButton'
import { RichTextContent } from '@/components/editor/RichTextContent'
import { errMessage } from '@/lib/errors'
import {
  fetchJobBySlug,
  fetchNewestJob,
  fetchRelatedJobs,
  jobSalaryText,
  toCardJob,
  type JobRow,
} from '@/lib/jobs'
import {
  ArrowRightIcon,
  BriefcaseIcon,
  CalendarIcon,
  ClockIcon,
  DollarIcon,
  LinkIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
} from '@/components/icons'

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Company fields, preferring the live employer profile over the job snapshot. */
function companyInfo(job: JobRow) {
  const e = job.employer
  return {
    name: e?.company_name || job.company_name,
    logoUrl: e?.logo_url || job.company_logo_url,
    about: e?.about || job.company_about,
    website: e?.website || job.company_website,
    phone: e?.phone || job.company_phone,
    email: e?.business_email || job.company_email,
    industry: e?.industry || job.company_industry,
    size: e?.size || job.company_size,
    location: e?.location || job.location,
    founded: e?.founded || job.company_founded,
  }
}

function LogoBadge({ job, size }: { job: JobRow; size: number }) {
  const logoUrl = job.employer?.logo_url || job.company_logo_url
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={job.company_name}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <CompanyLogo
      bg={job.logo_bg ?? 'linear-gradient(135deg,#7c3aed,#fa8f21,#d82d7e)'}
      lightLogo={job.light_logo}
      size={size}
      rounded="rounded-full"
    />
  )
}

function RichTextSection({
  title,
  text,
}: {
  title: string
  text: string | null
}) {
  if (!text || !text.trim()) return null
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-medium text-ink">{title}</h2>
      <RichTextContent html={text} />
    </section>
  )
}

function ApplyButton({ job }: { job: JobRow }) {
  // Applications are on-platform only.
  return (
    <Link
      to={`/apply-job?job=${job.slug}`}
      className="flex items-center gap-3 rounded-[4px] bg-brand px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-brand-600"
    >
      Apply Now <ArrowRightIcon className="size-5" />
    </Link>
  )
}

export function JobDetailPage() {
  const { slug } = useParams()
  const [job, setJob] = useState<JobRow | null>(null)
  const [related, setRelated] = useState<JobRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    ;(slug ? fetchJobBySlug(slug) : fetchNewestJob())
      .then(async (row) => {
        if (!alive) return
        setJob(row)
        if (row) setRelated(await fetchRelatedJobs(row.category, row.slug))
      })
      .catch((err) => alive && setError(errMessage(err)))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [slug])

  if (loading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-[1320px] px-6 py-20 text-sm text-muted lg:px-10">
          Loading...
        </div>
      </AppShell>
    )
  }

  if (error || !job) {
    return (
      <AppShell>
        <div className="mx-auto flex max-w-[1320px] flex-col items-start gap-4 px-6 py-20 lg:px-10">
          <p className="text-lg font-medium text-ink">
            {error ? 'Could not load this job.' : 'Job not found.'}
          </p>
          <Link to="/find-job" className="text-sm font-semibold text-brand">
            Browse all jobs
          </Link>
        </div>
      </AppShell>
    )
  }

  const overview = [
    { Icon: CalendarIcon, label: 'Job Posted', value: formatDate(job.posted_at) },
    { Icon: ClockIcon, label: 'Job Expires', value: formatDate(job.expires_at) },
    { Icon: DollarIcon, label: 'Rate', value: jobSalaryText(job) },
    { Icon: MapPinIcon, label: 'Location', value: job.location || '—' },
    { Icon: BriefcaseIcon, label: 'Job Type', value: job.job_type || '—' },
    { Icon: BriefcaseIcon, label: 'Workplace', value: job.workplace_type || '—' },
    { Icon: ClockIcon, label: 'Hours', value: job.hours || '—' },
    { Icon: CalendarIcon, label: 'Duration', value: job.duration || '—' },
  ]

  const company = companyInfo(job)

  const companyRows: [string, string][] = [
    ['Founded', company.founded || '—'],
    ['Industry', company.industry || '—'],
    ['Company size', company.size || '—'],
    ['Location', company.location || '—'],
    ['Phone', company.phone || '—'],
    ['Email', company.email || '—'],
    ['Website', company.website || '—'],
  ]

  const contactBits = [
    company.website && { Icon: LinkIcon, text: company.website },
    company.phone && { Icon: PhoneIcon, text: company.phone },
    company.email && { Icon: MailIcon, text: company.email },
  ].filter(Boolean) as { Icon: typeof LinkIcon; text: string }[]

  return (
    <AppShell>
      <Breadcrumb
        title="Job Details"
        trail={[
          { label: 'Home', to: '/' },
          { label: 'Find Job', to: '/find-job' },
          ...(job.category ? [{ label: job.category }] : []),
          { label: job.title },
        ]}
      />

      <div className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-6 px-6 py-10 lg:flex-row lg:items-start lg:justify-between lg:px-10">
          <div className="flex items-start gap-5">
            <LogoBadge job={job} size={80} />
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-medium text-ink">{job.title}</h1>
                {job.featured && (
                  <span className="rounded-full bg-danger-50 px-3 py-0.5 text-sm text-danger">
                    Featured
                  </span>
                )}
                {job.workplace_type && (
                  <span className="rounded-full bg-brand-tint px-3 py-0.5 text-sm text-brand">
                    {job.workplace_type}
                  </span>
                )}
                {job.job_type && (
                  <span className="rounded-full bg-surface-alt px-3 py-0.5 text-sm text-ink-600">
                    {job.job_type}
                  </span>
                )}
              </div>
              <p className="text-base font-medium text-ink">{job.company_name}</p>
              {contactBits.length > 0 && (
                <div className="flex flex-wrap items-center gap-6 text-sm text-muted-600">
                  {contactBits.map(({ Icon, text }) => (
                    <span key={text} className="flex items-center gap-1.5">
                      <Icon className="size-4 text-brand" />
                      {text}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-3">
              <SaveJobButton jobId={job.id} />
              <ApplyButton job={job} />
            </div>
            {job.expires_at && (
              <p className="text-sm text-muted">
                Job expires:{' '}
                <span className="font-medium text-danger">
                  {formatDate(job.expires_at)}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1320px] gap-10 px-6 py-12 lg:grid-cols-[1fr_400px] lg:px-10">
        <div className="flex flex-col gap-10">
          {job.summary && (
            <p className="rounded-lg bg-surface-alt/60 p-5 text-base leading-7 text-ink">
              {job.summary}
            </p>
          )}
          <RichTextSection title="Job Description" text={job.description} />
          <RichTextSection title="Responsibilities" text={job.responsibilities} />
          <RichTextSection title="Requirements" text={job.requirements} />
          <RichTextSection title="Benefits" text={job.benefits} />
        </div>

        <aside className="flex flex-col gap-6">
          <InfoCard title="Job Overview">
            <OverviewGrid items={overview} />
          </InfoCard>
          <InfoCard title="Company Info">
            <div className="mb-5 flex items-center gap-3">
              <LogoBadge job={job} size={56} />
              <div>
                <p className="text-lg font-medium text-ink">{company.name}</p>
                {company.industry && (
                  <p className="text-sm text-muted">{company.industry}</p>
                )}
              </div>
            </div>
            {company.about && (
              <div className="mb-5 text-sm leading-6">
                <RichTextContent html={company.about} />
              </div>
            )}
            <dl className="flex flex-col">
              {companyRows.map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between gap-4 border-b border-line py-3 text-sm last:border-0"
                >
                  <dt className="text-muted-600">{k}</dt>
                  <dd className="max-w-[55%] truncate text-right font-medium text-ink">
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          </InfoCard>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="bg-surface-alt/50">
          <div className="mx-auto w-full max-w-[1320px] px-6 py-16 lg:px-10">
            <h2 className="mb-10 text-3xl font-medium text-ink lg:text-[40px]">
              Related Jobs
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <JobCard key={r.id} job={toCardJob(r)} />
              ))}
            </div>
          </div>
        </section>
      )}
    </AppShell>
  )
}
