import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { InviteFriendPanel } from '@/components/partly/InviteFriendPanel'
import { RatingWidget } from '@/components/partly/RatingWidget'
import { GlobeIcon, MailIcon, MapPinIcon, PhoneIcon } from '@/components/icons'
import { Card, Countdown, EmptyState, Notice, Pill, PrimaryButton, StarRating } from '@/components/partly/ui'
import { RichTextContent } from '@/components/editor/RichTextContent'
import { PaymentConfirmingOverlay } from '@/components/app/PaymentConfirmingOverlay'
import { useCandidate } from '@/lib/dashboard'
import {
  countryName,
  fetchLead,
  fetchLeadContact,
  formatBoth,
  formatLocal,
  formatUsd,
  projectTypeLabel,
  startLeadUnlock,
  usePricing,
  type ExpertContact,
  type LeadRow,
  type PayCurrency,
} from '@/lib/partly'
import { useCheckoutReturn } from '@/lib/useCheckoutReturn'
import { formatDateTime } from '@/lib/format'
import { formatStoredPhone } from '@/lib/phone'
import { useT } from '@/lib/i18n'

export function LeadUnlockPage() {
  const t = useT()
  const { id = '' } = useParams()
  const { candidate, loading: candidateLoading } = useCandidate()
  const { pricing } = usePricing()
  const [lead, setLead] = useState<LeadRow | null>(null)
  const [contact, setContact] = useState<ExpertContact | null>(null)
  const [pay, setPay] = useState<PayCurrency>('local')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const l = await fetchLead(id)
      setLead(l)
      setContact(l?.status === 'paid' ? await fetchLeadContact(id) : null)
    } catch (err) {
      console.error('lead', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  // Return from Stripe: confirm server-side so the contact appears immediately.
  const { confirming } = useCheckoutReturn({
    successMessage: t('lu.unlocked'),
    cancelledMessage: t('lu.cancelled'),
    onConfirmed: load,
  })

  const price = pricing.find((p) => p.code === candidate?.country_code)

  async function handlePay() {
    setBusy(true)
    try {
      await startLeadUnlock(id, pay)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('ui.could_not_start_payment'))
      setBusy(false)
    }
  }

  if (loading || candidateLoading) {
    return (
      <DashboardLayout>
        <p className="text-sm text-muted">{t('ui.loading_2')}</p>
      </DashboardLayout>
    )
  }
  if (!lead) {
    return (
      <DashboardLayout>
        <EmptyState>{t('ui.lead_not_found')}</EmptyState>
      </DashboardLayout>
    )
  }

  const job = lead.job

  return (
    <DashboardLayout>
      {confirming && <PaymentConfirmingOverlay />}
      <div className="flex max-w-2xl flex-col gap-5">
        <Link to="/dashboard/leads" className="text-xs text-muted hover:text-brand">{t('ui.warm_leads_2')}</Link>

        {/* Only what the expert already saw when applying -- nothing more. */}
        <Card className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-ink">{job?.title ?? t('ui.released_lead')}</h1>
          <div className="flex flex-wrap gap-2 text-sm">
            <Pill>{job?.category ?? t('ui.category')}</Pill>
            <Pill>{countryName(job?.country)}</Pill>
            <Pill>{projectTypeLabel(job?.project_type)}</Pill>
          </div>
          {job?.description && (
            <div className="mt-2 border-t border-line pt-3">
              <RichTextContent html={job.description} />
            </div>
          )}
          {job?.slug && (
            <Link to={`/job/${job.slug}`} className="mt-1 w-fit text-sm font-medium text-brand hover:underline">{t('ui.view_the_full_job_posting')}</Link>
          )}
          {lead.others_released > 0 && lead.status === 'awaiting_payment' && (
            <p className="mt-1 text-xs text-amber-800">{t('ui.this_business_also_released_contact_to', { others_released: lead.others_released })}{lead.others_released === 1 ? '' : t('ui.plural_s')}{' '}{t('ui.you_are_one_of_being_considered', { cohort_size: lead.cohort_size })}</p>
          )}
        </Card>

        {lead.status === 'paid' && (
          <Card className="border-emerald-200 bg-emerald-50/40">
            <h2 className="font-semibold text-ink">{t('ui.business_contact')}</h2>
            {contact ? (
              <>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <p className="text-lg font-medium text-ink">{contact.company_name}</p>
                  <StarRating value={contact.employer_avg_stars} count={contact.employer_rating_count} />
                </div>
                <div className="mt-3 flex flex-col gap-2 text-sm">
                  <a href={`mailto:${contact.business_email}`} className="flex items-center gap-2 text-ink hover:text-brand">
                    <MailIcon className="size-4 text-muted" /> {contact.business_email}
                  </a>
                  {contact.phone && (
                    <span className="flex items-center gap-2 text-ink">
                      <PhoneIcon className="size-4 text-muted" /> {formatStoredPhone(contact.phone)}
                    </span>
                  )}
                  {contact.website && (
                    <a href={contact.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-ink hover:text-brand">
                      <GlobeIcon className="size-4 text-muted" /> {contact.website}
                    </a>
                  )}
                  {contact.location && (
                    <span className="flex items-center gap-2 text-ink">
                      <MapPinIcon className="size-4 text-muted" /> {contact.location}
                    </span>
                  )}
                </div>
                <Notice tone="warning">{t('ui.these_details_are_visible_until')}{' '}<strong>{formatDateTime(contact.contact_expires_at)}</strong>{t('ui.5_calendar_days_for_security_and')}</Notice>
                <div className="mt-4">
                  <RatingWidget releaseId={id} raterKind="candidate" raterLabel={t('ui.this_business')} />
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">{t('ui.the_5_day_contact_window_has')}</p>
            )}
          </Card>
        )}

        {lead.status === 'paid' && contact && <InviteFriendPanel audience="expert" />}

        {lead.status === 'awaiting_payment' && lead.window_open && (
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold text-ink">{t('ui.pay_to_unlock_contact')}</h2>
              <Countdown until={lead.window_expires_at} />
            </div>
            <p className="text-sm text-muted">{t('ui.a_fixed_fee_unlocks_the_business')}</p>
            {price && (
              <p className="text-sm font-medium text-ink">{t('ui.unlock_fee', { lead_fee_usd: formatBoth(price, price.lead_fee_local, price.lead_fee_usd) })}</p>
            )}

            {!price ? (
              <Notice tone="warning">{t('ui.set_your_country_on_the')}<Link to="/dashboard/verification" className="underline">{t('ui.verification_page')}</Link>{t('ui.so_we_can_show_your_market')}</Notice>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPay('local')}
                  className={`rounded-lg border p-4 text-left ${pay === 'local' ? 'border-brand bg-brand-50' : 'border-line'}`}
                >
                  <p className="text-xs uppercase tracking-wide text-muted">{t('ui.pay_in', { currency: price.currency })}</p>
                  <p className="mt-1 text-2xl font-semibold text-ink">{formatLocal(price, price.lead_fee_local)}</p>
                  <p className="text-xs text-muted">{t('ui.fixed_price', { name: price.name })}</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPay('usd')}
                  className={`rounded-lg border p-4 text-left ${pay === 'usd' ? 'border-brand bg-brand-50' : 'border-line'}`}
                >
                  <p className="text-xs uppercase tracking-wide text-muted">{t('ui.pay_in_usd')}</p>
                  <p className="mt-1 text-2xl font-semibold text-ink">{formatUsd(price.lead_fee_usd)}</p>
                  <p className="text-xs text-muted">{t('ui.forex_exchange_absorbed')}</p>
                </button>
              </div>
            )}

            <PrimaryButton onClick={handlePay} disabled={busy || !price} className="w-full">
              {busy ? t('ui.redirecting_to_payment') : t('ui.pay_to_unlock_contact_2')}
            </PrimaryButton>
            <p className="text-center text-xs text-muted">{t('ui.secure_checkout_by_stripe_if_you')}</p>
          </Card>
        )}

        {lead.status === 'awaiting_payment' && !lead.window_open && (
          <Notice tone="brand" title={t('ui.the_window_has_closed')}>{t('ui.this_lead_went_cold_you_were')}</Notice>
        )}
        {(lead.status === 'cold' || lead.status === 'job_closed') && (
          <Notice tone="brand" title={lead.status === 'job_closed' ? t('ui.lead_went_cold_job_closed') : t('ui.lead_went_cold')}>
            {lead.ended_reason ?? t('ui.the_window_closed_before_payment')}{' '}{t('ui.you_were_not_charged_this_is')}</Notice>
        )}
      </div>
    </DashboardLayout>
  )
}
