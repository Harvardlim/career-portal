import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { InviteFriendPanel } from '@/components/partly/InviteFriendPanel'
import { GlobeIcon, MailIcon, MapPinIcon, PhoneIcon } from '@/components/icons'
import { Card, Countdown, EmptyState, Notice, Pill, PrimaryButton } from '@/components/partly/ui'
import { useCandidate } from '@/lib/dashboard'
import {
  countryName,
  fetchLead,
  fetchLeadContact,
  formatLocal,
  formatUsd,
  projectTypeLabel,
  startLeadUnlock,
  usePricing,
  type ExpertContact,
  type LeadRow,
  type PayCurrency,
} from '@/lib/partly'
import { confirmCheckout, readCheckoutParams } from '@/lib/stripe'

export function LeadUnlockPage() {
  const { id = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
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
  useEffect(() => {
    const { outcome, sessionId } = readCheckoutParams(location.search)
    if (!outcome) return
    navigate(location.pathname, { replace: true })
    if (outcome === 'cancelled') {
      toast('Payment cancelled — the lead is still yours until the window closes.')
      return
    }
    if (sessionId) {
      confirmCheckout(sessionId).then((ok) => {
        if (ok) toast.success('Contact unlocked.')
        void load()
      })
    }
  }, [location.search, location.pathname, navigate, load])

  const price = pricing.find((p) => p.code === candidate?.country_code)

  async function handlePay() {
    setBusy(true)
    try {
      await startLeadUnlock(id, pay)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start payment')
      setBusy(false)
    }
  }

  if (loading || candidateLoading) {
    return (
      <DashboardLayout>
        <p className="text-sm text-muted">Loading…</p>
      </DashboardLayout>
    )
  }
  if (!lead) {
    return (
      <DashboardLayout>
        <EmptyState>Lead not found.</EmptyState>
      </DashboardLayout>
    )
  }

  const job = lead.job

  return (
    <DashboardLayout>
      <div className="flex max-w-2xl flex-col gap-5">
        <Link to="/dashboard/leads" className="text-xs text-muted hover:text-brand">
          ← Warm leads
        </Link>

        {/* Only what the expert already saw when applying -- nothing more. */}
        <Card className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-ink">{job?.title ?? 'Released lead'}</h1>
          <div className="flex flex-wrap gap-2 text-sm">
            <Pill>{job?.category ?? 'Category'}</Pill>
            <Pill>{countryName(job?.country)}</Pill>
            <Pill>{projectTypeLabel(job?.project_type)}</Pill>
          </div>
          {lead.others_released > 0 && lead.status === 'awaiting_payment' && (
            <p className="mt-1 text-xs text-amber-800">
              This business also released contact to {lead.others_released} other expert
              {lead.others_released === 1 ? '' : 's'} — you are one of {lead.cohort_size} being considered.
            </p>
          )}
        </Card>

        {lead.status === 'paid' && (
          <Card className="border-emerald-200 bg-emerald-50/40">
            <h2 className="font-semibold text-ink">Business contact</h2>
            {contact ? (
              <>
                <p className="mt-1 text-lg font-medium text-ink">{contact.company_name}</p>
                <div className="mt-3 flex flex-col gap-2 text-sm">
                  <a href={`mailto:${contact.business_email}`} className="flex items-center gap-2 text-ink hover:text-brand">
                    <MailIcon className="size-4 text-muted" /> {contact.business_email}
                  </a>
                  {contact.phone && (
                    <span className="flex items-center gap-2 text-ink">
                      <PhoneIcon className="size-4 text-muted" /> {contact.phone}
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
                <Notice tone="warning">
                  These details are visible until <strong>{new Date(contact.contact_expires_at).toLocaleString()}</strong>{' '}
                  (5 calendar days). For security and privacy, refer to this lead only through partly.asia — we never
                  email contact details out.
                </Notice>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">
                The 5-day contact window has ended. The business received your details at the same time, so the
                conversation can continue off-platform.
              </p>
            )}
          </Card>
        )}

        {lead.status === 'paid' && contact && <InviteFriendPanel audience="expert" />}

        {lead.status === 'awaiting_payment' && lead.window_open && (
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold text-ink">Pay to unlock contact</h2>
              <Countdown until={lead.window_expires_at} />
            </div>
            <p className="text-sm text-muted">
              A fixed fee unlocks the business's full contact details, and sends yours to them at the same time.
              After that, everything happens directly between you.
            </p>

            {!price ? (
              <Notice tone="warning">
                Set your country on the{' '}
                <Link to="/dashboard/verification" className="underline">
                  verification page
                </Link>{' '}
                so we can show your market's fixed price.
              </Notice>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPay('local')}
                  className={`rounded-lg border p-4 text-left ${pay === 'local' ? 'border-brand bg-brand-50' : 'border-line'}`}
                >
                  <p className="text-xs uppercase tracking-wide text-muted">Pay in {price.currency}</p>
                  <p className="mt-1 text-2xl font-semibold text-ink">{formatLocal(price, price.lead_fee_local)}</p>
                  <p className="text-xs text-muted">Fixed {price.name} price</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPay('usd')}
                  className={`rounded-lg border p-4 text-left ${pay === 'usd' ? 'border-brand bg-brand-50' : 'border-line'}`}
                >
                  <p className="text-xs uppercase tracking-wide text-muted">Pay in USD</p>
                  <p className="mt-1 text-2xl font-semibold text-ink">{formatUsd(price.lead_fee_usd)}</p>
                  <p className="text-xs text-muted">Forex exchange absorbed</p>
                </button>
              </div>
            )}

            <PrimaryButton onClick={handlePay} disabled={busy || !price} className="w-full">
              {busy ? 'Redirecting to payment…' : 'Pay to Unlock Contact'}
            </PrimaryButton>
            <p className="text-center text-xs text-muted">
              Secure checkout by Stripe. If you don't pay within the window the lead simply goes cold — no charge.
            </p>
          </Card>
        )}

        {lead.status === 'awaiting_payment' && !lead.window_open && (
          <Notice tone="brand" title="The window has closed">
            This lead went cold. You were not charged.
          </Notice>
        )}
        {(lead.status === 'cold' || lead.status === 'job_closed') && (
          <Notice tone="brand" title={lead.status === 'job_closed' ? 'Lead went cold — job closed' : 'Lead went cold'}>
            {lead.ended_reason ?? 'The window closed before payment.'} You were not charged — this is a normal part of
            the process.
          </Notice>
        )}
      </div>
    </DashboardLayout>
  )
}
