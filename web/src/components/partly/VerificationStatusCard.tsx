import { Link } from 'react-router-dom'
import { CircleCheckIcon } from '@/components/icons'
import { FullyVerifiedBubble, Pill, PrimaryButton } from '@/components/partly/ui'
import { intlLocale, useT } from '@/lib/i18n'


/**
 * The dashboard's verification tile, shared by Experts and Businesses: where a
 * paid badge shows up after checkout, and the nudge from Basic to Fully verified.
 */
export function VerificationStatusCard({
  audience,
  basic,
  badgeUntil,
  awaitingReview,
  manageTo,
  loading = false,
}: {
  audience: 'business' | 'expert'
  /** Free tier reached: an Expert's ID digits / a Business's registration number. */
  basic: boolean
  /** ISO date the paid badge runs to; live only while in the future. */
  badgeUntil: string | null
  /** Paid, but the document review is still outstanding. */
  awaitingReview: boolean
  manageTo: string
  loading?: boolean
}) {
  const t = useT()
  const dateFmt = new Intl.DateTimeFormat(intlLocale(), { day: 'numeric', month: 'long', year: 'numeric' })
  const full = !!badgeUntil && new Date(badgeUntil) > new Date()

  const heading = loading
    ? ', '
    : full
      ? t('ui.fully_verified')
      : awaitingReview
        ? t('vsc.awaiting')
        : basic
          ? t('ui.basic_verified')
          : t('vsc.not_verified')

  const detail = full
    ? t('vsc.active_until', {
        date: dateFmt.format(new Date(badgeUntil!)),
        detail: audience === 'business' ? t('vsc.shows_postings') : t('vsc.shows_cards'),
      })
    : awaitingReview
      ? t('vsc.paid_msg')
      : basic
        ? audience === 'business'
          ? t('vsc.biz_basic')
          : t('vsc.exp_basic')
        : audience === 'business'
          ? t('vsc.biz_none')
          : t('vsc.exp_none')

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-line p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span
            className={`grid size-12 shrink-0 place-items-center rounded-lg ${
              full ? 'bg-gold text-navy' : 'bg-brand-50 text-brand'
            }`}
          >
            <CircleCheckIcon className="size-6" />
          </span>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-400">{t('ui.verification')}</p>
            <p className="flex flex-wrap items-center gap-2 text-base font-medium text-ink">
              {heading}
              {full && <Pill tone="brand">{t('ui.active')}</Pill>}
              {awaitingReview && !full && <Pill tone="warning">{t('ui.in_review')}</Pill>}
            </p>
            <p className="mt-0.5 max-w-xl text-sm text-muted-600">{detail}</p>
          </div>
        </div>
        <Link to={manageTo} className="shrink-0">
          {full || awaitingReview ? (
            <PrimaryButton className="h-10 bg-brand-50 text-brand hover:bg-brand-100">{t('ui.manage_badge')}</PrimaryButton>
          ) : (
            <PrimaryButton className="h-10">{basic ? t('ui.get_fully_verified') : t('ui.get_verified')}</PrimaryButton>
          )}
        </Link>
      </div>
      {!full && !loading && <FullyVerifiedBubble audience={audience} />}
    </div>
  )
}
