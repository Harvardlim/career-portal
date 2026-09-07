import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { AppliedJobRow } from '@/components/dashboard/JobRows'
import {
  fetchAppliedJobs,
  fetchDashboardCounts,
  fetchMembership,
  membershipEndDate,
  useCandidate,
  type AppliedJobRecord,
  type MembershipRecord,
} from '@/lib/dashboard'
import { ArrowRightIcon, BookmarkIcon, BriefcaseIcon, StarIcon } from '@/components/icons'
import { initialsFromName } from '@/lib/name'

const dateFmt = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function DashboardOverviewPage() {
  const { candidate, loading: candidateLoading } = useCandidate()
  const [counts, setCounts] = useState({ applied: 0, saved: 0 })
  const [recent, setRecent] = useState<AppliedJobRecord[]>([])
  const [membership, setMembership] = useState<MembershipRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!candidate) {
      if (!candidateLoading) setLoading(false)
      return
    }
    let alive = true
    Promise.all([
      fetchDashboardCounts(candidate.id),
      fetchAppliedJobs(candidate.id),
      fetchMembership(candidate.id),
    ])
      .then(([c, applied, m]) => {
        if (!alive) return
        setCounts(c)
        setRecent(applied.slice(0, 4))
        setMembership(m)
      })
      .catch((err) => console.error('dashboard overview', err))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [candidate, candidateLoading])

  const endsAt = membershipEndDate(membership)

  const stats = [
    { value: counts.applied, label: 'Applied jobs', Icon: BriefcaseIcon, bg: 'bg-brand-50', fg: 'text-brand' },
    { value: counts.saved, label: 'Favorite jobs', Icon: BookmarkIcon, bg: 'bg-[#fff6e6]', fg: 'text-[#ffaa00]' },
  ]

  const firstName = candidate?.full_name?.split(' ')[0] ?? 'there'

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-medium text-ink">Hello, {candidate?.full_name ?? 'there'}</h1>
          <p className="mt-1 text-muted">Here is your daily activities and applications</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {stats.map(({ value, label, Icon, bg, fg }) => (
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

        <div className="flex flex-col gap-3 rounded-lg border border-line p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand">
              <StarIcon className="size-6" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-400">
                Current plan
              </p>
              <p className="text-base font-medium text-ink">
                {loading ? '—' : (membership?.plan ?? 'Free')}
              </p>
              <p className="mt-0.5 text-sm text-muted-600">
                {membership
                  ? endsAt
                    ? `Valid until ${dateFmt.format(endsAt)}`
                    : `Active since ${dateFmt.format(new Date(membership.started_at))}`
                  : 'Applying to jobs is always free.'}
              </p>
            </div>
          </div>
          <Link
            to="/dashboard/membership"
            className="flex shrink-0 items-center gap-2 rounded-[4px] bg-brand-50 px-5 py-2.5 text-sm font-semibold text-brand hover:bg-brand-100"
          >
            {membership ? 'Manage plan' : 'Upgrade'}
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>

        {!candidate?.biography && (
          <div className="flex flex-col gap-4 rounded-lg bg-danger p-6 text-white sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {candidate?.avatar_path ? (
                <img
                  src={candidate.avatar_path}
                  alt={candidate.full_name ?? 'Profile'}
                  className="size-14 shrink-0 rounded-full object-cover ring-2 ring-white/40"
                />
              ) : (
                <span className="grid size-14 shrink-0 place-items-center rounded-full bg-white/20 text-lg font-semibold text-white">
                  {initialsFromName(candidate?.full_name) || 'U'}
                </span>
              )}
              <div>
                <p className="text-lg font-medium">Your profile editing is not completed.</p>
                <p className="text-sm text-white/80">
                  Complete your profile editing &amp; build your custom Resume
                </p>
              </div>
            </div>
            <Link
              to="/dashboard/settings"
              className="flex shrink-0 items-center gap-2 rounded-[4px] bg-surface px-6 py-3 text-sm font-semibold text-brand"
            >
              Edit Profile
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-ink">Recently Applied</h2>
            <Link
              to="/dashboard/applied-jobs"
              className="flex items-center gap-1.5 text-sm text-muted-600"
            >
              View all
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
          {recent.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-2 rounded-lg bg-surface-alt px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-600 sm:grid-cols-[1fr_auto_auto_auto] sm:gap-8">
                <span>Job</span>
                <span className="sm:w-[150px]">Date Applied</span>
                <span>Status</span>
                <span>Action</span>
              </div>
              <div className="flex flex-col divide-y divide-line">
                {recent.map(
                  (rec) =>
                    rec.job && (
                      <AppliedJobRow
                        key={rec.id}
                        job={rec.job}
                        appliedAt={rec.applied_at}
                        status={rec.status}
                      />
                    ),
                )}
              </div>
            </>
          ) : (
            <p className="rounded-lg bg-surface-alt px-4 py-8 text-center text-sm text-muted">
              {loading ? 'Loading…' : `No applications yet, ${firstName}. Browse jobs to get started.`}
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
