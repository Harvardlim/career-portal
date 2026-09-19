import { useEffect, useState } from 'react'
import { ListCard, Pagination, PAGE_SIZES, TableSearch, lc, useTableView } from '../components/ListShell'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Button, Card, controlClass } from '../components/ui'
import {
  createPayout,
  fetchCommissionData,
  markPayoutPaid,
  partlyEnabled,
  type BalanceRow,
  type CommissionRow,
  type PayoutRow,
} from '../lib/partly'

const thCls = 'px-3 py-3 font-medium first:pl-6 last:pr-6'
const tdCls = 'px-3 py-4 align-top first:pl-6 last:pr-6'
const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
const errMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong')

const EVENT: Record<string, string> = {
  badge_purchase: 'Badge — purchase',
  badge_renewal: 'Badge — renewal',
  lead_unlock: 'Lead unlock',
}

const Pill = ({ value }: { value: string }) => {
  const tone =
    value === 'paid' ? 'bg-success/12 text-success' : value === 'earned' || value === 'pending' ? 'bg-brand/15 text-brand-2' : 'bg-white/[0.05] text-muted'
  return <span className={`inline-flex rounded-md px-2 py-1 text-[12px] font-medium capitalize ${tone}`}>{value}</span>
}

/**
 * partly.asia affiliate commissions: fixed local-currency events (badge
 * purchase/renewal, lead unlock), USD balances, and the payout cycle.
 */
export const CommissionsPage = () => {
  const [balances, setBalances] = useState<BalanceRow[]>([])
  const [commissions, setCommissions] = useState<CommissionRow[]>([])
  const [payouts, setPayouts] = useState<PayoutRow[]>([])
  const [loading, setLoading] = useState(partlyEnabled)
  const [error, setError] = useState<string | null>(null)
  const [payoutFor, setPayoutFor] = useState<BalanceRow | null>(null)
  const [paying, setPaying] = useState<PayoutRow | null>(null)
  const [reference, setReference] = useState('')
  const [method, setMethod] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const d = await fetchCommissionData()
      setBalances(d.balances)
      setCommissions(d.commissions)
      setPayouts(d.payouts)
      setError(null)
    } catch (e) {
      setError(errMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (partlyEnabled) void load()
  }, [])

  const bView = useTableView(balances, (r, q) => [r.name, r.referral_code].some((v) => lc(v).includes(q)))
  const cView = useTableView(commissions, (r, q) =>
    [r.affiliate_name, r.affiliate?.referral_code, r.event_type, r.status, r.country_code].some((v) => lc(v).includes(q)),
  )
  const pView = useTableView(payouts, (r, q) =>
    [r.affiliate_name, r.affiliate?.referral_code, r.status, r.reference].some((v) => lc(v).includes(q)),
  )

  async function confirmPayout() {
    if (!payoutFor) return
    setBusy(true)
    try {
      await createPayout(payoutFor.affiliate_id)
      setPayoutFor(null)
      await load()
    } catch (e) {
      setError(errMessage(e))
    } finally {
      setBusy(false)
    }
  }

  async function confirmPaid() {
    if (!paying) return
    setBusy(true)
    try {
      await markPayoutPaid(paying.id, reference.trim(), method.trim())
      setPaying(null)
      setReference('')
      setMethod('')
      await load()
    } catch (e) {
      setError(errMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const owedTotal = balances.reduce((s, b) => s + Number(b.owed_usd), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold text-ink">Affiliate commissions</h1>
        <p className="text-[13px] text-muted">
          {usd(owedTotal)} accrued across {balances.filter((b) => b.owed_usd > 0).length} affiliates · payouts in USD once a balance clears USD 50
        </p>
      </div>

      {!partlyEnabled && <Card className="p-6 text-[13px] text-muted">Connect Supabase to see commissions.</Card>}
      {error && <Card className="border-danger/40 p-4 text-[13px] text-danger">{error}</Card>}

      <ListCard title="Balances" range={`${bView.filtered.length}`} toolbar={<TableSearch value={bView.query} onChange={bView.setQuery} />}>
        <table className="w-full min-w-[820px] text-left text-[13px]">
          <thead className="border-b border-line text-muted">
            <tr>
              <th className={thCls}>Affiliate</th>
              <th className={thCls}>Events</th>
              <th className={thCls}>Earned</th>
              <th className={thCls}>Paid</th>
              <th className={thCls}>Owed</th>
              <th className={thCls}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-muted">Loading…</td></tr>
            ) : bView.paged.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-muted">No affiliates yet.</td></tr>
            ) : (
              bView.paged.map((b) => {
                const hasOpenPayout = payouts.some((p) => p.affiliate_id === b.affiliate_id && p.status !== 'paid')
                return (
                  <tr key={b.affiliate_id}>
                    <td className={tdCls}>
                      <span className="block font-semibold text-ink">{b.name ?? 'Unknown'}</span>
                      <span className="block text-[12px] text-muted">{b.referral_code}</span>
                    </td>
                    <td className={tdCls}>{b.commission_events}</td>
                    <td className={tdCls}>{usd(b.earned_usd)}</td>
                    <td className={tdCls}>{usd(b.paid_usd)}</td>
                    <td className={tdCls}>
                      <span className={b.owed_usd > 0 ? 'font-semibold text-ink' : ''}>{usd(b.owed_usd)}</span>
                      {b.payout_eligible && <span className="block text-[11px] text-success">Eligible</span>}
                    </td>
                    <td className={tdCls}>
                      {b.owed_usd > 0 && !hasOpenPayout && (
                        <Button variant="ghost" onClick={() => setPayoutFor(b)}>Create payout</Button>
                      )}
                      {hasOpenPayout && <span className="text-[12px] text-muted">Payout pending</span>}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        <div className="px-6 pb-5">
          <Pagination page={bView.page} pageSize={bView.pageSize} total={bView.filtered.length} onPageChange={bView.setPage} onPageSizeChange={bView.setPageSize} pageSizeOptions={PAGE_SIZES} />
        </div>
      </ListCard>

      <ListCard title="Payouts" range={`${pView.filtered.length}`} toolbar={<TableSearch value={pView.query} onChange={pView.setQuery} />}>
        <table className="w-full min-w-[820px] text-left text-[13px]">
          <thead className="border-b border-line text-muted">
            <tr>
              <th className={thCls}>Affiliate</th>
              <th className={thCls}>Amount</th>
              <th className={thCls}>Requested</th>
              <th className={thCls}>Status</th>
              <th className={thCls}>Reference</th>
              <th className={thCls}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {pView.paged.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-muted">{loading ? 'Loading…' : 'No payouts yet.'}</td></tr>
            ) : (
              pView.paged.map((p) => (
                <tr key={p.id}>
                  <td className={tdCls}>
                    <span className="block font-semibold text-ink">{p.affiliate_name ?? 'Unknown'}</span>
                    <span className="block text-[12px] text-muted">{p.affiliate?.referral_code ?? ''}</span>
                  </td>
                  <td className={tdCls}>{usd(p.amount_usd)}</td>
                  <td className={tdCls}>{fmt(p.requested_at)}</td>
                  <td className={tdCls}><Pill value={p.status} />{p.paid_at && <span className="block text-[12px] text-muted">{fmt(p.paid_at)}</span>}</td>
                  <td className={tdCls}>{p.reference ?? '—'}{p.method ? <span className="block text-[12px] text-muted">{p.method}</span> : null}</td>
                  <td className={tdCls}>{p.status !== 'paid' && <Button onClick={() => setPaying(p)}>Mark paid</Button>}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="px-6 pb-5">
          <Pagination page={pView.page} pageSize={pView.pageSize} total={pView.filtered.length} onPageChange={pView.setPage} onPageSizeChange={pView.setPageSize} pageSizeOptions={PAGE_SIZES} />
        </div>
      </ListCard>

      <ListCard title="Commission ledger" range={`${cView.filtered.length}`} toolbar={<TableSearch value={cView.query} onChange={cView.setQuery} />}>
        <table className="w-full min-w-[820px] text-left text-[13px]">
          <thead className="border-b border-line text-muted">
            <tr>
              <th className={thCls}>Affiliate</th>
              <th className={thCls}>Event</th>
              <th className={thCls}>Local</th>
              <th className={thCls}>USD</th>
              <th className={thCls}>Earned</th>
              <th className={thCls}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {cView.paged.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-muted">{loading ? 'Loading…' : 'No commissions yet.'}</td></tr>
            ) : (
              cView.paged.map((c) => (
                <tr key={c.id}>
                  <td className={tdCls}>
                    <span className="block font-semibold text-ink">{c.affiliate_name ?? 'Unknown'}</span>
                    <span className="block text-[12px] text-muted">{c.affiliate?.referral_code ?? ''}</span>
                  </td>
                  <td className={tdCls}>{EVENT[c.event_type] ?? c.event_type}</td>
                  <td className={tdCls}>{c.currency} {Number(c.amount_local).toLocaleString()}<span className="block text-[12px] text-muted">{c.country_code ?? ''}</span></td>
                  <td className={tdCls}>{usd(c.amount_usd)}</td>
                  <td className={tdCls}>{fmt(c.earned_at)}</td>
                  <td className={tdCls}><Pill value={c.status} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="px-6 pb-5">
          <Pagination page={cView.page} pageSize={cView.pageSize} total={cView.filtered.length} onPageChange={cView.setPage} onPageSizeChange={cView.setPageSize} pageSizeOptions={PAGE_SIZES} />
        </div>
      </ListCard>

      <ConfirmDialog
        open={!!payoutFor}
        title="Create payout"
        message={payoutFor ? `Bundle ${usd(payoutFor.owed_usd)} of earned commissions for ${payoutFor.name ?? payoutFor.referral_code} into one pending payout.` : ''}
        confirmLabel="Create payout"
        tone="default"
        busy={busy}
        onCancel={() => setPayoutFor(null)}
        onConfirm={confirmPayout}
      />

      <ConfirmDialog
        open={!!paying}
        title="Mark payout paid"
        message={
          <div className="space-y-3">
            <p>{paying ? `Confirm ${usd(paying.amount_usd)} was sent to ${paying.affiliate_name ?? paying.affiliate?.referral_code}. Every commission in this payout is marked paid.` : ''}</p>
            <input value={method} onChange={(e) => setMethod(e.target.value)} placeholder="Method (bank transfer, Wise, PayPal…)" className={controlClass} />
            <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Transaction reference" className={controlClass} />
          </div>
        }
        confirmLabel="Mark paid"
        tone="default"
        busy={busy}
        onCancel={() => setPaying(null)}
        onConfirm={confirmPaid}
      />
    </div>
  )
}
