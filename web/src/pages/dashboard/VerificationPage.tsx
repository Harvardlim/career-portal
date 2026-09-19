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
  saveIdentityDigits,
  startBadgeCheckout,
  usePricing,
  type BadgeRow,
  type ExpertCountry,
  type PayCurrency,
} from '@/lib/partly'
import { confirmCheckout, readCheckoutParams } from '@/lib/stripe'

export function VerificationPage() {
  const { candidate, session, loading, reload } = useCandidate()
  const { pricing } = usePricing()
  const location = useLocation()
  const navigate = useNavigate()

  const [country, setCountry] = useState<ExpertCountry>('SG')
  const [last5, setLast5] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [savingId, setSavingId] = useState(false)
  const [badges, setBadges] = useState<BadgeRow[]>([])
  const [pay, setPay] = useState<PayCurrency>('local')
  const [buying, setBuying] = useState(false)

  useEffect(() => {
    if (!candidate) return
    if (candidate.country_code && (EXPERT_COUNTRIES as readonly string[]).includes(candidate.country_code)) {
      setCountry(candidate.country_code as ExpertCountry)
    }
    setLinkedin(candidate.linkedin_url ?? '')
    fetchMyBadges(candidate.id).then(setBadges).catch((err) => console.error('badges', err))
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
        if (ok) toast.success('Your Verified badge is active.')
        void reload()
      })
    }
  }, [location.search, location.pathname, navigate, reload])

  const price = pricing.find((p) => p.code === (candidate?.country_code ?? country))
  const badgeLive = !!candidate?.verified_badge_until && new Date(candidate.verified_badge_until) > new Date()
  const hasDigits = !!candidate?.id_type

  async function saveIdentity() {
    if (!session) return
    setSavingId(true)
    try {
      if (last5.length === 5) await saveIdentityDigits(country, last5)
      if (linkedin.trim() !== (candidate?.linkedin_url ?? '')) {
        await updateMyCandidate(session.user.id, { linkedin_url: linkedin.trim() || null })
      }
      toast.success('Saved. Your ID digits are encrypted and never shown to anyone.')
      setLast5('')
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
            Every expert verifies their identity before applying to any project. The optional Verified badge adds a
            credential-level check and priority in match ranking.
          </p>
        </div>

        {!loading && candidate && (
          <Notice tone={candidate.identity_verified ? 'success' : 'brand'}>
            <span className="flex flex-wrap items-center gap-2">
              {candidate.identity_verified
                ? 'Your identity is verified.'
                : hasDigits
                  ? 'ID details saved — upload your ID document below to complete verification.'
                  : 'Start by adding your ID details below.'}
              <VerifiedChips identity={candidate.identity_verified} badge={badgeLive} />
            </span>
          </Notice>
        )}

        {/* 1. Identity */}
        <Card className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">1 · Identity check (free)</h2>
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
            <Field label={`Last 5 characters of your ${ID_TYPE_BY_COUNTRY[country]}`}>
              <TextInput
                value={last5}
                onChange={(e) => setLast5(e.target.value.toUpperCase().slice(0, 5))}
                placeholder={hasDigits ? '••••• (saved)' : 'e.g. 1234A'}
                maxLength={5}
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
            back to you, to any business, or to any third party.
          </p>
          {!candidate?.identity_verified && (
            <PrimaryButton className="w-fit" onClick={saveIdentity} disabled={savingId || (last5.length !== 5 && !hasDigits)}>
              {savingId ? 'Saving…' : hasDigits && last5.length !== 5 ? 'Save LinkedIn' : 'Save ID details'}
            </PrimaryButton>
          )}
          {candidate && session && (
            <div className="border-t border-line pt-4">
              <VerificationDocs
                userId={session.user.id}
                ownerKind="candidate"
                ownerId={candidate.id}
                docType="identity"
                hint="A photo or scan of the same ID. Reviewed by hand; approval usually takes a business day."
                onChange={reload}
              />
            </div>
          )}
        </Card>

        {/* 2. Verified badge */}
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">2 · Verified badge (annual, optional)</h2>
            {badgeLive && candidate?.verified_badge_until && (
              <Pill tone="brand">Active until {new Date(candidate.verified_badge_until).toLocaleDateString()}</Pill>
            )}
          </div>
          <p className="text-sm text-muted">
            A paid credential-level verification, beyond the free identity check. Badge holders are ranked first when
            a business's matches are drawn, and carry the Verified mark on every match card and public profile.
          </p>
          {badgeLive ? (
            <Notice tone="success">
              Your badge is active. We'll remind you 30, 14, 7 and 1 days before it expires; renewing extends your
              current term rather than restarting it.
            </Notice>
          ) : (
            !candidate?.identity_verified && (
              <Notice tone="warning">Complete the free identity check first — the badge builds on it.</Notice>
            )
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
              <SecondaryButton onClick={buyBadge} disabled={buying || !price}>
                {buying ? 'Redirecting…' : 'Renew for another year'}
              </SecondaryButton>
            ) : (
              <PrimaryButton onClick={buyBadge} disabled={buying || !price || !candidate?.identity_verified}>
                {buying ? 'Redirecting…' : 'Get the Verified badge'}
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
                    <Pill tone={b.status === 'active' ? 'success' : b.status === 'pending' ? 'warning' : 'neutral'}>
                      {b.status}
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
