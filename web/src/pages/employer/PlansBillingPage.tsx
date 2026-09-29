import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { confirmCheckout, readCheckoutParams } from '@/lib/stripe'
import { EmployerDashboardLayout } from '@/components/dashboard/EmployerDashboardLayout'
import { InfoCard } from '@/components/app/InfoCard'
import { PaymentConfirmingOverlay } from '@/components/app/PaymentConfirmingOverlay'
import { ArrowRightIcon, DownloadIcon } from '@/components/icons'
import { downloadInvoice } from '@/lib/invoice'
import {
  fetchEmployerBilling,
  useEmployer,
  type CreditBalance,
  type PurchaseRow,
  type UsageRow,
} from '@/lib/employers'
import { useT } from '@/lib/i18n'

const dateFmt = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export function PlansBillingPage() {
  const t = useT()
  const { employer, loading: employerLoading } = useEmployer()
  const [balance, setBalance] = useState<CreditBalance | null>(null)
  const [purchases, setPurchases] = useState<PurchaseRow[]>([])
  const [usage, setUsage] = useState<UsageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const { outcome, sessionId } = readCheckoutParams(location.search)
    if (!outcome) return
    let alive = true
    ;(async () => {
      if (outcome === 'success') {
        setConfirming(true)
        const active = sessionId ? await confirmCheckout(sessionId) : false
        setConfirming(false)
        if (!alive) return
        toast.success(
          active
            ? t('ui.payment_confirmed_your_credits_are_ready')
            : t('ui.payment_received_your_credits_will_appear'),
        )
        setRefreshKey((k) => k + 1)
      } else {
        toast(t('co.cancelled'))
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
      {confirming && <PaymentConfirmingOverlay />}
      <div className="flex flex-col gap-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <InfoCard title={t('ui.credit_balance')}>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-medium text-ink">
                {loading ? ', ' : left}
              </span>
              <span className="pb-1 text-sm text-muted">{t(left === 1 ? 'ui.credit' : 'ui.credit_plural')}{' '}{t('ui.remaining')}</span>
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
            <p className="mt-3 text-sm text-muted-600">{t('ui.purchased', { purchased })}{' '}{balance?.credits_used ?? 0}{' '}{t('ui.used')}{balance?.last_purchase_at
                ? t('ui.last_purchase', { v: dateFmt.format(new Date(balance.last_purchase_at)) })
                : t('ui.no_purchases_yet')}
            </p>
            <Link
              to="/employer/pricing"
              className="mt-5 flex w-fit items-center gap-2 rounded-[4px] bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600"
            >{t('ui.buy_more_credits')}<ArrowRightIcon className="size-4" />
            </Link>
          </InfoCard>

          <InfoCard title={t('ui.total_spent')}>
            <span className="text-4xl font-medium text-ink">
              {loading
                ? ', '
                : `$${(balance?.total_spent_usd ?? 0).toLocaleString()}`}
            </span>
            <p className="mt-3 text-sm text-muted-600">{t('ui.across_purchase', { length: purchases.length })}{purchases.length === 1 ? '' : t('ui.plural_s')}.
            </p>
          </InfoCard>
        </div>

        <InfoCard title={t('ui.purchase_history')}>
          {purchases.length > 0 ? (
            <div className="flex flex-col divide-y divide-line">
              {purchases.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                >
                  <span className="font-medium text-ink">{p.package}</span>
                  <span className="text-muted-600">{t('ui.credits', { credits: p.credits })}</span>
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
                          description: `${p.package} ,  ${p.credits} credit${p.credits === 1 ? '' : 's'}`,
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
                    <DownloadIcon className="size-4" />{t('ui.invoice')}</button>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted">
              {loading ? t('ui.loading_2') : t('ui.no_purchases_yet_2')}
            </p>
          )}
        </InfoCard>

        <InfoCard title={t('ui.credit_usage')}>
          {usage.length > 0 ? (
            <div className="flex flex-col divide-y divide-line">
              {usage.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <span className="text-ink-600">{u.reason ?? t('ui.credit_spent')}</span>
                  <span className="text-muted-600">
                    {dateFmt.format(new Date(u.created_at))}
                  </span>
                  <span className="font-medium text-ink">-{u.credits}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted">
              {loading ? t('ui.loading_2') : t('ui.no_credits_spent_yet')}
            </p>
          )}
        </InfoCard>

      </div>
    </EmployerDashboardLayout>
  )
}
