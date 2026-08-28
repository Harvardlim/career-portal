import { Link } from 'react-router-dom'
import type { AppliedJob, SavedJob } from '@/data/dashboardJobs'
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

function Meta({
  location,
  salary,
  trailing,
}: {
  location: string
  salary: string
  trailing?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
      <span className="flex items-center gap-1.5">
        <MapPinIcon className="size-[18px]" />
        {location}
      </span>
      <span className="flex items-center gap-1">
        <DollarIcon className="size-[18px]" />
        {salary}
      </span>
      {trailing}
    </div>
  )
}

export function AppliedJobRow({ job }: { job: AppliedJob }) {
  return (
    <div
      className={`grid grid-cols-1 items-center gap-4 rounded-lg border p-4 sm:grid-cols-[1fr_auto_auto_auto] sm:gap-8 ${
        job.highlighted ? 'border-brand' : 'border-transparent'
      }`}
    >
      <div className="flex items-center gap-4">
        <CompanyLogo bg={job.logoBg} lightLogo={job.lightLogo} size={48} />
        <div className="flex flex-col gap-1.5">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-ink">{job.title}</span>
            <span className="rounded-full bg-brand-tint px-2.5 py-0.5 text-xs text-brand">
              {job.type}
            </span>
          </span>
          <Meta location={job.location} salary={job.salary} />
        </div>
      </div>
      <span className="text-sm text-muted sm:w-[150px]">{job.date}</span>
      <span className="flex items-center gap-1.5 text-sm font-medium text-[#0ba02c]">
        <CheckIcon className="size-4" />
        Active
      </span>
      <Link
        to="/job-detail"
        className={`rounded-[3px] px-6 py-2.5 text-center text-sm font-semibold ${
          job.highlighted
            ? 'bg-brand text-white'
            : 'bg-brand-50 text-brand hover:bg-brand-100'
        }`}
      >
        View Details
      </Link>
    </div>
  )
}

export function SavedJobRow({ job }: { job: SavedJob }) {
  const expired = job.status === 'expired'
  return (
    <div
      className={`flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between ${
        job.highlighted ? 'border-brand shadow-feature' : 'border-transparent'
      }`}
    >
      <div className="flex items-center gap-4">
        <CompanyLogo bg={job.logoBg} lightLogo={job.lightLogo} size={48} />
        <div className="flex flex-col gap-1.5">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-ink">{job.title}</span>
            <span className="rounded-full bg-brand-tint px-2.5 py-0.5 text-xs text-brand">
              {job.type}
            </span>
          </span>
          <Meta
            location={job.location}
            salary={job.salary}
            trailing={
              expired ? (
                <span className="flex items-center gap-1.5 text-danger">
                  <XCircleIcon className="size-[18px]" />
                  Job Expire
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <CalendarIcon className="size-[18px]" />
                  4 Days Remaining
                </span>
              )
            }
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          aria-label="Toggle saved"
          className={job.saved ? 'text-ink' : 'text-muted-slate'}
        >
          <BookmarkIcon className={`size-6 ${job.saved ? 'fill-current' : ''}`} />
        </button>
        {expired ? (
          <span className="rounded-[3px] bg-surface-alt px-6 py-2.5 text-sm font-semibold text-muted">
            Deadline Expired
          </span>
        ) : (
          <Link
            to="/apply-job"
            className={`flex items-center gap-2 rounded-[3px] px-6 py-2.5 text-sm font-semibold ${
              job.highlighted
                ? 'bg-brand text-white'
                : 'bg-brand-50 text-brand hover:bg-brand-100'
            }`}
          >
            Apply Now
            <ArrowRightIcon className="size-4" />
          </Link>
        )}
      </div>
    </div>
  )
}
