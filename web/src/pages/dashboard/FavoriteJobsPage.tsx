import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { SavedJobRow } from '@/components/dashboard/JobRows'
import { Pagination } from '@/components/app/Pagination'
import { favoriteJobs } from '@/data/dashboardJobs'

export function FavoriteJobsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <h1 className="text-lg font-medium text-ink">
          Favorite Jobs <span className="text-muted">(17)</span>
        </h1>
        <div className="flex flex-col divide-y divide-line">
          {favoriteJobs.map((job, i) => (
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
