import { AppShell } from '@/layouts/AppShell'
import { Breadcrumb } from '@/components/app/Breadcrumb'
import { Pagination } from '@/components/app/Pagination'
import { FindJobToolbar } from '@/components/jobs/FindJobToolbar'
import { JobCard } from '@/components/jobs/JobCard'
import { jobs } from '@/data/jobs'

export function FindJobPage({ filterOpen = false }: { filterOpen?: boolean }) {
  return (
    <AppShell>
      <Breadcrumb title="Find Job" trail={[{ label: 'Home', to: '/' }, { label: 'Find job' }]} />
      <FindJobToolbar view="grid" defaultFilterOpen={filterOpen} />
      <div className="mx-auto w-full max-w-[1320px] px-6 py-12 lg:px-10">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
        <div className="pt-10">
          <Pagination current={1} />
        </div>
      </div>
    </AppShell>
  )
}
