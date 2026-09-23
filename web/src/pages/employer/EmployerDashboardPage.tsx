import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmployerDashboardLayout } from '@/components/dashboard/EmployerDashboardLayout'
import { InviteFriendPanel } from '@/components/partly/InviteFriendPanel'
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
import { initialsFromName } from '@/lib/name'

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

        {!employer?.about && (
          <div className="flex flex-col gap-4 rounded-lg bg-danger p-6 text-white sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {employer?.logo_url ? (
                <img
                  src={employer.logo_url}
                  alt={employer.company_name ?? 'Company logo'}
                  className="size-14 shrink-0 rounded-full object-cover ring-2 ring-white/40"
                />
              ) : (
                <span className="grid size-14 shrink-0 place-items-center rounded-full bg-white/20 text-lg font-semibold text-white">
                  {initialsFromName(employer?.company_name) || 'C'}
                </span>
              )}
              <div>
                <p className="text-lg font-medium">Your profile editing is not completed.</p>
                <p className="text-sm text-white/80">
                  Complete your business profile so experts see who they&apos;re working with
                </p>
              </div>
            </div>
            <Link
              to="/company/register"
              className="flex shrink-0 items-center gap-2 rounded-[4px] bg-surface px-6 py-3 text-sm font-semibold text-brand"
            >
              Edit Profile
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        )}

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
        <InviteFriendPanel audience="business" />
      </div>
    </EmployerDashboardLayout>
  )
}
