import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Field, TextInput } from '@/components/dashboard/form'
import { SelectMenu } from '@/components/app/SelectMenu'
import { PaymentConfirmingOverlay } from '@/components/app/PaymentConfirmingOverlay'
import { VerificationDocs } from '@/components/partly/VerificationDocs'
import { Card, FullyVerifiedBubble, Notice, Pill, PrimaryButton, SecondaryButton, VerifiedChips } from '@/components/partly/ui'
import { updateMyCandidate } from '@/lib/candidateProfile'
import { useCandidate } from '@/lib/dashboard'
import {
  EXPERT_COUNTRIES,
  ID_TYPE_BY_COUNTRY,
  countryName,
  fetchMyBadges,
  formatBoth,
  formatLocal,
  formatPaid,
  renewalOpensOn,
  formatUsd,
  hasUploadedIdentityDoc,
  saveIdentityDigits,
  idLast4Problem,
  ID_LAST4_FORMAT,
  startBadgeCheckout,
  usePricing,
  type BadgeRow,
  type ExpertCountry,
  type PayCurrency,
} from '@/lib/partly'
import { useCheckoutReturn } from '@/lib/useCheckoutReturn'
import { formatDate } from '@/lib/format'
import { tr, useT } from '@/lib/i18n'

const BADGE_STATUS_LABEL: Record<string, string> = {
  get pending() {
    return tr('badge.st.pending')
  },
  get awaiting_review() {
    return tr('badge.st.awaiting_review')
  },
  get active() {
    return tr('badge.st.active')
  },
  get superseded() {
    return tr('badge.st.superseded')
  },
  get expired() {
    return tr('badge.st.expired')
  },
  get cancelled() {
    return tr('badge.st.cancelled')
  },
}

export function VerificationPage() {
  const t = useT()
  const { candidate, session, loading, reload } = useCandidate()
  const { pricing } = usePricing()
  const navigate = useNavigate()

  const [country, setCountry] = useState<ExpertCountry>('SG')
  const [last4, setLast4] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [savingId, setSavingId] = useState(false)
  const [badges, setBadges] = useState<BadgeRow[]>([])
  const [hasDoc, setHasDoc] = useState(false)
  const [pay, setPay] = useState<PayCurrency>('local')
  const [buying, setBuying] = useState(false)

  useEffect(() => {
    if (!candidate) return
    if (candidate.country_code && (EXPERT_COUNTRIES as readonly string[]).includes(candidate.country_code)) {
      setCountry(candidate.country_code as ExpertCountry)
    }
    setLinkedin(candidate.linkedin_url ?? '')
    fetchMyBadges(candidate.id).then(setBadges).catch((err) => console.error('badges', err))
    hasUploadedIdentityDoc(candidate.id).then(setHasDoc).catch(() => setHasDoc(false))
  }, [candidate])

  const { confirming } = useCheckoutReturn({
    successMessage: t('badge.confirmed'),
    successAction: { label: t('ui.view_dashboard'), onClick: () => navigate('/dashboard') },
    cancelledMessage: t('badge.cancelled'),
    onConfirmed: async () => {
      await reload()
      if (candidate) await fetchMyBadges(candidate.id).then(setBadges).catch(() => {})
    },
  })

  const price = pricing.find((p) => p.code === (candidate?.country_code ?? country))
  const badgeLive = !!candidate?.verified_badge_until && new Date(candidate.verified_badge_until) > new Date()
  const awaitingReview = badges.some((b) => b.status === 'awaiting_review')
  // Renewing opens 30 days before expiry -- never straight after paying.
  const renewalOpens = badgeLive ? renewalOpensOn(candidate?.verified_badge_until) : null

  async function saveIdentity() {
    if (!session) return
    setSavingId(true)
    try {
      if (last4.length === 4) {
        const problem = idLast4Problem(country, last4)
        if (problem) throw new Error(problem)
        await saveIdentityDigits(country, last4)
      }
      if (linkedin.trim() !== (candidate?.linkedin_url ?? '')) {
        await updateMyCandidate(session.user.id, { linkedin_url: linkedin.trim() || null })
      }
      toast.success(t('ui.saved_you_can_apply_to_open'))
      setLast4('')
      await reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('ui.could_not_save'))
    } finally {
      setSavingId(false)
    }
  }

  async function buyBadge() {
    setBuying(true)
    try {
      await startBadgeCheckout(pay)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('ui.could_not_start_checkout'))
      setBuying(false)
    }
  }

  return (
    <DashboardLayout>
      {confirming && <PaymentConfirmingOverlay />}
      <div className="flex max-w-3xl flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">{t('ui.verification')}</h1>
          <p className="mt-1 text-sm text-muted">
            <strong>{t('ui.basic_verified')}</strong>{' '}{t('ui.is_free_and_self_serve_just')}<strong>{' '}{t('ui.fully_verified')}</strong>{' '}{t('ui.is_the_paid_annual_badge_a')}</p>
        </div>

        {!loading && candidate && (
          <Notice tone={candidate.identity_verified ? 'success' : 'brand'}>
            <span className="flex flex-wrap items-center gap-2">
              {candidate.identity_verified ? t('ui.you_re_basic_verified_you_can') : t('ui.add_your_id_digits_below_to')}
              <VerifiedChips identity={candidate.identity_verified} badge={badgeLive} />
            </span>
          </Notice>
        )}

        {/* 1. Free, self-serve */}
        <Card className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t('ui.1_basic_verification_free')}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('ui.country')}>
              <SelectMenu
                value={country}
                onChange={(v) => setCountry(v as ExpertCountry)}
                disabled={!!candidate?.identity_verified}
                options={EXPERT_COUNTRIES.map((c) => ({ value: c, label: countryName(c) }))}
              />
            </Field>
            <Field label={t('ui.last_4_characters_of_your_2', { v: ID_TYPE_BY_COUNTRY[country] })}>
              <TextInput
                value={last4}
                onChange={(e) => setLast4(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
                placeholder={candidate?.identity_verified ? '••••' : `e.g. ${ID_LAST4_FORMAT[country].example}`}
                maxLength={4}
                disabled={!!candidate?.identity_verified}
                autoComplete="off"
              />
            </Field>
          </div>
          <Field label={t('ui.linkedin_profile_optional')}>
            <TextInput value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder={t('ui.https_www_linkedin_com_in')} />
          </Field>
          <p className="text-xs text-muted">{t('ui.collected_for_verification_only_the_digits')}</p>
          {candidate?.identity_verified && (
            <p className="text-sm font-semibold text-emerald-700">{t('ui.basic_verified_your_id_digits_are')}</p>
          )}
          {!candidate?.identity_verified && (
            <PrimaryButton className="w-fit" onClick={saveIdentity} disabled={savingId || last4.length !== 4}>
              {savingId ? t('ui.saving') : t('ui.save_verify')}
            </PrimaryButton>
          )}
        </Card>

        {/* 2. Verified badge */}
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t('ui.2_fully_verified_badge_annual_paid')}</h2>
            {badgeLive && candidate?.verified_badge_until && (
              <Pill tone="brand">{t('ui.active_until', { verified_badge_until: formatDate(candidate.verified_badge_until) })}</Pill>
            )}
            {awaitingReview && <Pill tone="warning">{t('ui.awaiting_document_review')}</Pill>}
          </div>
          <p className="text-sm text-muted">{t('ui.a_stricter_credential_level_check_beyond')}</p>
          <FullyVerifiedBubble audience="expert" />

          <div className="border-t border-line pt-4">
            <p className="mb-3 text-sm font-medium text-ink">{t('ui.required_upload_your_identity_document')}</p>
            {candidate && session && (
              <VerificationDocs
                userId={session.user.id}
                ownerKind="candidate"
                ownerId={candidate.id}
                docType="identity"
                hint={t('ui.a_photo_or_scan_of_the')}
                onChange={() => {
                  void reload()
                  if (candidate) hasUploadedIdentityDoc(candidate.id).then(setHasDoc)
                }}
              />
            )}
          </div>

          {badgeLive ? (
            <Notice tone="success">{t('ui.your_fully_verified_badge_is_active')}</Notice>
          ) : awaitingReview ? (
            <Notice tone="warning">{t('ui.payment_received_your_badge_activates_automatically')}</Notice>
          ) : (
            !hasDoc && <Notice tone="warning">{t('ui.upload_your_identity_document_above_before')}</Notice>
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
            <p className="text-sm text-muted">{t('ui.save_your_country_above_to_see')}</p>
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
                      {BADGE_STATUS_LABEL[b.status] ?? b.status}
                      {b.expires_at && b.status === 'active' ? t('ui.until', { expires_at: formatDate(b.expires_at) }) : ''}
                    </Pill>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
