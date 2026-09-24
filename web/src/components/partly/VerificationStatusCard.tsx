import { Link } from 'react-router-dom'
import { CircleCheckIcon } from '@/components/icons'
import { FullyVerifiedBubble, Pill, PrimaryButton } from '@/components/partly/ui'

const dateFmt = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long', year: 'numeric' })

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
  const full = !!badgeUntil && new Date(badgeUntil) > new Date()

  const heading = loading
    ? '—'
    : full
      ? 'Fully verified'
      : awaitingReview
        ? 'Payment received — awaiting review'
        : basic
          ? 'Basic verified'
          : 'Not verified yet'

  const detail = full
    ? `Your Fully verified badge is active until ${dateFmt.format(new Date(badgeUntil!))}. ${
        audience === 'business'
          ? 'It shows on every posting you make.'
          : 'It shows on every match card and your public profile, with priority in match ranking.'
      }`
    : awaitingReview
      ? 'Your payment is confirmed. The Fully verified badge switches on as soon as our team approves your document.'
      : basic
        ? audience === 'business'
          ? 'Your registration number is on file. Upload your registration document and activate the annual badge to become Fully verified.'
          : 'Your ID check is done. Upload your ID document and activate the annual badge to become Fully verified.'
        : audience === 'business'
          ? 'Add your business registration number to get the Basic verified mark.'
          : 'Add your ID digits to get the Basic verified mark and start applying.'

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
            <p className="text-xs uppercase tracking-wide text-muted-400">Verification</p>
            <p className="flex flex-wrap items-center gap-2 text-base font-medium text-ink">
              {heading}
              {full && <Pill tone="brand">Active</Pill>}
              {awaitingReview && !full && <Pill tone="warning">In review</Pill>}
            </p>
            <p className="mt-0.5 max-w-xl text-sm text-muted-600">{detail}</p>
          </div>
        </div>
        <Link to={manageTo} className="shrink-0">
          {full || awaitingReview ? (
            <PrimaryButton className="h-10 bg-brand-50 text-brand hover:bg-brand-100">Manage badge</PrimaryButton>
          ) : (
            <PrimaryButton className="h-10">{basic ? 'Get Fully verified' : 'Get verified'}</PrimaryButton>
          )}
        </Link>
      </div>
      {!full && !loading && <FullyVerifiedBubble audience={audience} />}
    </div>
  )
}
