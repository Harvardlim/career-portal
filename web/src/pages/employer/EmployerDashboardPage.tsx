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
import { useT, tr } from '@/lib/i18n'

const STATUS: Record<MatchingStatus, { label: string; tone: 'neutral' | 'brand' | 'success' | 'warning' }> = {
  open: { get label() { return tr('st.open') }, tone: 'brand' },
  matched: { get label() { return tr('st.matched') }, tone: 'success' },
  released: { get label() { return tr('st.released_interested') }, tone: 'success' },
  no_further_matches: { get label() { return tr('st.no_further') }, tone: 'warning' },
  closed: { get label() { return tr('st.closed') }, tone: 'neutral' },
}

export function EmployerDashboardPage() {
  const t = useT()
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
    { value: stats.openJobs, label: t('ui.open_needs'), to: '/employer/postings', Icon: BriefcaseIcon, bg: 'bg-brand-50', fg: 'text-brand' },
    { value: stats.applications, label: t('ui.applicants'), to: '/employer/applications', Icon: UsersIcon, bg: 'bg-[#e7f6ec]', fg: 'text-[#0ba02c]' },
    { value: stats.savedCandidates, label: t('ui.saved_experts'), to: '/employer/saved-candidates', Icon: UserCircleIcon, bg: 'bg-[#fff6e6]', fg: 'text-[#ffaa00]' },
  ]
  const badgeLive = !!employer?.verified_badge_until && new Date(employer.verified_badge_until) > new Date()

  return (
    <EmployerDashboardLayout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-medium text-ink">{t('ui.hello')}{' '}{employer?.company_name ?? 'there'}
            <VerifiedChips identity={employer?.basic_verified} badge={badgeLive} />
          </h1>
          <p className="mt-1 text-muted">{t('ui.here_is_your_daily_activities_and')}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {cards.map(({ value, label, to, Icon, bg, fg }) => (
            <Link
              key={label}
              to={to}
              className={`flex items-center justify-between rounded-lg p-6 transition-shadow hover:shadow-md ${bg}`}
            >
              <div>
                <p className="text-3xl font-medium text-ink">{loading ? ', ' : value}</p>
                <p className="mt-1 text-sm text-ink-600">{label}</p>
              </div>
              <span className={`grid size-12 place-items-center rounded-lg bg-surface ${fg}`}>
                <Icon className="size-6" />
              </span>
            </Link>
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
                  alt={employer.company_name ?? t('ui.company_logo_2')}
                  className="size-14 shrink-0 rounded-full object-cover ring-2 ring-white/40"
                />
              ) : (
                <span className="grid size-14 shrink-0 place-items-center rounded-full bg-white/20 text-lg font-semibold text-white">
                  {initialsFromName(employer?.company_name) || 'C'}
                </span>
              )}
              <div>
                <p className="text-lg font-medium">{t('ui.your_profile_editing_is_not_completed')}</p>
                <p className="text-sm text-white/80">{t('ui.complete_your_business_profile_so_experts')}</p>
              </div>
            </div>
            <Link
              to="/company/register"
              className="flex shrink-0 items-center gap-2 rounded-[4px] bg-surface px-6 py-3 text-sm font-semibold text-brand"
            >{t('ui.edit_profile')}<ArrowRightIcon className="size-4" />
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-ink">{t('ui.recent_postings')}</h2>
            <Link
              to="/employer/postings"
              className="flex items-center gap-1.5 text-sm text-muted-600"
            >{t('ui.view_all_2')}<ArrowRightIcon className="size-4" />
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
                    <span className="text-sm text-muted">{t('ui.applied_interested_unlocked', { applications: p.applications, released: p.released, unlocked: p.unlocked })}</span>
                  </Link>
                )
              })}
            </div>
          ) : (
            <p className="rounded-lg bg-surface-alt px-4 py-10 text-center text-sm text-muted">
              {loading ? t('ui.loading_2') : t('ui.no_postings_yet')}{' '}
              {!loading && (
                <Link to="/employer/post-need" className="font-medium text-brand">{t('ui.post_your_first_need_it_s')}</Link>
              )}
            </p>
          )}
        </div>
        <InviteFriendPanel audience="business" />
      </div>
    </EmployerDashboardLayout>
  )
}
