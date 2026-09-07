import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { JobRow } from '@/lib/dashboard'
import { expiryLabel } from '@/lib/dashboard'
import { CompanyLogo } from '@/components/jobs/CompanyLogo'
import {
  ArrowRightIcon,
  BookmarkIcon,
  CalendarIcon,
  CheckIcon,
  DollarIcon,
  MapPinIcon,
  XCircleIcon,
} from '@/components/icons'

const jobDetailPath = (job: JobRow) => `/job/${encodeURIComponent(job.slug)}`

function Meta({
  location,
  salary,
  trailing,
}: {
  location: string | null
  salary: string | null
  trailing?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
      {location && (
        <span className="flex items-center gap-1.5">
          <MapPinIcon className="size-[18px]" />
          {location}
        </span>
      )}
      {salary && (
        <span className="flex items-center gap-1">
          <DollarIcon className="size-[18px]" />
          {salary}
        </span>
      )}
      {trailing}
    </div>
  )
}

const dateFmt = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export function AppliedJobRow({
  job,
  appliedAt,
  status,
}: {
  job: JobRow
  appliedAt: string
  status: string
}) {
  // Candidate-facing application status.
  const label =
    status === 'active'
      ? 'Submitted'
      : status.charAt(0).toUpperCase() + status.slice(1)
  const color =
    status === 'hired'
      ? 'text-[#0ba02c]'
      : status === 'rejected'
        ? 'text-danger'
        : status === 'shortlisted'
          ? 'text-star'
          : 'text-brand'
  return (
    <div className="grid grid-cols-1 items-center gap-4 rounded-lg border border-transparent p-4 sm:grid-cols-[1fr_auto_auto_auto] sm:gap-8">
      <div className="flex items-center gap-4">
        <CompanyLogo bg={job.logo_bg ?? '#e7e9f2'} lightLogo={job.light_logo} size={48} />
        <div className="flex flex-col gap-1.5">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-ink">{job.title}</span>
            {job.job_type && (
              <span className="rounded-full bg-brand-tint px-2.5 py-0.5 text-xs text-brand">
                {job.job_type}
              </span>
            )}
          </span>
          <Meta location={job.location} salary={job.salary_label} />
        </div>
      </div>
      <span className="text-sm text-muted sm:w-[150px]">
        {dateFmt.format(new Date(appliedAt))}
      </span>
      <span
        className={`flex items-center gap-1.5 text-sm font-medium ${color}`}
      >
        {status === 'rejected' ? (
          <XCircleIcon className="size-4" />
        ) : (
          <CheckIcon className="size-4" />
        )}
        {label}
      </span>
      <Link
        to={jobDetailPath(job)}
        className="rounded-[3px] bg-brand-50 px-6 py-2.5 text-center text-sm font-semibold text-brand hover:bg-brand-100"
      >
        View Details
      </Link>
    </div>
  )
}

export function SavedJobRow({
  job,
  saved = true,
  onToggleSave,
}: {
  job: JobRow
  saved?: boolean
  onToggleSave?: () => void
}) {
  const { text, expired } = expiryLabel(job.expires_at)
  const isExpired = expired || job.status !== 'active'
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-transparent p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <CompanyLogo bg={job.logo_bg ?? '#e7e9f2'} lightLogo={job.light_logo} size={48} />
        <div className="flex flex-col gap-1.5">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-ink">{job.title}</span>
            {job.job_type && (
              <span className="rounded-full bg-brand-tint px-2.5 py-0.5 text-xs text-brand">
                {job.job_type}
              </span>
            )}
          </span>
          <Meta
            location={job.location}
            salary={job.salary_label}
            trailing={
              isExpired ? (
                <span className="flex items-center gap-1.5 text-danger">
                  <XCircleIcon className="size-[18px]" />
                  Job Expire
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <CalendarIcon className="size-[18px]" />
                  {text}
                </span>
              )
            }
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {onToggleSave && (
          <button
            type="button"
            onClick={onToggleSave}
            aria-label={saved ? 'Remove from favorites' : 'Add to favorites'}
            className={saved ? 'text-ink' : 'text-muted-slate'}
          >
            <BookmarkIcon className={`size-6 ${saved ? 'fill-current' : ''}`} />
          </button>
        )}
        {isExpired ? (
          <span className="rounded-[3px] bg-surface-alt px-6 py-2.5 text-sm font-semibold text-muted">
            Deadline Expired
          </span>
        ) : (
          <Link
            to={jobDetailPath(job)}
            className="flex items-center gap-2 rounded-[3px] bg-brand-50 px-6 py-2.5 text-sm font-semibold text-brand hover:bg-brand-100"
          >
            Apply Now
            <ArrowRightIcon className="size-4" />
          </Link>
        )}
      </div>
    </div>
  )
}
