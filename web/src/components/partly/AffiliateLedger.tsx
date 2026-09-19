import { useEffect, useState } from 'react'
import { InfoCard } from '@/components/app/InfoCard'
import { Pill } from '@/components/partly/ui'
import {
  fetchMyBalance,
  fetchMyCommissions,
  usePricing,
  formatLocal,
  type AffiliateBalance,
  type CommissionRow,
} from '@/lib/partly'
import { supabase } from '@/lib/supabase'

const EVENT_LABEL: Record<CommissionRow['event_type'], string> = {
  badge_purchase: 'Verified badge — first purchase',
  badge_renewal: 'Verified badge — annual renewal',
  lead_unlock: 'Released lead — unlocked',
}

type Payout = { id: string; amount_usd: number; status: string; requested_at: string; paid_at: string | null }

/**
 * Balance, commission ledger and payout tracker for an enrolled affiliate.
 * Amounts are the fixed local-currency figures frozen when each event fired;
 * payouts settle in USD (less FX and transaction fees) once the balance
 * clears USD 50.
 */
export function AffiliateLedger({ affiliateId, userId }: { affiliateId: string; userId: string }) {
  const { pricing } = usePricing()
  const [balance, setBalance] = useState<AffiliateBalance | null>(null)
  const [rows, setRows] = useState<CommissionRow[]>([])
  const [payouts, setPayouts] = useState<Payout[]>([])

  useEffect(() => {
    let alive = true
    Promise.all([
      fetchMyBalance(userId),
      fetchMyCommissions(affiliateId),
      supabase
        .from('affiliate_payouts')
        .select('id,amount_usd,status,requested_at,paid_at')
        .eq('affiliate_id', affiliateId)
        .order('requested_at', { ascending: false }),
    ])
      .then(([b, c, p]) => {
        if (!alive) return
        setBalance(b)
        setRows(c)
        setPayouts((p.data ?? []) as Payout[])
      })
      .catch((err) => console.error('affiliate ledger', err))
    return () => {
      alive = false
    }
  }, [affiliateId, userId])

  const owed = balance?.owed_usd ?? 0
  const pct = Math.min(100, Math.round((owed / 50) * 100))
  const nextPayout = payouts.find((p) => p.status !== 'paid')
  const nextCycle = (() => {
    const d = new Date()
    const q = Math.floor(d.getMonth() / 3) + 1
    return new Date(d.getFullYear() + (q === 4 ? 1 : 0), (q % 4) * 3, 1)
  })()

  return (
    <>
      <InfoCard title="Commission balance">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Earned to date', value: balance?.earned_usd ?? 0 },
            { label: 'Paid out', value: balance?.paid_usd ?? 0 },
            { label: 'Accrued balance', value: owed },
          ].map((s) => (
            <div key={s.label} className="flex flex-col gap-1">
              <span className="text-sm text-muted-600">{s.label}</span>
              <span className="text-2xl font-medium text-ink">USD {s.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Payout threshold USD 50</span>
            <span>{balance?.payout_eligible ? 'Eligible for the next payout cycle' : `${pct}%`}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-alt">
            <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted">
            {nextPayout
              ? `Next payout: USD ${nextPayout.amount_usd.toLocaleString()} — ${nextPayout.status}`
              : `Next payout cycle: ${nextCycle.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })} — in USD, less FX and transaction fees.`}
          </p>
        </div>
      </InfoCard>

      <InfoCard title="Commission ledger">
        {rows.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">
            No commissions yet. You earn when a referred expert unlocks a lead or buys / renews a Verified badge.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-line">
            {rows.map((r) => {
              const p = pricing.find((x) => x.code === r.country_code)
              return (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <span className="font-medium text-ink">{EVENT_LABEL[r.event_type]}</span>
                  <span className="text-muted-600">{new Date(r.earned_at).toLocaleDateString()}</span>
                  <span className="text-muted-600">
                    {p ? formatLocal(p, r.amount_local) : `${r.currency} ${r.amount_local.toLocaleString()}`} ·{' '}
                    USD {r.amount_usd.toLocaleString()}
                  </span>
                  <Pill tone={r.status === 'paid' ? 'brand' : r.status === 'earned' ? 'success' : 'neutral'}>
                    {r.status === 'paid' && r.paid_at ? `Paid ${new Date(r.paid_at).toLocaleDateString()}` : r.status}
                  </Pill>
                </div>
              )
            })}
          </div>
        )}
      </InfoCard>
    </>
  )
}
