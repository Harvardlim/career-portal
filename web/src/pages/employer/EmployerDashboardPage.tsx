import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmployerDashboardLayout } from '@/components/dashboard/EmployerDashboardLayout'
import {
  ArrowRightIcon,
  BriefcaseIcon,
  UsersIcon,
  UserCircleIcon,
} from '@/components/icons'
import {
  fetchEmployerJobs,
  fetchEmployerStats,
  useEmployer,
  type EmployerJobRow,
} from '@/lib/employers'
import { EmployerJobRow as JobRowUI } from '@/components/dashboard/EmployerJobRow'

export function EmployerDashboardPage() {
  const { employer, loading: employerLoading } = useEmployer()
  const [stats, setStats] = useState({ openJobs: 0, applications: 0, savedCandidates: 0 })
  const [jobs, setJobs] = useState<EmployerJobRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    if (!employer) return
    Promise.all([fetchEmployerStats(employer.id), fetchEmployerJobs(employer.id)])
      .then(([s, j]) => {
        setStats(s)
        setJobs(j)
      })
      .catch((err) => console.error('employer dashboard', err))
      .finally(() => setLoading(false))
  }, [employer])

  useEffect(() => {
    if (!employer) {
      if (!employerLoading) setLoading(false)
      return
    }
    load()
  }, [employer, employerLoading, load])

  const cards = [
    { value: stats.openJobs, label: 'Open Jobs', Icon: BriefcaseIcon, bg: 'bg-brand-50', fg: 'text-brand' },
    { value: stats.applications, label: 'Applications', Icon: UsersIcon, bg: 'bg-[#e7f6ec]', fg: 'text-[#0ba02c]' },
    { value: stats.savedCandidates, label: 'Saved Candidates', Icon: UserCircleIcon, bg: 'bg-[#fff6e6]', fg: 'text-[#ffaa00]' },
  ]

  return (
    <EmployerDashboardLayout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-medium text-ink">
            Hello, {employer?.company_name ?? 'there'}
          </h1>
          <p className="mt-1 text-muted">
            Here is your daily activities and applications
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {cards.map(({ value, label, Icon, bg, fg }) => (
            <div key={label} className={`flex items-center justify-between rounded-lg p-6 ${bg}`}>
              <div>
                <p className="text-3xl font-medium text-ink">{loading ? '—' : value}</p>
                <p className="mt-1 text-sm text-ink-600">{label}</p>
              </div>
              <span className={`grid size-12 place-items-center rounded-lg bg-surface ${fg}`}>
                <Icon className="size-6" />
              </span>
            </div>
          ))}
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
          {jobs.length > 0 ? (
            <>
              <div className="hidden grid-cols-[1fr_130px_170px_auto] gap-6 rounded-lg bg-surface-alt px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-600 sm:grid">
                <span>Jobs</span>
                <span>Status</span>
                <span>Applications</span>
                <span>Actions</span>
              </div>
              <div className="flex flex-col divide-y divide-line">
                {jobs.slice(0, 5).map((job) => (
                  <JobRowUI
                    key={job.id}
                    job={job}
                    employerId={employer!.id}
                    onChanged={load}
                  />
                ))}
              </div>
            </>
          ) : (
            <p className="rounded-lg bg-surface-alt px-4 py-10 text-center text-sm text-muted">
              {loading ? 'Loading…' : 'No jobs posted yet.'}{' '}
              {!loading && (
                <Link to="/employer/post-job" className="font-medium text-brand">
                  Post a job
                </Link>
              )}
            </p>
          )}
        </div>
      </div>
    </EmployerDashboardLayout>
  )
}
