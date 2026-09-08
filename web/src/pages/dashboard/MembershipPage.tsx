import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import {
  fetchMembership,
  fetchMembershipHistory,
  membershipEndDate,
  membershipIsCurrent,
  useCandidate,
  type MembershipRecord,
} from '@/lib/dashboard'
import {
  confirmCheckout,
  readCheckoutParams,
  startCheckout,
  type MembershipPlanKey,
} from '@/lib/stripe'
import { downloadInvoice } from '@/lib/invoice'
import {
  ArrowRightIcon,
  CheckIcon,
  DownloadIcon,
  StarIcon,
} from '@/components/icons'

const dateFmt = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const plans: {
  name: string
  price: string
  period: string | null
  planKey: MembershipPlanKey | null
  features: string[]
  recommended?: boolean
}[] = [
  {
    name: 'Free',
    price: '0',
    period: null,
    planKey: null,
    features: [
      'Create your profile & apply to jobs',
      'Standard match visibility',
    ],
  },
  {
    name: 'Member — Monthly',
    price: '99',
    period: '/month',
    planKey: 'candidate_monthly',
    features: [
      'Verified badge on your profile',
      'Priority Match — shown to employers first',
      'Everything in Free',
    ],
  },
  {
    name: 'Member — Yearly',
    price: '199',
    period: '/year',
    planKey: 'candidate_yearly',
    features: [
      'Verified badge on your profile',
      'Priority Match — shown to employers first',
      'Everything in Free',
      'Save vs. paying monthly',
    ],
    recommended: true,
  },
]

export function MembershipPage() {
  const { candidate } = useCandidate()
  const [membership, setMembership] = useState<MembershipRecord | null>(null)
  const [history, setHistory] = useState<MembershipRecord[]>([])
  const [pendingPlan, setPendingPlan] = useState<MembershipPlanKey | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const { outcome, sessionId } = readCheckoutParams(location.search)
    if (!outcome) return
    let alive = true
    ;(async () => {
      if (outcome === 'success') {
        const active = sessionId ? await confirmCheckout(sessionId) : false
        if (!alive) return
        toast.success(
          active
            ? 'Membership active — thanks for subscribing!'
            : 'Payment received — your membership will activate shortly.',
        )
        setRefreshKey((k) => k + 1)
      } else {
        toast('Checkout cancelled — no charge was made.')
      }
      if (alive) navigate('/dashboard/membership', { replace: true })
    })()
    return () => {
      alive = false
    }
  }, [location.search, navigate])

  useEffect(() => {
    if (!candidate) return
    let alive = true
    Promise.all([
      fetchMembership(candidate.id),
      fetchMembershipHistory(candidate.id),
    ])
      .then(([m, h]) => {
        if (!alive) return
        setMembership(m)
        setHistory(h)
      })
      .catch((err) => console.error('membership', err))
    return () => {
      alive = false
    }
  }, [candidate, refreshKey])

  async function handleUpgrade(planKey: MembershipPlanKey) {
    setPendingPlan(planKey)
    try {
      await startCheckout({ kind: 'membership', plan: planKey })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start checkout')
      setPendingPlan(null)
    }
  }

  const currentPlanName = membership?.plan ?? 'Free'
  const endsAt = membershipEndDate(membership)
  const endFmt = endsAt
    ? new Intl.DateTimeFormat('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(endsAt)
    : null
  // Most recent membership whose term has run out — shown as an "expired" note.
  const expiredPlan = membership
    ? null
    : history.find((h) => h.status === 'active' && !membershipIsCurrent(h)) ?? null
  const expiredEnd = expiredPlan ? membershipEndDate(expiredPlan) : null

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-medium text-ink">Membership</h1>
          <p className="mt-1 text-muted">
            Applying to jobs is always free. Upgrade for Priority Match.
          </p>
        </div>

        {membership && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-lg bg-surface-alt px-6 py-4 text-sm">
            <span>
              <span className="text-muted-600">Current plan: </span>
              <span className="font-medium text-ink">{membership.plan}</span>
            </span>
            <span className="capitalize text-[#0ba02c]">{membership.status}</span>
            {endFmt && (
              <span>
                <span className="text-muted-600">Valid until </span>
                <span className="font-medium text-ink">{endFmt}</span>
              </span>
            )}
          </div>
        )}

        {expiredPlan && (
          <div className="rounded-lg bg-[#fff6e6] px-6 py-4 text-sm text-[#8a6d1a]">
            Your <b>{expiredPlan.plan}</b> membership ended
            {expiredEnd
              ? ` on ${new Intl.DateTimeFormat('en-US', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }).format(expiredEnd)}`
              : ''}
            . You&apos;re now on the <b>Free</b> plan — renew below to restore
            Priority Match.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const current = plan.name === currentPlanName
            return (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-xl border ${
                plan.recommended ? 'border-brand' : 'border-line'
              }`}
            >
              {plan.recommended && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded bg-brand px-3 py-1 text-xs font-medium text-white">
                  Best Value
                </span>
              )}
              <div className="flex flex-col gap-3 border-b border-line p-6">
                <p className="text-base font-medium text-ink">{plan.name}</p>
                <p className="text-3xl font-medium text-brand">
                  ${plan.price}
                  {plan.period && <span className="text-sm text-muted">{plan.period}</span>}
                </p>
              </div>
              <ul className="flex flex-1 flex-col gap-3 p-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-ink-600">
                    <CheckIcon className="size-4 text-brand" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="p-6 pt-0">
                {current ? (
                  <span className="flex items-center justify-center rounded-[4px] bg-surface-alt py-3 text-sm font-semibold text-muted-600">
                    Current Plan
                  </span>
                ) : plan.planKey ? (
                  <button
                    type="button"
                    disabled={pendingPlan !== null}
                    onClick={() => handleUpgrade(plan.planKey!)}
                    className={`flex w-full items-center justify-center gap-2 rounded-[4px] py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                      plan.recommended
                        ? 'bg-brand text-white'
                        : 'bg-brand-50 text-brand hover:bg-brand-100'
                    }`}
                  >
                    {pendingPlan === plan.planKey ? 'Redirecting…' : 'Upgrade'}
                    <ArrowRightIcon className="size-4" />
                  </button>
                ) : (
                  <span className="flex items-center justify-center rounded-[4px] bg-surface-alt py-3 text-sm font-semibold text-muted-600">
                    Included
                  </span>
                )}
              </div>
            </div>
            )
          })}
        </div>

        {history.length > 0 && (
          <div className="flex flex-col gap-2 rounded-xl border border-line p-6">
            <h2 className="text-base font-medium text-ink">Purchase History</h2>
            <div className="flex flex-col divide-y divide-line">
              {history.map((h) => {
                const effStatus =
                  h.status === 'active' && !membershipIsCurrent(h)
                    ? 'expired'
                    : h.status
                return (
                <div
                  key={h.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                >
                  <span className="font-medium text-ink">{h.plan}</span>
                  <span className="text-muted-600">
                    {dateFmt.format(new Date(h.created_at ?? h.started_at))}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs capitalize ${
                      effStatus === 'active'
                        ? 'bg-[#e7f6ec] text-[#0ba02c]'
                        : 'bg-surface-alt text-muted'
                    }`}
                  >
                    {effStatus}
                  </span>
                  <span className="font-medium text-ink">
                    ${h.amount_usd.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      downloadInvoice(
                        {
                          id: h.id,
                          description: h.plan,
                          amount_usd: h.amount_usd,
                          status: effStatus,
                          created_at: h.created_at ?? h.started_at,
                        },
                        {
                          company_name: candidate?.full_name,
                          business_email: candidate?.email,
                        },
                      )
                    }
                    className="flex items-center gap-1.5 rounded-[3px] border border-line px-3 py-1.5 text-xs font-semibold text-ink-600 hover:bg-surface-alt"
                  >
                    <DownloadIcon className="size-4" />
                    Invoice
                  </button>
                </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col items-start gap-3 rounded-lg bg-surface-alt p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-surface text-brand">
              <StarIcon className="size-6" />
            </span>
            <div>
              <p className="text-base font-medium text-ink">
                Refer a friend, earn a commission
              </p>
              <p className="text-sm text-muted-600">
                Get USD 30 when they join Monthly, USD 70 when they join Yearly.
              </p>
            </div>
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
    </DashboardLayout>
  )
}
