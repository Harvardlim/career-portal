import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { SavedJobRow } from '@/components/dashboard/JobRows'
import { Pagination } from '@/components/app/Pagination'
import { PencilIcon } from '@/components/icons'
import { alertJobs } from '@/data/dashboardJobs'

export function JobAlertsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-medium text-ink">
            Job Alerts <span className="text-muted">(9 new jobs)</span>
          </h1>
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm text-muted-600"
          >
            <PencilIcon className="size-4" />
            Edit Job Alerts
          </button>
        </div>
        <div className="flex flex-col divide-y divide-line">
          {alertJobs.map((job, i) => (
            <SavedJobRow key={`${job.title}-${i}`} job={job} />
          ))}
        </div>
        <div className="pt-8">
          <Pagination current={1} />
        </div>
      </div>
    </DashboardLayout>
  )
}
