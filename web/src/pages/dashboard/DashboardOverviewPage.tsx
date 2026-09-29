import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { InviteFriendPanel } from '@/components/partly/InviteFriendPanel'
import { VerificationStatusCard } from '@/components/partly/VerificationStatusCard'
import { VerifiedChips } from '@/components/partly/ui'
import { fetchMyBadges, useWarmLeadCount } from '@/lib/partly'
import { AppliedJobRow } from '@/components/dashboard/JobRows'
import { fetchAppliedJobs, fetchDashboardCounts, useCandidate, type AppliedJobRecord } from '@/lib/dashboard'
import { ArrowRightIcon, BookmarkIcon, BriefcaseIcon } from '@/components/icons'
import { initialsFromName } from '@/lib/name'
import { useT } from '@/lib/i18n'

export function DashboardOverviewPage() {
  const t = useT()
  const { candidate, loading: candidateLoading } = useCandidate()
  const [counts, setCounts] = useState({ applied: 0, saved: 0 })
  const [recent, setRecent] = useState<AppliedJobRecord[]>([])
  const [awaitingReview, setAwaitingReview] = useState(false)
  const [loading, setLoading] = useState(true)
  const warmLeads = useWarmLeadCount(candidate?.id)

  useEffect(() => {
    if (!candidate) {
      if (!candidateLoading) setLoading(false)
      return
    }
    let alive = true
    Promise.all([fetchDashboardCounts(candidate.id), fetchAppliedJobs(candidate.id), fetchMyBadges(candidate.id)])
      .then(([c, applied, badges]) => {
        if (!alive) return
        setCounts(c)
        setRecent(applied.slice(0, 4))
        setAwaitingReview(badges.some((b) => b.status === 'awaiting_review'))
      })
      .catch((err) => console.error('dashboard overview', err))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [candidate, candidateLoading])

  const badgeLive = !!candidate?.verified_badge_until && new Date(candidate.verified_badge_until) > new Date()

  const stats = [
    { value: counts.applied, label: t('ui.applied_jobs_2'), Icon: BriefcaseIcon, bg: 'bg-brand-50', fg: 'text-brand' },
    { value: counts.saved, label: t('ui.favorite_jobs'), Icon: BookmarkIcon, bg: 'bg-[#fff6e6]', fg: 'text-[#ffaa00]' },
  ]

  const firstName = candidate?.full_name?.split(' ')[0] ?? 'there'

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-medium text-ink">{t('ui.hello')}{' '}{candidate?.full_name ?? 'there'}
            <VerifiedChips identity={candidate?.identity_verified} badge={badgeLive} />
          </h1>
          <p className="mt-1 text-muted">{t('ui.here_is_your_daily_activities_and')}</p>
        </div>

        {warmLeads > 0 && (
          <Link
            to="/dashboard/leads"
            className="flex flex-col gap-3 rounded-lg border border-gold/60 bg-gold-50 p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <span>
              <span className="block text-base font-semibold text-navy">
                {warmLeads === 1 ? t('ui.you_have_a_warm_lead') : t('ui.you_have_warm_leads', { warmLeads })}
              </span>
              <span className="block text-sm text-ink-600">
                {warmLeads === 1 ? t('ui.a_business_is') : t('ui.businesses_are')}{' '}{t('ui.interested_in_you_pay_the_fixed')}</span>
            </span>
            <span className="flex shrink-0 items-center gap-2 text-sm font-semibold text-navy">{t('ui.view_warm_leads')}{' '}<ArrowRightIcon className="size-4" />
            </span>
          </Link>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          {stats.map(({ value, label, Icon, bg, fg }) => (
            <div key={label} className={`flex items-center justify-between rounded-lg p-6 ${bg}`}>
              <div>
                <p className="text-3xl font-medium text-ink">{loading ? ', ' : value}</p>
                <p className="mt-1 text-sm text-ink-600">{label}</p>
              </div>
              <span className={`grid size-12 place-items-center rounded-lg bg-surface ${fg}`}>
                <Icon className="size-6" />
              </span>
            </div>
          ))}
        </div>

        <VerificationStatusCard
          audience="expert"
          loading={loading}
          basic={!!candidate?.identity_verified}
          badgeUntil={candidate?.verified_badge_until ?? null}
          awaitingReview={awaitingReview}
          manageTo="/dashboard/verification"
        />

        {!candidate?.biography && (
          <div className="flex flex-col gap-4 rounded-lg bg-danger p-6 text-white sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {candidate?.avatar_path ? (
                <img
                  src={candidate.avatar_path}
                  alt={candidate.full_name ?? t('ui.profile')}
                  className="size-14 shrink-0 rounded-full object-cover ring-2 ring-white/40"
                />
              ) : (
                <span className="grid size-14 shrink-0 place-items-center rounded-full bg-white/20 text-lg font-semibold text-white">
                  {initialsFromName(candidate?.full_name) || 'U'}
                </span>
              )}
              <div>
                <p className="text-lg font-medium">{t('ui.your_profile_editing_is_not_completed')}</p>
                <p className="text-sm text-white/80">{t('ui.complete_your_profile_editing_build_your')}</p>
              </div>
            </div>
            <Link
              to="/dashboard/expert-profile"
              className="flex shrink-0 items-center gap-2 rounded-[4px] bg-surface px-6 py-3 text-sm font-semibold text-brand"
            >{t('ui.edit_profile')}<ArrowRightIcon className="size-4" />
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-ink">{t('ui.recently_applied')}</h2>
            <Link
              to="/dashboard/applied-jobs"
              className="flex items-center gap-1.5 text-sm text-muted-600"
            >{t('ui.view_all_2')}<ArrowRightIcon className="size-4" />
            </Link>
          </div>
          {recent.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-2 rounded-lg bg-surface-alt px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-600 sm:grid-cols-[1fr_auto_auto_auto] sm:gap-8">
                <span>{t('ui.job')}</span>
                <span className="sm:w-[150px]">{t('ui.date_applied')}</span>
                <span>{t('ui.status')}</span>
                <span>{t('ui.action')}</span>
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
              {loading ? t('ui.loading_2') : t('ui.no_applications_yet_browse_jobs_to', { firstName })}
            </p>
          )}
        </div>
        <InviteFriendPanel audience="expert" />
      </div>
    </DashboardLayout>
  )
}
