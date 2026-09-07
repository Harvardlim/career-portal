import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmployerDashboardLayout } from '@/components/dashboard/EmployerDashboardLayout'
import { EmployerJobRow } from '@/components/dashboard/EmployerJobRow'
import { Pagination } from '@/components/app/Pagination'
import { Dropdown } from '@/components/app/Dropdown'
import {
  fetchEmployerJobs,
  useEmployer,
  type EmployerJobRow as JobRecord,
} from '@/lib/employers'

const PAGE_SIZE = 10

export function MyJobsPage() {
  const { employer, loading: employerLoading } = useEmployer()
  const [jobs, setJobs] = useState<JobRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)

  const load = useCallback(() => {
    if (!employer) return
    setLoading(true)
    fetchEmployerJobs(employer.id)
      .then(setJobs)
      .catch((err) => console.error('my jobs', err))
      .finally(() => setLoading(false))
  }, [employer])

  useEffect(() => {
    if (!employer) {
      if (!employerLoading) setLoading(false)
      return
    }
    load()
  }, [employer, employerLoading, load])

  useEffect(() => setPage(1), [status])

  const filtered = jobs.filter((j) => {
    if (status === 'all') return true
    if (status === 'active') return j.status === 'active'
    if (status === 'draft') return j.status === 'draft'
    return j.status !== 'active' && j.status !== 'draft'
  })
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <EmployerDashboardLayout>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-lg font-medium text-ink">
            My Jobs <span className="text-muted">({jobs.length})</span>
          </h1>
          <div className="flex h-11 items-center gap-2 rounded-md border border-line px-4 text-sm text-muted-600">
            <span className="shrink-0">Job status</span>
            <Dropdown
              className="w-[120px] font-medium"
              value={status}
              onChange={setStatus}
              align="right"
              options={[
                { value: 'all', label: 'All Jobs' },
                { value: 'active', label: 'Published' },
                { value: 'draft', label: 'Draft' },
                { value: 'expired', label: 'Expired' },
              ]}
            />
          </div>
        </div>

        {visible.length > 0 ? (
          <>
            <div className="hidden grid-cols-[1fr_130px_170px_auto] gap-6 rounded-lg bg-surface-alt px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-600 sm:grid">
              <span>Jobs</span>
              <span>Status</span>
              <span>Applications</span>
              <span>Actions</span>
            </div>
            <div className="flex flex-col divide-y divide-line">
              {visible.map((job) => (
                <EmployerJobRow
                  key={job.id}
                  job={job}
                  employerId={employer!.id}
                  onChanged={load}
                />
              ))}
            </div>
            {pageCount > 1 && (
              <div className="pt-8">
                <Pagination pages={pageCount} current={page} onChange={setPage} />
              </div>
            )}
          </>
        ) : (
          <p className="rounded-lg bg-surface-alt px-4 py-12 text-center text-sm text-muted">
            {loading ? 'Loading…' : 'No jobs here yet.'}{' '}
            {!loading && (
              <Link to="/employer/post-job" className="font-medium text-brand">
                Post a job
              </Link>
            )}
          </p>
        )}
      </div>
    </EmployerDashboardLayout>
  )
}
