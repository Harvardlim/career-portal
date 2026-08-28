import { EmployerDashboardLayout } from '@/components/dashboard/EmployerDashboardLayout'
import { JobPostRow } from '@/components/dashboard/JobPostRow'
import { Pagination } from '@/components/app/Pagination'
import { ChevronDownIcon } from '@/components/icons'
import { employerJobs } from '@/data/employerJobs'

export function MyJobsPage() {
  return (
    <EmployerDashboardLayout>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-lg font-medium text-ink">
            My Jobs <span className="text-muted">(589)</span>
          </h1>
          <label className="flex items-center gap-2 text-sm text-muted-600">
            Job status
            <span className="relative">
              <select className="h-10 w-[160px] appearance-none rounded-md border border-line bg-surface px-3 pr-8 text-sm text-ink outline-none">
                <option>All Jobs</option>
                <option>Active</option>
                <option>Expired</option>
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-muted" />
            </span>
          </label>
        </div>
        <div className="grid grid-cols-1 gap-3 rounded-lg bg-surface-alt px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-600 sm:grid-cols-[1fr_130px_170px_auto] sm:gap-6">
          <span>Jobs</span>
          <span>Status</span>
          <span>Applications</span>
          <span>Actions</span>
        </div>
        <div className="flex flex-col divide-y divide-line">
          {employerJobs.map((job) => (
            <JobPostRow key={job.title} job={job} />
          ))}
        </div>
        <div className="pt-8">
          <Pagination current={1} />
        </div>
      </div>
    </EmployerDashboardLayout>
  )
}
