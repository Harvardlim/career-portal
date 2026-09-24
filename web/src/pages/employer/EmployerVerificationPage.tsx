import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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
  formatUsd,
  hasUploadedRegistrationDoc,
  startEmployerBadgeCheckout,
  usePricing,
  validateBusinessRegNo,
  type BadgeRow,
  type PayCurrency,
} from '@/lib/partly'
import { confirmCheckout, readCheckoutParams } from '@/lib/stripe'

export function EmployerVerificationPage() {
  const { employer, session, loading, reload } = useEmployer()
  const { pricing } = usePricing()
  const location = useLocation()
  const navigate = useNavigate()
  const [regNo, setRegNo] = useState('')
  const [country, setCountry] = useState('SG')
  const [saving, setSaving] = useState(false)
  const [badges, setBadges] = useState<BadgeRow[]>([])
  const [hasDoc, setHasDoc] = useState(false)
  const [pay, setPay] = useState<PayCurrency>('local')
  const [buying, setBuying] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (employer) {
      setRegNo(employer.reg_no ?? '')
      setCountry(employer.country_code ?? 'SG')
      fetchMyEmployerBadges(employer.id).then(setBadges).catch((err) => console.error('employer badges', err))
      hasUploadedRegistrationDoc(employer.id).then(setHasDoc).catch(() => setHasDoc(false))
    }
  }, [employer])

  useEffect(() => {
    const { outcome, sessionId } = readCheckoutParams(location.search)
    if (!outcome) return
    navigate(location.pathname, { replace: true })
    if (outcome === 'cancelled') {
      toast('Badge purchase cancelled.')
      return
    }
    if (sessionId) {
      setConfirming(true)
      confirmCheckout(sessionId)
        .then(async (ok) => {
          if (ok) toast.success('Payment confirmed — your badge status is on your dashboard.', { action: { label: 'View dashboard', onClick: () => navigate('/employer/dashboard') } })
          await reload()
          if (employer) await fetchMyEmployerBadges(employer.id).then(setBadges).catch(() => {})
        })
        .finally(() => setConfirming(false))
    }
  }, [location.search, location.pathname, navigate, reload, employer])

  async function save() {
    if (!employer || !regNo.trim()) return
    const regError = validateBusinessRegNo(country, regNo)
    if (regError) return toast.error(regError)
    setSaving(true)
    try {
      await updateMyEmployer(employer.id, { reg_no: regNo.trim(), country_code: country })
      toast.success('Saved.')
      await reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  async function buyBadge() {
    setBuying(true)
    try {
      await startEmployerBadgeCheckout(pay)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start checkout')
      setBuying(false)
    }
  }

  const price = pricing.find((p) => p.code === (employer?.country_code ?? country))
  const badgeLive = !!employer?.verified_badge_until && new Date(employer.verified_badge_until) > new Date()
  const awaitingReview = badges.some((b) => b.status === 'awaiting_review')

  return (
    <EmployerDashboardLayout>
      {confirming && <PaymentConfirmingOverlay />}
      <div className="flex max-w-3xl flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">Business verification</h1>
          <p className="mt-1 text-sm text-muted">
            <strong>Basic verified</strong> is free — your registration number from sign-up is all it takes to post.
            <strong> Fully verified</strong> is the paid annual badge: our team checks your registration document by
            hand and your profile carries the Fully verified mark. You can be based anywhere in the world.
          </p>
        </div>

        {!loading && employer && (
          <Notice tone={badgeLive ? 'success' : 'brand'}>
            <span className="flex flex-wrap items-center gap-2">
              {badgeLive
                ? 'Your business is Fully verified.'
                : awaitingReview
                  ? 'Payment received — your Fully verified badge activates once your registration document is approved.'
                  : employer.basic_verified
                    ? 'Your business is Basic verified. Upload your registration document and activate the badge to become Fully verified.'
                    : 'Add your registration number below to become Basic verified.'}
              <VerifiedChips identity={employer.basic_verified} badge={badgeLive} />
            </span>
          </Notice>
        )}

        <Card className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">1 · Basic verification (free)</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Country of registration">
              <SelectMenu
                value={country}
                onChange={setCountry}
                options={Object.entries(COUNTRY_NAMES).map(([code, name]) => ({ value: code, label: name }))}
              />
            </Field>
            <Field label="Business registration number">
              <TextInput value={regNo} onChange={(e) => setRegNo(e.target.value)} placeholder="e.g. 202412345K (UEN), 1234567-X (SSM)…" />
            </Field>
          </div>
          <p className="text-xs text-muted">The format varies by country — enter it exactly as it appears on your registration.</p>
          <PrimaryButton className="w-fit" onClick={save} disabled={saving || !regNo.trim()}>
            {saving ? 'Saving…' : 'Save details'}
          </PrimaryButton>
        </Card>

        {employer && session && (
          <Card className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">2 · Registration document (for Fully verified)</h2>
            <VerificationDocs
              userId={session.user.id}
              ownerKind="employer"
              ownerId={employer.id}
              docType="business_registration"
              hint="A copy of your business registration certificate or company profile (PDF or image)."
              onChange={() => {
                void reload()
                if (employer) hasUploadedRegistrationDoc(employer.id).then(setHasDoc)
              }}
            />
          </Card>
        )}

        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">3 · Fully verified badge (annual, paid)</h2>
            {badgeLive && employer?.verified_badge_until && (
              <Pill tone="brand">Active until {new Date(employer.verified_badge_until).toLocaleDateString()}</Pill>
            )}
          </div>
          <p className="text-sm text-muted">
            Same fixed fee as the Expert badge. Pay now and the badge switches on as soon as our team approves your
            registration document — that approval is your business's identity check, the same way an Expert's ID
            document works.
          </p>
          <FullyVerifiedBubble audience="business" />
          {badgeLive ? (
            <Notice tone="success">Your Fully verified badge is active and shows on your dashboard and postings.</Notice>
          ) : awaitingReview ? (
            <Notice tone="warning">
              Payment received — your badge activates automatically once our team approves your registration document.
            </Notice>
          ) : (
            !hasDoc && <Notice tone="warning">Upload your registration document above before buying the badge.</Notice>
          )}
          {price && (
            <p className="text-sm font-medium text-ink">
              Annual fee: {formatBoth(price, price.badge_fee_local, price.badge_fee_usd)}
            </p>
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
            <p className="text-sm text-muted">Save your country of registration above to see your market's fixed price.</p>
          )}
          <div className="flex items-center gap-3">
            {badgeLive ? (
              <SecondaryButton onClick={buyBadge} disabled={buying || !price || !hasDoc}>
                {buying ? 'Redirecting…' : 'Renew for another year'}
              </SecondaryButton>
            ) : (
              <PrimaryButton onClick={buyBadge} disabled={buying || !price || !hasDoc || awaitingReview}>
                {buying ? 'Redirecting…' : awaitingReview ? 'Payment received' : 'Get Fully verified'}
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
                      {b.renewed_from ? 'Renewal' : 'Purchase'} · {formatPaid(pricing.find((p) => p.code === b.country_code), b)}
                      {b.purchased_at ? ` · ${new Date(b.purchased_at).toLocaleDateString()}` : ''}
                    </span>
                    <Pill tone={b.status === 'active' ? 'success' : b.status === 'awaiting_review' ? 'warning' : 'neutral'}>
                      {b.status === 'awaiting_review' ? 'Paid — awaiting document review' : b.status}
                      {b.expires_at && b.status === 'active' ? ` · until ${new Date(b.expires_at).toLocaleDateString()}` : ''}
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
