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
import { useT } from '@/lib/i18n'

const PAGE_SIZE = 10

export function MyJobsPage() {
  const t = useT()
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
          <h1 className="text-lg font-medium text-ink">{t('ui.my_jobs')}{' '}<span className="text-muted">({jobs.length})</span>
          </h1>
          <div className="flex h-11 items-center gap-2 rounded-md border border-line px-4 text-sm text-muted-600">
            <span className="shrink-0">{t('ui.job_status')}</span>
            <Dropdown
              className="w-[120px] font-medium"
              value={status}
              onChange={setStatus}
              align="right"
              options={[
                { value: 'all', label: t('ui.all_jobs') },
                { value: 'active', label: t('ui.published') },
                { value: 'draft', label: t('ui.draft') },
                { value: 'expired', label: t('ui.expired') },
              ]}
            />
          </div>
        </div>

        {visible.length > 0 ? (
          <>
            <div className="hidden grid-cols-[1fr_130px_170px_auto] gap-6 rounded-lg bg-surface-alt px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-600 sm:grid">
              <span>{t('ui.jobs_2')}</span>
              <span>{t('ui.status')}</span>
              <span>{t('ui.applications_3')}</span>
              <span>{t('ui.actions')}</span>
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
            {loading ? t('ui.loading_2') : t('ui.no_jobs_here_yet')}{' '}
            {!loading && (
              <Link to="/employer/post-job" className="font-medium text-brand">{t('ui.post_a_job')}</Link>
            )}
          </p>
        )}
      </div>
    </EmployerDashboardLayout>
  )
}
