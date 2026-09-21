import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Field, TextInput } from '@/components/dashboard/form'
import { VerificationDocs } from '@/components/partly/VerificationDocs'
import { Card, Notice, Pill, PrimaryButton, SecondaryButton, VerifiedChips } from '@/components/partly/ui'
import { updateMyCandidate } from '@/lib/candidateProfile'
import { useCandidate } from '@/lib/dashboard'
import {
  EXPERT_COUNTRIES,
  ID_TYPE_BY_COUNTRY,
  countryName,
  fetchMyBadges,
  formatLocal,
  formatUsd,
  hasUploadedIdentityDoc,
  saveIdentityDigits,
  startBadgeCheckout,
  usePricing,
  type BadgeRow,
  type ExpertCountry,
  type PayCurrency,
} from '@/lib/partly'
import { confirmCheckout, readCheckoutParams } from '@/lib/stripe'

const BADGE_STATUS_LABEL: Record<string, string> = {
  pending: 'Checkout started',
  awaiting_review: 'Paid — awaiting document review',
  active: 'Active',
  superseded: 'Superseded',
  expired: 'Expired',
  cancelled: 'Cancelled',
}

export function VerificationPage() {
  const { candidate, session, loading, reload } = useCandidate()
  const { pricing } = usePricing()
  const location = useLocation()
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

  useEffect(() => {
    const { outcome, sessionId } = readCheckoutParams(location.search)
    if (!outcome) return
    navigate(location.pathname, { replace: true })
    if (outcome === 'cancelled') {
      toast('Badge purchase cancelled.')
      return
    }
    if (sessionId) {
      confirmCheckout(sessionId).then((ok) => {
        if (ok) toast.success('Payment confirmed.')
        void reload()
      })
    }
  }, [location.search, location.pathname, navigate, reload])

  const price = pricing.find((p) => p.code === (candidate?.country_code ?? country))
  const badgeLive = !!candidate?.verified_badge_until && new Date(candidate.verified_badge_until) > new Date()
  const awaitingReview = badges.some((b) => b.status === 'awaiting_review')
  const hasDigits = !!candidate?.id_type

  async function saveIdentity() {
    if (!session) return
    setSavingId(true)
    try {
      if (last4.length === 4) await saveIdentityDigits(country, last4)
      if (linkedin.trim() !== (candidate?.linkedin_url ?? '')) {
        await updateMyCandidate(session.user.id, { linkedin_url: linkedin.trim() || null })
      }
      toast.success('Saved — you can apply to open needs right away.')
      setLast4('')
      await reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setSavingId(false)
    }
  }

  async function buyBadge() {
    setBuying(true)
    try {
      await startBadgeCheckout(pay)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start checkout')
      setBuying(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex max-w-3xl flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">Verification</h1>
          <p className="mt-1 text-sm text-muted">
            The free basic check is self-serve — just your ID digits, and you can apply right away. The paid
            Verified badge is a stricter check: it needs your ID document too, reviewed by our team.
          </p>
        </div>

        {!loading && candidate && (
          <Notice tone={candidate.identity_verified ? 'success' : 'brand'}>
            <span className="flex flex-wrap items-center gap-2">
              {candidate.identity_verified ? 'Basic verification complete — you can apply to any open need.' : 'Add your ID digits below to start applying.'}
              <VerifiedChips identity={candidate.identity_verified} badge={badgeLive} />
            </span>
          </Notice>
        )}

        {/* 1. Free, self-serve */}
        <Card className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">1 · Basic verification (free)</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Country">
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value as ExpertCountry)}
                disabled={!!candidate?.identity_verified}
                className="h-12 w-full rounded-md border border-line bg-surface px-4 text-base text-ink outline-none focus:border-brand disabled:opacity-60"
              >
                {EXPERT_COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {countryName(c)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={`Last 4 characters of your ${ID_TYPE_BY_COUNTRY[country]}`}>
              <TextInput
                value={last4}
                onChange={(e) => setLast4(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
                placeholder={hasDigits ? '•••• (saved)' : country === 'SG' ? 'e.g. 567D' : 'e.g. 1234'}
                maxLength={4}
                disabled={!!candidate?.identity_verified}
                autoComplete="off"
              />
            </Field>
          </div>
          <Field label="LinkedIn profile (optional)">
            <TextInput value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://www.linkedin.com/in/…" />
          </Field>
          <p className="text-xs text-muted">
            Collected for verification only. The digits are encrypted before they're stored and are never displayed
            back to you, to any business, or to any third party. This is the whole free check — no document needed.
          </p>
          {!candidate?.identity_verified && (
            <PrimaryButton className="w-fit" onClick={saveIdentity} disabled={savingId || last4.length !== 4}>
              {savingId ? 'Saving…' : 'Save & verify'}
            </PrimaryButton>
          )}
        </Card>

        {/* 2. Verified badge */}
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">2 · Verified badge (annual, paid)</h2>
            {badgeLive && candidate?.verified_badge_until && (
              <Pill tone="brand">Active until {new Date(candidate.verified_badge_until).toLocaleDateString()}</Pill>
            )}
            {awaitingReview && <Pill tone="warning">Awaiting document review</Pill>}
          </div>
          <p className="text-sm text-muted">
            A stricter, credential-level check beyond the free basic one. Badge holders are always shown first when a
            business's matches are drawn, and carry the Verified mark on every match card and public profile.
          </p>

          <div className="border-t border-line pt-4">
            <p className="mb-3 text-sm font-medium text-ink">Required: upload your identity document</p>
            {candidate && session && (
              <VerificationDocs
                userId={session.user.id}
                ownerKind="candidate"
                ownerId={candidate.id}
                docType="identity"
                hint="A photo or scan of the ID whose digits you entered above. Reviewed by hand; the badge activates as soon as it's approved."
                onChange={() => {
                  void reload()
                  if (candidate) hasUploadedIdentityDoc(candidate.id).then(setHasDoc)
                }}
              />
            )}
          </div>

          {badgeLive ? (
            <Notice tone="success">
              Your badge is active. We'll remind you 30, 14, 7 and 1 days before it expires; renewing extends your
              current term rather than restarting it.
            </Notice>
          ) : awaitingReview ? (
            <Notice tone="warning">
              Payment received — your badge activates automatically once our team approves your identity document.
            </Notice>
          ) : (
            !hasDoc && <Notice tone="warning">Upload your identity document above before buying the badge.</Notice>
          )}

          {price ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPay('local')}
                className={`rounded-lg border p-4 text-left ${pay === 'local' ? 'border-brand bg-brand-50' : 'border-line'}`}
              >
                <p className="text-xs uppercase tracking-wide text-muted">Pay in {price.currency}</p>
                <p className="mt-1 text-2xl font-semibold text-ink">
                  {formatLocal(price, price.badge_fee_local)} <span className="text-sm font-normal text-muted">/ year</span>
                </p>
                <p className="text-xs text-muted">Fixed {price.name} price</p>
              </button>
              <button
                type="button"
                onClick={() => setPay('usd')}
                className={`rounded-lg border p-4 text-left ${pay === 'usd' ? 'border-brand bg-brand-50' : 'border-line'}`}
              >
                <p className="text-xs uppercase tracking-wide text-muted">Pay in USD</p>
                <p className="mt-1 text-2xl font-semibold text-ink">
                  {formatUsd(price.badge_fee_usd)} <span className="text-sm font-normal text-muted">/ year</span>
                </p>
                <p className="text-xs text-muted">Forex exchange absorbed</p>
              </button>
            </div>
          ) : (
            <p className="text-sm text-muted">Save your country above to see your market's fixed price.</p>
          )}
          <div className="flex items-center gap-3">
            {badgeLive ? (
              <SecondaryButton onClick={buyBadge} disabled={buying || !price || !hasDoc}>
                {buying ? 'Redirecting…' : 'Renew for another year'}
              </SecondaryButton>
            ) : (
              <PrimaryButton onClick={buyBadge} disabled={buying || !price || !hasDoc || awaitingReview}>
                {buying ? 'Redirecting…' : awaitingReview ? 'Payment received' : 'Get the Verified badge'}
              </PrimaryButton>
            )}
          </div>
          {badges.length > 0 && (
            <div className="border-t border-line pt-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Badge history</p>
              <ul className="flex flex-col gap-1 text-sm">
                {badges.map((b) => (
                  <li key={b.id} className="flex items-center justify-between">
                    <span className="text-ink">
                      {b.renewed_from ? 'Renewal' : 'Purchase'} · {b.currency} {b.amount_local.toLocaleString()}
                      {b.purchased_at ? ` · ${new Date(b.purchased_at).toLocaleDateString()}` : ''}
                    </span>
                    <Pill tone={b.status === 'active' ? 'success' : b.status === 'awaiting_review' ? 'warning' : 'neutral'}>
                      {BADGE_STATUS_LABEL[b.status] ?? b.status}
                      {b.expires_at && b.status === 'active' ? ` · until ${new Date(b.expires_at).toLocaleDateString()}` : ''}
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
