import { AppShell } from '@/layouts/AppShell'
import { Breadcrumb } from '@/components/app/Breadcrumb'
import { Pagination } from '@/components/app/Pagination'
import { FindJobToolbar } from '@/components/jobs/FindJobToolbar'
import { JobRow } from '@/components/jobs/JobRow'
import { jobs } from '@/data/jobs'

export function FindJobListPage() {
  return (
    <AppShell>
      <Breadcrumb title="Find Job" trail={[{ label: 'Home', to: '/' }, { label: 'Find job' }]} />
      <FindJobToolbar view="list" />
      <div className="mx-auto w-full max-w-[1320px] px-6 py-12 lg:px-10">
        <div className="flex flex-col gap-4">
          {jobs.map((job) => (
            <JobRow key={job.id} job={job} />
          ))}
        </div>
        <div className="pt-10">
          <Pagination current={1} />
        </div>
      </div>
    </AppShell>
  )
}
