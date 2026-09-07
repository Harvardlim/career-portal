import { Link } from 'react-router-dom'
import type { Job } from '@/data/jobs'
import { MapPinIcon } from '@/components/icons'
import { CompanyLogo } from '@/components/jobs/CompanyLogo'
import { SaveJobButton } from '@/components/jobs/SaveJobButton'

export function JobCard({ job }: { job: Job }) {
  return (
    <Link
      to={job.slug ? `/job/${job.slug}` : '/job-detail'}
      className={`relative flex flex-col gap-6 rounded-xl border p-8 transition-shadow ${
        job.highlighted
          ? 'border-brand shadow-feature'
          : job.featured
            ? 'border-line-soft bg-[#fff6ed] hover:shadow-feature'
            : 'border-line-soft hover:shadow-feature'
      }`}
    >
      {job.jobId && (
        <SaveJobButton
          jobId={job.jobId}
          size="sm"
          className="absolute right-4 top-4"
        />
      )}
      <div className="flex items-start gap-4">
        <CompanyLogo bg={job.logoBg} lightLogo={job.lightLogo} />
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-base font-medium text-ink">{job.company}</span>
            {job.featured && (
              <span className="rounded-full bg-[#ffeded] px-3 py-0.5 text-sm text-[#ff4f4f]">
                Featured
              </span>
            )}
          </div>
          <span className="flex items-center gap-1.5 text-sm text-muted-slate">
            <MapPinIcon className="size-[18px]" />
            {job.location}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3
          className={`text-xl font-medium ${
            job.highlighted ? 'text-brand' : 'text-ink-heading'
          }`}
        >
          {job.title}
        </h3>
        <p className="flex items-center gap-2 text-sm text-muted-600">
          <span>{job.type}</span>
          <span className="size-1 rounded-full bg-muted-slate" />
          <span>{job.salary}</span>
        </p>
      </div>
    </Link>
  )
}
