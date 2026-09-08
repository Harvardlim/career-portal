import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { confirmCheckout, readCheckoutParams } from '@/lib/stripe'
import { EmployerDashboardLayout } from '@/components/dashboard/EmployerDashboardLayout'
import { InfoCard } from '@/components/app/InfoCard'
import { ArrowRightIcon, DownloadIcon } from '@/components/icons'
import { downloadInvoice } from '@/lib/invoice'
import {
  fetchEmployerBilling,
  useEmployer,
  type CreditBalance,
  type PurchaseRow,
  type UsageRow,
} from '@/lib/employers'

const dateFmt = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export function PlansBillingPage() {
  const { employer, loading: employerLoading } = useEmployer()
  const [balance, setBalance] = useState<CreditBalance | null>(null)
  const [purchases, setPurchases] = useState<PurchaseRow[]>([])
  const [usage, setUsage] = useState<UsageRow[]>([])
  const [loading, setLoading] = useState(true)
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
            ? 'Payment confirmed — your credits are ready.'
            : 'Payment received — your credits will appear here shortly.',
        )
        setRefreshKey((k) => k + 1)
      } else {
        toast('Checkout cancelled — no charge was made.')
      }
      if (alive) navigate('/employer/billing', { replace: true })
    })()
    return () => {
      alive = false
    }
  }, [location.search, navigate])

  useEffect(() => {
    if (!employer) {
      if (!employerLoading) setLoading(false)
      return
    }
    let alive = true
    fetchEmployerBilling(employer.id)
      .then(({ balance, purchases, usage }) => {
        if (!alive) return
        setBalance(balance)
        setPurchases(purchases)
        setUsage(usage)
      })
      .catch((err) => console.error('billing', err))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [employer, employerLoading, refreshKey])

  const left = balance?.credits_left ?? 0
  const purchased = balance?.credits_purchased ?? 0

  return (
    <EmployerDashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <InfoCard title="Credit Balance">
            <div className="flex items-end gap-2">
              <span className="text-4xl font-medium text-ink">
                {loading ? '—' : left}
              </span>
              <span className="pb-1 text-sm text-muted">
                credit{left === 1 ? '' : 's'} remaining
              </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-alt">
              <div
                className="h-full rounded-full bg-brand"
                style={{
                  width: purchased
                    ? `${Math.max(0, Math.min(100, (left / purchased) * 100))}%`
                    : '0%',
                }}
              />
            </div>
            <p className="mt-3 text-sm text-muted-600">
              {purchased} purchased · {balance?.credits_used ?? 0} used ·{' '}
              {balance?.last_purchase_at
                ? `last purchase ${dateFmt.format(new Date(balance.last_purchase_at))}`
                : 'no purchases yet'}
            </p>
            <Link
              to="/employer/pricing"
              className="mt-5 flex w-fit items-center gap-2 rounded-[4px] bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600"
            >
              Buy more credits
              <ArrowRightIcon className="size-4" />
            </Link>
          </InfoCard>

          <InfoCard title="Total Spent">
            <span className="text-4xl font-medium text-ink">
              {loading
                ? '—'
                : `$${(balance?.total_spent_usd ?? 0).toLocaleString()}`}
            </span>
            <p className="mt-3 text-sm text-muted-600">
              Across {purchases.length} purchase{purchases.length === 1 ? '' : 's'}.
            </p>
          </InfoCard>
        </div>

        <InfoCard title="Purchase History">
          {purchases.length > 0 ? (
            <div className="flex flex-col divide-y divide-line">
              {purchases.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                >
                  <span className="font-medium text-ink">{p.package}</span>
                  <span className="text-muted-600">{p.credits} credits</span>
                  <span className="text-muted-600">
                    {dateFmt.format(new Date(p.created_at))}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs ${
                      p.status === 'paid'
                        ? 'bg-[#e7f6ec] text-[#0ba02c]'
                        : 'bg-surface-alt text-muted'
                    }`}
                  >
                    {p.status}
                  </span>
                  <span className="font-medium text-ink">
                    ${p.amount_usd.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      downloadInvoice(
                        {
                          id: p.id,
                          description: `${p.package} — ${p.credits} credit${p.credits === 1 ? '' : 's'}`,
                          amount_usd: p.amount_usd,
                          status: p.status,
                          created_at: p.created_at,
                        },
                        {
                          company_name: employer?.company_name,
                          business_email: employer?.business_email,
                        },
                      )
                    }
                    className="flex items-center gap-1.5 rounded-[3px] border border-line px-3 py-1.5 text-xs font-semibold text-ink-600 hover:bg-surface-alt"
                  >
                    <DownloadIcon className="size-4" />
                    Invoice
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted">
              {loading ? 'Loading…' : 'No purchases yet.'}
            </p>
          )}
        </InfoCard>

        <InfoCard title="Credit Usage">
          {usage.length > 0 ? (
            <div className="flex flex-col divide-y divide-line">
              {usage.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <span className="text-ink-600">{u.reason ?? 'Credit spent'}</span>
                  <span className="text-muted-600">
                    {dateFmt.format(new Date(u.created_at))}
                  </span>
                  <span className="font-medium text-ink">-{u.credits}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted">
              {loading ? 'Loading…' : 'No credits spent yet.'}
            </p>
          )}
        </InfoCard>

      </div>
    </EmployerDashboardLayout>
  )
}
