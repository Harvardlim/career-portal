import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { AppliedJobRow } from '@/components/dashboard/JobRows'
import { Pagination } from '@/components/app/Pagination'
import { appliedJobs } from '@/data/dashboardJobs'

export function AppliedJobsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <h1 className="text-lg font-medium text-ink">
          Applied Jobs <span className="text-muted">(589)</span>
        </h1>
        <div className="grid grid-cols-1 gap-2 rounded-lg bg-surface-alt px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-600 sm:grid-cols-[1fr_auto_auto_auto] sm:gap-8">
          <span>Jobs</span>
          <span className="sm:w-[150px]">Date Applied</span>
          <span>Status</span>
          <span>Action</span>
        </div>
        <div className="flex flex-col divide-y divide-line">
          {appliedJobs.map((job) => (
            <AppliedJobRow key={job.title} job={job} />
          ))}
        </div>
        <div className="pt-8">
          <Pagination current={1} />
        </div>
      </div>
    </DashboardLayout>
  )
}
