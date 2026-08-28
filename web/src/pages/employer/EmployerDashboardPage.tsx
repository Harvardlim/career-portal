import { Link } from 'react-router-dom'
import { EmployerDashboardLayout } from '@/components/dashboard/EmployerDashboardLayout'
import { JobPostRow } from '@/components/dashboard/JobPostRow'
import { employerJobs } from '@/data/employerJobs'
import { ArrowRightIcon, BriefcaseIcon, UserCircleIcon } from '@/components/icons'

export function EmployerDashboardPage() {
  return (
    <EmployerDashboardLayout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-medium text-ink">Hello, Instagram</h1>
          <p className="mt-1 text-muted">
            Here is your daily activities and applications
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg bg-brand-50 p-6">
            <div>
              <p className="text-3xl font-medium text-ink">589</p>
              <p className="mt-1 text-sm text-ink-600">Open Jobs</p>
            </div>
            <span className="grid size-12 place-items-center rounded-lg bg-surface text-brand">
              <BriefcaseIcon className="size-6" />
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-[#fff6e6] p-6">
            <div>
              <p className="text-3xl font-medium text-ink">2,517</p>
              <p className="mt-1 text-sm text-ink-600">Saved Candidates</p>
            </div>
            <span className="grid size-12 place-items-center rounded-lg bg-surface text-[#ffaa00]">
              <UserCircleIcon className="size-6" />
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-ink">Recently Posted Jobs</h2>
            <Link
              to="/employer/my-jobs"
              className="flex items-center gap-1.5 text-sm text-muted-600"
            >
              View all
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 rounded-lg bg-surface-alt px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-600 sm:grid-cols-[1fr_130px_170px_auto] sm:gap-6">
            <span>Jobs</span>
            <span>Status</span>
            <span>Applications</span>
            <span>Actions</span>
          </div>
          <div className="flex flex-col divide-y divide-line">
            {employerJobs.slice(0, 5).map((job) => (
              <JobPostRow key={job.title} job={job} />
            ))}
          </div>
        </div>
      </div>
    </EmployerDashboardLayout>
  )
}
