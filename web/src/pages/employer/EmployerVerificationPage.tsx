import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { EmployerDashboardLayout } from '@/components/dashboard/EmployerDashboardLayout'
import { Field, TextInput } from '@/components/dashboard/form'
import { SelectMenu } from '@/components/app/SelectMenu'
import { PaymentConfirmingOverlay } from '@/components/app/PaymentConfirmingOverlay'
import { VerificationDocs } from '@/components/partly/VerificationDocs'
import { Card, FullyVerifiedBubble, Notice, Pill, PrimaryButton, SecondaryButton, VerifiedChips } from '@/components/partly/ui'
import { updateMyEmployer, useEmployer } from '@/lib/employers'
import {
  COUNTRY_NAMES,
  fetchMyEmployerBadges,
  formatBoth,
  formatLocal,
  formatPaid,
  renewalOpensOn,
  formatUsd,
  hasUploadedRegistrationDoc,
  startEmployerBadgeCheckout,
  usePricing,
  validateBusinessRegNo,
  type BadgeRow,
  type PayCurrency,
} from '@/lib/partly'
import { useCheckoutReturn } from '@/lib/useCheckoutReturn'
import { formatDate } from '@/lib/format'
import { useT } from '@/lib/i18n'
import { badgeStatusLabel } from '@/lib/optionLabels'

export function EmployerVerificationPage() {
  const t = useT()
  const { employer, session, loading, reload } = useEmployer()
  const { pricing } = usePricing()
  const navigate = useNavigate()
  const [regNo, setRegNo] = useState('')
  const [country, setCountry] = useState('SG')
  const [saving, setSaving] = useState(false)
  const [badges, setBadges] = useState<BadgeRow[]>([])
  const [hasDoc, setHasDoc] = useState(false)
  const [pay, setPay] = useState<PayCurrency>('local')
  const [buying, setBuying] = useState(false)

  useEffect(() => {
    if (employer) {
      setRegNo(employer.reg_no ?? '')
      setCountry(employer.country_code ?? 'SG')
      fetchMyEmployerBadges(employer.id).then(setBadges).catch((err) => console.error('employer badges', err))
      hasUploadedRegistrationDoc(employer.id).then(setHasDoc).catch(() => setHasDoc(false))
    }
  }, [employer])

  const { confirming } = useCheckoutReturn({
    successMessage: t('badge.confirmed'),
    successAction: { label: t('ui.view_dashboard'), onClick: () => navigate('/employer/dashboard') },
    cancelledMessage: t('badge.cancelled'),
    onConfirmed: async () => {
      await reload()
      if (employer) await fetchMyEmployerBadges(employer.id).then(setBadges).catch(() => {})
    },
  })

  async function save() {
    if (!employer) return
    const regError = validateBusinessRegNo(country, regNo)
    if (regError) return toast.error(regError)
    setSaving(true)
    try {
      await updateMyEmployer(employer.id, { reg_no: regNo.trim(), country_code: country })
      toast.success(t('ui.saved'))
      await reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('ui.could_not_save'))
    } finally {
      setSaving(false)
    }
  }

  async function buyBadge() {
    setBuying(true)
    try {
      await startEmployerBadgeCheckout(pay)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('ui.could_not_start_checkout'))
      setBuying(false)
    }
  }

  const price = pricing.find((p) => p.code === (employer?.country_code ?? country))
  const badgeLive = !!employer?.verified_badge_until && new Date(employer.verified_badge_until) > new Date()
  const awaitingReview = badges.some((b) => b.status === 'awaiting_review')
  // Renewing opens 30 days before expiry -- never straight after paying.
  const renewalOpens = badgeLive ? renewalOpensOn(employer?.verified_badge_until) : null

  return (
    <EmployerDashboardLayout>
      {confirming && <PaymentConfirmingOverlay />}
      <div className="flex max-w-3xl flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">{t('ui.business_verification')}</h1>
          <p className="mt-1 text-sm text-muted">
            <strong>{t('ui.basic_verified')}</strong>{' '}{t('ui.is_free_your_registration_number_from')}<strong>{' '}{t('ui.fully_verified')}</strong>{' '}{t('ui.is_the_paid_annual_badge_our')}</p>
        </div>

        {!loading && employer && (
          <Notice tone={badgeLive ? 'success' : 'brand'}>
            <span className="flex flex-wrap items-center gap-2">
              {badgeLive
                ? t('ui.your_business_is_fully_verified')
                : awaitingReview
                  ? t('ui.payment_received_your_fully_verified_badge')
                  : employer.basic_verified
                    ? t('ui.your_business_is_basic_verified_upload')
                    : t('ui.add_your_registration_number_below_to')}
              <VerifiedChips identity={employer.basic_verified} badge={badgeLive} />
            </span>
          </Notice>
        )}

        <Card className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t('ui.1_basic_verification_free')}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('ui.country_of_registration')}>
              <SelectMenu
                value={country}
                onChange={setCountry}
                options={Object.entries(COUNTRY_NAMES).map(([code, name]) => ({ value: code, label: name }))}
              />
            </Field>
            <Field label={t('ui.business_registration_number')}>
              <TextInput value={regNo} onChange={(e) => setRegNo(e.target.value)} placeholder={t('ui.e_g_202412345k_uen_1234567_x')} />
            </Field>
          </div>
          <p className="text-xs text-muted">{t('ui.the_format_varies_by_country_enter')}</p>
          <PrimaryButton className="w-fit" onClick={save} disabled={saving || !regNo.trim()}>
            {saving ? t('ui.saving') : t('ui.save_details')}
          </PrimaryButton>
        </Card>

        {employer && session && (
          <Card className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t('ui.2_registration_document_for_fully_verified')}</h2>
            <VerificationDocs
              userId={session.user.id}
              ownerKind="employer"
              ownerId={employer.id}
              docType="business_registration"
              hint={t('ui.a_copy_of_your_business_registration')}
              onChange={() => {
                void reload()
                if (employer) hasUploadedRegistrationDoc(employer.id).then(setHasDoc)
              }}
            />
          </Card>
        )}

        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t('ui.3_fully_verified_badge_annual_paid')}</h2>
            {badgeLive && employer?.verified_badge_until && (
              <Pill tone="brand">{t('ui.active_until', { verified_badge_until: formatDate(employer.verified_badge_until) })}</Pill>
            )}
          </div>
          <p className="text-sm text-muted">{t('ui.same_fixed_fee_as_the_expert')}</p>
          <FullyVerifiedBubble audience="business" />
          {badgeLive ? (
            <Notice tone="success">{t('ui.your_fully_verified_badge_is_active_2')}</Notice>
          ) : awaitingReview ? (
            <Notice tone="warning">{t('ui.payment_received_your_badge_activates_automatically_2')}</Notice>
          ) : (
            !hasDoc && <Notice tone="warning">{t('ui.upload_your_registration_document_above_before')}</Notice>
          )}
          {price && (
            <p className="text-sm font-medium text-ink">{t('ui.annual_fee', { badge_fee_usd: formatBoth(price, price.badge_fee_local, price.badge_fee_usd) })}</p>
          )}
          {price ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPay('local')}
                className={`rounded-lg border p-4 text-left ${pay === 'local' ? 'border-brand bg-brand-50' : 'border-line'}`}
              >
                <p className="text-xs uppercase tracking-wide text-muted">{t('ui.pay_in', { currency: price.currency })}</p>
                <p className="mt-1 text-2xl font-semibold text-ink">
                  {formatLocal(price, price.badge_fee_local)} <span className="text-sm font-normal text-muted">{t('ui.year_2')}</span>
                </p>
                <p className="text-xs text-muted">{t('ui.fixed_price', { name: price.name })}</p>
              </button>
              <button
                type="button"
                onClick={() => setPay('usd')}
                className={`rounded-lg border p-4 text-left ${pay === 'usd' ? 'border-brand bg-brand-50' : 'border-line'}`}
              >
                <p className="text-xs uppercase tracking-wide text-muted">{t('ui.pay_in_usd')}</p>
                <p className="mt-1 text-2xl font-semibold text-ink">
                  {formatUsd(price.badge_fee_usd)} <span className="text-sm font-normal text-muted">{t('ui.year_2')}</span>
                </p>
                <p className="text-xs text-muted">{t('ui.forex_exchange_absorbed')}</p>
              </button>
            </div>
          ) : (
            <p className="text-sm text-muted">{t('ui.save_your_country_of_registration_above')}</p>
          )}
          <div className="flex items-center gap-3">
            {badgeLive ? (
              <>
                <SecondaryButton onClick={buyBadge} disabled={buying || !price || !hasDoc || !!renewalOpens || awaitingReview}>
                  {buying ? t('ui.redirecting') : t('ui.renew_for_another_year')}
                </SecondaryButton>
                {renewalOpens && (
                  <span className="text-xs text-muted">{t('ui.renewal_opens_30_days_before_your', { v: formatDate(renewalOpens.toISOString()) })}</span>
                )}
              </>
            ) : (
              <PrimaryButton onClick={buyBadge} disabled={buying || !price || !hasDoc || awaitingReview}>
                {buying ? t('ui.redirecting') : awaitingReview ? t('ui.payment_received') : t('ui.get_fully_verified')}
              </PrimaryButton>
            )}
          </div>
          {badges.length > 0 && (
            <div className="border-t border-line pt-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{t('ui.badge_history')}</p>
              <ul className="flex flex-col gap-1 text-sm">
                {badges.map((b) => (
                  <li key={b.id} className="flex items-center justify-between">
                    <span className="text-ink">
                      {b.renewed_from ? t('ui.renewal') : t('ui.purchase')} · {formatPaid(pricing.find((p) => p.code === b.country_code), b)}
                      {b.purchased_at ? ` · ${formatDate(b.purchased_at)}` : ''}
                    </span>
                    <Pill tone={b.status === 'active' ? 'success' : b.status === 'awaiting_review' ? 'warning' : 'neutral'}>
                      {b.status === 'awaiting_review' ? t('ui.paid_awaiting_document_review') : badgeStatusLabel(b.status)}
                      {b.expires_at && b.status === 'active' ? t('ui.until', { expires_at: formatDate(b.expires_at) }) : ''}
                    </Pill>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>
    </EmployerDashboardLayout>
  )
}
