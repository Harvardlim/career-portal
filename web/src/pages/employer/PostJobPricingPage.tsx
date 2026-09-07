import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { EmployerDashboardLayout } from '@/components/dashboard/EmployerDashboardLayout'
import { Field, TextInput } from '@/components/dashboard/form'
import {
  fetchEmployerMembership,
  sendHrInvite,
  useEmployer,
  type EmployerMembershipStatus,
} from '@/lib/employers'
import { errMessage } from '@/lib/errors'
import {
  readCheckoutOutcome,
  startCheckout,
  type CreditPackageKey,
} from '@/lib/stripe'
import { ArrowRightIcon, CheckIcon, MailIcon } from '@/components/icons'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const defaultInvitation =
  "Hi,\n\nI'd like to invite you to join our hiring team on Partly Asia so we can post jobs together.\n\nThanks,\nThe hiring team"

function ReferralPackageCard({
  onBuy,
  disabled,
  pending,
}: {
  onBuy: () => void
  disabled: boolean
  pending: boolean
}) {
  const [emails, setEmails] = useState(['', '', ''])
  const [consents, setConsents] = useState([false, false, false])
  const [sent, setSent] = useState([false, false, false])
  const [sending, setSending] = useState<number | null>(null)
  const [message, setMessage] = useState(defaultInvitation)

  const dupInForm = (i: number) => {
    const v = emails[i].trim().toLowerCase()
    return !!v && emails.some((e, j) => j !== i && e.trim().toLowerCase() === v)
  }
  const rowReady = (i: number) =>
    EMAIL_RE.test(emails[i].trim()) && consents[i] && !dupInForm(i)
  const canBuy = [0, 1, 2].every((i) => sent[i]) && !disabled && !pending

  async function sendRow(i: number) {
    if (!rowReady(i) || sent[i] || !message.trim()) return
    setSending(i)
    try {
      const { delivered } = await sendHrInvite(emails[i].trim(), message.trim())
      setSent((prev) => prev.map((v, j) => (j === i ? true : v)))
      toast.success(
        delivered
          ? `Invitation sent to ${emails[i].trim()}`
          : `Invitation recorded for ${emails[i].trim()} (email delivery is currently unavailable)`,
      )
    } catch (err) {
      toast.error(errMessage(err))
    } finally {
      setSending(null)
    }
  }

  return (
    <div className="relative flex flex-col rounded-xl border border-brand">
      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded bg-brand px-3 py-1 text-xs font-medium text-white">
        Referral Discount
      </span>
      <div className="flex flex-col gap-3 border-b border-line p-6">
        <p className="text-base font-medium text-ink">Invite Your HR Team</p>
        <p className="text-sm text-muted-600">
          Invite 3 HR emails to unlock this price.
        </p>
        <p className="text-3xl font-medium text-brand">
          $499<span className="text-sm text-muted"> / 3 credits</span>
        </p>
      </div>

      <div className="flex flex-col gap-4 p-6">
        <p className="text-sm font-medium text-ink">
          Send an invitation to each of 3 HR emails to unlock USD 499. This
          message is emailed to each of them from no-reply@partly.asia.
        </p>

        <Field label="Invitation message (pre-filled, you can edit it)">
          <textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full resize-none rounded-md border border-line bg-surface p-4 text-sm text-ink outline-none focus:border-brand"
          />
        </Field>

        {emails.map((email, i) => {
          const isSent = sent[i]
          return (
            <div key={i} className="flex flex-col gap-2">
              <Field label={`HR Email ${i + 1}`}>
                <TextInput
                  type="email"
                  placeholder="hr@company.com"
                  icon={<MailIcon className="size-5" />}
                  value={email}
                  disabled={isSent}
                  onChange={(e) =>
                    setEmails((prev) =>
                      prev.map((v, j) => (j === i ? e.target.value : v)),
                    )
                  }
                />
              </Field>
              <label className="flex items-start gap-2.5 text-sm text-ink-600">
                <input
                  type="checkbox"
                  checked={consents[i]}
                  disabled={isSent}
                  onChange={(e) =>
                    setConsents((prev) =>
                      prev.map((v, j) => (j === i ? e.target.checked : v)),
                    )
                  }
                  className="mt-0.5 size-5 shrink-0 rounded-[3px] border border-brand-200 text-brand accent-brand"
                />
                I consent to sending this invitation on my behalf to{' '}
                <span className="font-medium text-ink">
                  {email.trim() || `HR email ${i + 1}`}
                </span>
                .
              </label>
              {dupInForm(i) && (
                <p className="text-xs text-danger">
                  This email is already used in another row — enter a different
                  address.
                </p>
              )}
              <button
                type="button"
                disabled={
                  isSent || sending !== null || !rowReady(i) || !message.trim()
                }
                onClick={() => sendRow(i)}
                className="flex items-center justify-center gap-2 self-start rounded-[4px] border border-brand px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSent ? (
                  <>
                    <CheckIcon className="size-4" />
                    Invitation sent
                  </>
                ) : sending === i ? (
                  'Sending…'
                ) : (
                  <>
                    <MailIcon className="size-4" />
                    Send invitation
                  </>
                )}
              </button>
            </div>
          )
        })}
      </div>

      <div className="p-6 pt-0">
        <button
          type="button"
          disabled={!canBuy}
          onClick={onBuy}
          className="flex w-full items-center justify-center gap-2 rounded-[4px] bg-brand py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? 'Redirecting…' : 'Buy for $499'}
          <ArrowRightIcon className="size-4" />
        </button>
        {disabled ? (
          <p className="mt-2 text-center text-xs text-muted">
            Your account already has credits — see the repeat pricing below.
          </p>
        ) : (
          !canBuy &&
          !pending && (
            <p className="mt-2 text-center text-xs text-muted">
              Send the invitation to all 3 HR emails to unlock this price.
            </p>
          )
        )}
      </div>
    </div>
  )
}

const TOP_UP: { price: string; credits: number; pkg: CreditPackageKey } = {
  price: '199',
  credits: 5,
  pkg: 'repeat_2',
}

export function PostJobPricingPage() {
  const { employer, loading: employerLoading } = useEmployer()
  const [membership, setMembership] = useState<EmployerMembershipStatus | null>(null)
  const [pending, setPending] = useState<CreditPackageKey | null>(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (readCheckoutOutcome(location.search) === 'cancelled') {
      toast('Checkout cancelled — no charge was made.')
      navigate('/employer/pricing', { replace: true })
    }
  }, [location.search, navigate])

  useEffect(() => {
    if (!employer) return
    let alive = true
    fetchEmployerMembership(employer.id)
      .then((m) => alive && setMembership(m))
      .catch((err) => console.error('employer membership', err))
    return () => {
      alive = false
    }
  }, [employer])

  const isMember = membership?.is_active ?? false
  const knowMembership = membership !== null || (!employer && !employerLoading)

  async function buy(pkg: CreditPackageKey) {
    setPending(pkg)
    try {
      await startCheckout({ kind: 'credits', pkg })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start checkout')
      setPending(null)
    }
  }

  return (
    <EmployerDashboardLayout>
      <div className="flex flex-col gap-10">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-medium text-ink">Buy Credits to Post Jobs</h1>
          <p className="mt-3 text-muted-600">
            1 job post uses 1 credit. Posted jobs stay live for 30 days; purchased
            credits are valid for 60 days.
          </p>
          {isMember && (
            <p className="mt-3 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand">
              You&apos;ve already bought a package — from now on only Top Up Credit
              ($199 / 5 credits) is available.
            </p>
          )}
        </div>

        {!knowMembership ? (
          <p className="text-sm text-muted">Loading pricing…</p>
        ) : isMember ? (
          /* After a first purchase (Standard $999 or Referral $499) the only
             option going forward is the $199 top-up. */
          <div className="flex max-w-xl flex-col gap-4 rounded-xl border border-brand p-6">
            <div>
              <h2 className="text-lg font-medium text-ink">Top Up Credit</h2>
              <p className="mt-1 text-sm text-muted-600">
                Your account is active — top up more credits at the member rate.
              </p>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-surface-alt px-5 py-4">
              <div className="flex flex-col">
                <span className="text-sm text-ink-600">Top up</span>
                <span className="text-lg font-medium text-ink">
                  ${TOP_UP.price}{' '}
                  <span className="text-sm text-muted">/ {TOP_UP.credits} credits</span>
                </span>
              </div>
              <button
                type="button"
                disabled={pending !== null}
                onClick={() => buy(TOP_UP.pkg)}
                className="flex items-center gap-2 rounded-[4px] bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {pending === TOP_UP.pkg ? 'Redirecting…' : `Pay $${TOP_UP.price}`}
                <ArrowRightIcon className="size-4" />
              </button>
            </div>
          </div>
        ) : (
          /* First purchase only — choose Standard $999 or Referral $499. */
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col rounded-xl border border-line">
              <div className="flex flex-col gap-3 border-b border-line p-6">
                <p className="text-base font-medium text-ink">Standard</p>
                <p className="text-sm text-muted-600">Buy credits outright, no strings attached.</p>
                <p className="text-3xl font-medium text-brand">
                  $999<span className="text-sm text-muted"> / 3 credits</span>
                </p>
              </div>
              <ul className="flex flex-1 flex-col gap-3 p-6">
                {['3 job posting credits', 'Valid for 60 days', 'Credits can be used to extend or repost'].map(
                  (f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-ink-600">
                      <CheckIcon className="size-4 text-brand" />
                      {f}
                    </li>
                  ),
                )}
              </ul>
              <div className="p-6 pt-0">
                <button
                  type="button"
                  disabled={pending !== null}
                  onClick={() => buy('standard')}
                  className="flex w-full items-center justify-center gap-2 rounded-[4px] bg-brand-50 py-3 text-sm font-semibold text-brand hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {pending === 'standard' ? 'Redirecting…' : 'Buy for $999'}
                  <ArrowRightIcon className="size-4" />
                </button>
              </div>
            </div>

            <ReferralPackageCard
              onBuy={() => buy('referral')}
              disabled={false}
              pending={pending === 'referral'}
            />
          </div>
        )}

        <div className="flex flex-col items-start gap-3 rounded-lg bg-surface-alt p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-medium text-ink">Refer a company, earn a commission</p>
            <p className="text-sm text-muted-600">
              Get USD 150 for the $999 package, USD 99 for the $499 package, USD 30
              for the $199 package.
            </p>
          </div>
          <Link
            to="/affiliate"
            className="flex shrink-0 items-center gap-2 rounded-[4px] bg-surface px-6 py-3 text-sm font-semibold text-brand"
          >
            Learn more
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      </div>
    </EmployerDashboardLayout>
  )
}
