import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmployerDashboardLayout } from '@/components/dashboard/EmployerDashboardLayout'
import { InviteFriendPanel } from '@/components/partly/InviteFriendPanel'
import { VerificationStatusCard } from '@/components/partly/VerificationStatusCard'
import { Pill, VerifiedChips } from '@/components/partly/ui'
import {
  ArrowRightIcon,
  BriefcaseIcon,
  UsersIcon,
  UserCircleIcon,
} from '@/components/icons'
import { fetchEmployerStats, useEmployer } from '@/lib/employers'
import { fetchMyEmployerBadges, fetchMyPostings, type MatchingStatus, type MyPostingRow } from '@/lib/partly'
import { initialsFromName } from '@/lib/name'

const STATUS: Record<MatchingStatus, { label: string; tone: 'neutral' | 'brand' | 'success' | 'warning' }> = {
  open: { label: 'Taking applications', tone: 'brand' },
  matched: { label: 'Matches ready', tone: 'success' },
  released: { label: 'Interested · contact released', tone: 'success' },
  no_further_matches: { label: 'No further matches', tone: 'warning' },
  closed: { label: 'Closed', tone: 'neutral' },
}

export function EmployerDashboardPage() {
  const { employer, loading: employerLoading } = useEmployer()
  const [stats, setStats] = useState({ openJobs: 0, applications: 0, savedCandidates: 0 })
  const [postings, setPostings] = useState<MyPostingRow[]>([])
  const [awaitingReview, setAwaitingReview] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    if (!employer) return
    Promise.all([fetchEmployerStats(employer.id), fetchMyPostings(employer.id), fetchMyEmployerBadges(employer.id)])
      .then(([s, p, badges]) => {
        setStats(s)
        setPostings(p)
        setAwaitingReview(badges.some((b) => b.status === 'awaiting_review'))
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
    { value: stats.openJobs, label: 'Open needs', Icon: BriefcaseIcon, bg: 'bg-brand-50', fg: 'text-brand' },
    { value: stats.applications, label: 'Applicants', Icon: UsersIcon, bg: 'bg-[#e7f6ec]', fg: 'text-[#0ba02c]' },
    { value: stats.savedCandidates, label: 'Saved experts', Icon: UserCircleIcon, bg: 'bg-[#fff6e6]', fg: 'text-[#ffaa00]' },
  ]
  const badgeLive = !!employer?.verified_badge_until && new Date(employer.verified_badge_until) > new Date()

  return (
    <EmployerDashboardLayout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-medium text-ink">
            Hello, {employer?.company_name ?? 'there'}
            <VerifiedChips identity={employer?.basic_verified} badge={badgeLive} />
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

        <VerificationStatusCard
          audience="business"
          loading={loading}
          basic={!!employer?.basic_verified}
          badgeUntil={employer?.verified_badge_until ?? null}
          awaitingReview={awaitingReview}
          manageTo="/employer/verification"
        />

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
            <h2 className="text-lg font-medium text-ink">Recent postings</h2>
            <Link
              to="/employer/postings"
              className="flex items-center gap-1.5 text-sm text-muted-600"
            >
              View all
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
          {postings.length > 0 ? (
            <div className="flex flex-col divide-y divide-line rounded-lg border border-line">
              {postings.slice(0, 5).map((p) => {
                const st = STATUS[p.matching_status] ?? STATUS.open
                return (
                  <Link
                    key={p.id}
                    to={`/employer/postings/${p.id}/matches`}
                    className="flex flex-col gap-2 p-4 transition-colors hover:bg-surface-alt sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-ink">{p.title}</span>
                      <Pill tone={st.tone}>{st.label}</Pill>
                    </span>
                    <span className="text-sm text-muted">
                      {p.applications} applied · {p.released} interested · {p.unlocked} unlocked
                    </span>
                  </Link>
                )
              })}
            </div>
          ) : (
            <p className="rounded-lg bg-surface-alt px-4 py-10 text-center text-sm text-muted">
              {loading ? 'Loading…' : 'No postings yet.'}{' '}
              {!loading && (
                <Link to="/employer/post-need" className="font-medium text-brand">
                  Post your first need — it&apos;s free
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
