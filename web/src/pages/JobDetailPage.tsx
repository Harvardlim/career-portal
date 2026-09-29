import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppShell } from '@/layouts/AppShell'
import { Breadcrumb } from '@/components/app/Breadcrumb'
import { InfoCard, OverviewGrid } from '@/components/app/InfoCard'
import { JobCard } from '@/components/jobs/JobCard'
import { CompanyLogo } from '@/components/jobs/CompanyLogo'
import { SaveJobButton } from '@/components/jobs/SaveJobButton'
import { RichTextContent } from '@/components/editor/RichTextContent'
import { ReportButton } from '@/components/partly/ReportButton'
import { errMessage } from '@/lib/errors'
import { isExpired, maskCompanyName } from '@/lib/partly'
import { VerifiedChips } from '@/components/partly/ui'
import {
  fetchJobBySlug,
  fetchNewestJob,
  fetchRelatedJobs,
  jobLocationText,
  jobSalaryText,
  jobTypeText,
  toCardJob,
  type JobRow,
} from '@/lib/jobs'
import {
  ArrowRightIcon,
  BriefcaseIcon,
  CalendarIcon,
  ClockIcon,
  DollarIcon,
  MapPinIcon,
} from '@/components/icons'
import { useT } from '@/lib/i18n'

function formatDate(value: string | null): string {
  if (!value) return ', '
  return new Date(value).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Company fields, masked: partly.asia only ever exchanges a business's real
 * name and contact details after a paid unlock, so this page never shows
 * them, even though the underlying job/employer rows carry them.
 */
function companyInfo(job: JobRow) {
  const e = job.employer
  return {
    name: maskCompanyName(e?.company_name || job.company_name),
    logoUrl: e?.logo_url || job.company_logo_url,
    industry: e?.industry || job.company_industry,
    location: e?.location || job.location,
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
  const t = useT()
  if (isExpired(job.expires_at)) {
    return (
      <span className="flex cursor-not-allowed items-center gap-3 rounded-[4px] bg-surface-alt px-8 py-4 text-base font-semibold text-muted">{t('ui.expired')}</span>
    )
  }
  // Applications are on-platform only.
  return (
    <Link
      to={`/apply-job?job=${job.slug}`}
      className="flex items-center gap-3 rounded-[4px] bg-brand px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-brand-600"
    >{t('ui.apply_now')}{' '}<ArrowRightIcon className="size-5" />
    </Link>
  )
}

export function JobDetailPage() {
  const t = useT()
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
        <div className="mx-auto max-w-[1320px] px-6 py-20 text-sm text-muted lg:px-10">{t('ui.loading')}</div>
      </AppShell>
    )
  }

  if (error || !job) {
    return (
      <AppShell>
        <div className="mx-auto flex max-w-[1320px] flex-col items-start gap-4 px-6 py-20 lg:px-10">
          <p className="text-lg font-medium text-ink">
            {error ? t('ui.could_not_load_this_job') : t('ui.job_not_found')}
          </p>
          <Link to="/find-job" className="text-sm font-semibold text-brand">{t('ui.browse_all_jobs')}</Link>
        </div>
      </AppShell>
    )
  }

  const expired = isExpired(job.expires_at)
  const location = jobLocationText(job)
  const jobType = jobTypeText(job)
  const duration = job.project_duration || job.duration
  const overview = [
    { Icon: CalendarIcon, label: t('ui.job_posted'), value: formatDate(job.posted_at) },
    {
      Icon: ClockIcon,
      label: expired ? t('jd.expired') : t('jd.expires'),
      value: formatDate(job.expires_at),
    },
    { Icon: DollarIcon, label: t('ui.rate_3'), value: jobSalaryText(job) },
    { Icon: MapPinIcon, label: t('ui.location'), value: location || ', ' },
    { Icon: BriefcaseIcon, label: t('ui.job_type'), value: jobType || ', ' },
    { Icon: CalendarIcon, label: t('ui.duration'), value: duration || ', ' },
    // Legacy job-board fields: only worth a row when the posting has them.
    ...(job.people_required ? [{ Icon: BriefcaseIcon, label: t('ui.experts_needed'), value: String(job.people_required) }] : []),
    ...(job.workplace_type ? [{ Icon: BriefcaseIcon, label: t('ui.workplace'), value: job.workplace_type }] : []),
    ...(job.hours ? [{ Icon: ClockIcon, label: t('ui.hours'), value: job.hours }] : []),
  ]

  const company = companyInfo(job)

  return (
    <AppShell>
      <Breadcrumb
        title={t('ui.job_details')}
        trail={[
          { label: t('ui.home'), to: '/' },
          { label: t('ui.find_job'), to: '/find-job' },
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
                  <span className="rounded-full bg-danger-50 px-3 py-0.5 text-sm text-danger">{t('ui.featured')}</span>
                )}
                {job.workplace_type && (
                  <span className="rounded-full bg-brand-tint px-3 py-0.5 text-sm text-brand">
                    {job.workplace_type}
                  </span>
                )}
                {jobType && (
                  <span className="rounded-full bg-surface-alt px-3 py-0.5 text-sm text-ink-600">
                    {jobType}
                  </span>
                )}
                {location && (
                  <span className="rounded-full bg-surface-alt px-3 py-0.5 text-sm text-ink-600">
                    {location}
                  </span>
                )}
              </div>
              <p className="text-base font-medium text-ink">
                {company.name}
                {company.industry && <span className="ml-2 font-normal text-muted">· {company.industry}</span>}
              </p>
              {job.employer && (
                <VerifiedChips
                  identity={job.employer.basic_verified}
                  badge={!!job.employer.verified_badge_until && new Date(job.employer.verified_badge_until) > new Date()}
                />
              )}
              <p className="text-xs text-muted">{t('ui.full_business_name_and_contact_details')}</p>
              {job.employer_id && (
                <ReportButton targetKind="employer" targetId={job.employer_id} label={t('ui.report_this_business')} />
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
                {expired ? t('ui.job_expired_2') : t('ui.job_expires')}{' '}
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
          <RichTextSection title={t('ui.job_description')} text={job.description} />
          {job.skill_requirements && job.skill_requirements.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-medium text-ink">{t('ui.skills_requirements')}</h2>
              <ul className="flex flex-wrap gap-2">
                {job.skill_requirements.map((skill) => (
                  <li key={skill} className="rounded-full bg-surface-alt px-3 py-1 text-sm text-ink-600">
                    {skill}
                  </li>
                ))}
              </ul>
            </section>
          )}
          <RichTextSection title={t('ui.responsibilities')} text={job.responsibilities} />
          <RichTextSection title={t('ui.requirements')} text={job.requirements} />
          <RichTextSection title={t('ui.benefits')} text={job.benefits} />
        </div>

        <aside className="flex flex-col gap-6">
          <InfoCard title={t('ui.job_overview')}>
            <OverviewGrid items={overview} />
          </InfoCard>
          <div className="flex justify-end">
            <ReportButton targetKind="job" targetId={job.id} label={t('ui.report_this_posting')} />
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="bg-surface-alt/50">
          <div className="mx-auto w-full max-w-[1320px] px-6 py-16 lg:px-10">
            <h2 className="mb-10 text-3xl font-medium text-ink lg:text-[40px]">{t('ui.related_jobs')}</h2>
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
