import { Link } from 'react-router-dom'
import type { Job } from '@/data/jobs'
import {
  ArrowRightIcon,
  BookmarkIcon,
  CalendarIcon,
  DollarIcon,
  MapPinIcon,
} from '@/components/icons'
import { CompanyLogo } from '@/components/jobs/CompanyLogo'

export function JobRow({ job }: { job: Job }) {
  return (
    <article
      className={`flex flex-col gap-6 rounded-xl border p-6 sm:flex-row sm:items-center sm:justify-between ${
        job.highlighted
          ? 'border-brand shadow-feature'
          : job.featured
            ? 'border-line bg-[#fff6ed]'
            : 'border-line'
      }`}
    >
      <div className="flex items-center gap-5">
        <CompanyLogo bg={job.logoBg} lightLogo={job.lightLogo} size={68} rounded="rounded-md" />
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-medium text-ink">{job.title}</h3>
            {job.featured && (
              <span className="rounded-full bg-danger-50 px-3 py-0.5 text-sm font-medium text-danger">
                Featured
              </span>
            )}
            <span className="rounded-full bg-brand-50 px-3 py-0.5 text-sm font-medium text-brand">
              {job.type}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-ink-600">
            <span className="flex items-center gap-1.5">
              <MapPinIcon className="size-[22px]" />
              {job.location}
            </span>
            <span className="flex items-center gap-1">
              <DollarIcon className="size-[22px]" />
              {job.salary}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="size-[22px]" />
              {job.remaining ?? '4 Days Remaining'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          aria-label="Save job"
          className={`rounded-[5px] p-3 ${
            job.highlighted ? 'bg-brand-tint text-brand' : 'text-muted-slate'
          }`}
        >
          <BookmarkIcon className="size-6" />
        </button>
        <Link
          to="/job-detail"
          className={`flex items-center gap-3 rounded-[3px] px-6 py-3 text-base font-semibold transition-colors ${
            job.highlighted
              ? 'bg-brand text-white hover:bg-brand-600'
              : 'bg-brand-50 text-brand hover:bg-brand-100'
          }`}
        >
          Apply Now
          <ArrowRightIcon className="size-6" />
        </Link>
      </div>
    </article>
  )
}
