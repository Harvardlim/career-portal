import { useEffect, useState, type ReactNode } from 'react'
import { ListCard, Pagination, PAGE_SIZES, TableSearch, lc, useTableView } from '../components/ListShell'
import { IconDollar, IconStar, IconTrend } from '../components/Icons'
import { Card } from '../components/ui'
import { fetchBadges, fetchLeadPayments, fetchPricing, partlyEnabled, type BadgeRow, type LeadPaymentRow, type PricingRow } from '../lib/partly'

const thCls = 'px-3 py-3 font-medium first:pl-6 last:pr-6'
const tdCls = 'px-3 py-4 align-top first:pl-6 last:pr-6'
const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
/** Every payment is shown in both currencies: what was charged, plus the other side's figure. */
const bothLine = (
  pricing: PricingRow[],
  r: { country_code: string | null; currency: string; amount_local: number; amount_usd: number; pay_currency?: string },
) => {
  const p = pricing.find((x) => x.code === r.country_code)
  const local = `${p?.currency_symbol ?? ''}${Number(r.amount_local).toLocaleString()}${p ? '' : ` ${r.currency}`}`
  return `${local} · ${usd(r.amount_usd)}`
}
const errMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong')

const Pill = ({ value }: { value: string }) => {
  const tone =
    value === 'paid' || value === 'active'
      ? 'bg-success/12 text-success'
      : value === 'pending'
        ? 'bg-warning/15 text-warning'
        : 'bg-white/[0.05] text-muted'
  return <span className={`inline-flex rounded-md px-2 py-1 text-[12px] font-medium capitalize ${tone}`}>{value}</span>
}

const Stat = ({ icon, label, value, tint }: { icon: ReactNode; label: string; value: string; tint: string }) => (
  <Card className="p-5">
    <div className="flex items-center gap-3">
      <span className={`grid size-11 place-items-center rounded-full ${tint}`}>{icon}</span>
      <div>
        <p className="text-[20px] font-semibold text-ink">{value}</p>
        <p className="text-[13px] text-muted">{label}</p>
      </div>
    </div>
  </Card>
)

/** Money in from the two partly.asia products: lead unlocks and Verified badges. */
export const RevenuePage = () => {
  const [leads, setLeads] = useState<LeadPaymentRow[]>([])
  const [badges, setBadges] = useState<BadgeRow[]>([])
  const [pricing, setPricing] = useState<PricingRow[]>([])
  const [loading, setLoading] = useState(partlyEnabled)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!partlyEnabled) return
    Promise.all([fetchLeadPayments(), fetchBadges(), fetchPricing()])
      .then(([l, b, p]) => {
        setLeads(l)
        setBadges(b)
        setPricing(p)
      })
      .catch((e) => setError(errMessage(e)))
      .finally(() => setLoading(false))
  }, [])

  const lView = useTableView(leads, (r, q) =>
    [r.candidate?.full_name, r.candidate?.email, r.job?.title, r.job?.company_name, r.status, r.currency].some((v) => lc(v).includes(q)),
  )
  const bView = useTableView(badges, (r, q) =>
    [r.candidate?.full_name, r.candidate?.email, r.status, r.currency].some((v) => lc(v).includes(q)),
  )

  const paidLeads = leads.filter((l) => l.status === 'paid')
  const paidBadges = badges.filter((b) => b.purchased_at)
  const leadUsd = paidLeads.reduce((s, l) => s + Number(l.amount_usd), 0)
  const badgeUsd = paidBadges.reduce((s, b) => s + Number(b.amount_usd), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold text-ink">Lead & badge revenue</h1>
        <p className="text-[13px] text-muted">USD figures are the reference equivalents; local amounts are what was actually charged.</p>
      </div>

      {!partlyEnabled && <Card className="p-6 text-[13px] text-muted">Connect Supabase to see revenue.</Card>}
      {error && <Card className="border-danger/40 p-4 text-[13px] text-danger">{error}</Card>}

      <div className="grid gap-4 md:grid-cols-3">
        <Stat icon={<IconDollar width={18} height={18} />} label="Lead unlocks (paid)" value={`${paidLeads.length} · ${usd(leadUsd)}`} tint="bg-success/15 text-success" />
        <Stat icon={<IconStar width={18} height={18} />} label="Badges sold (incl. renewals)" value={`${paidBadges.length} · ${usd(badgeUsd)}`} tint="bg-brand/15 text-brand-2" />
        <Stat icon={<IconTrend width={18} height={18} />} label="Active badges" value={String(badges.filter((b) => b.status === 'active').length)} tint="bg-warning/15 text-warning" />
      </div>

      <ListCard title="Lead unlock payments" range={`${lView.filtered.length}`} toolbar={<TableSearch value={lView.query} onChange={lView.setQuery} />}>
        <table className="w-full min-w-[900px] text-left text-[13px]">
          <thead className="border-b border-line text-muted">
            <tr>
              <th className={thCls}>Expert</th>
              <th className={thCls}>Posting</th>
              <th className={thCls}>Charged</th>
              <th className={thCls}>USD ref.</th>
              <th className={thCls}>Status</th>
              <th className={thCls}>Paid</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-muted">Loading…</td></tr>
            ) : lView.paged.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-muted">No lead payments yet.</td></tr>
            ) : (
              lView.paged.map((r) => (
                <tr key={r.id}>
                  <td className={tdCls}>
                    <span className="block font-semibold text-ink">{r.candidate?.full_name ?? 'Unknown'}</span>
                    <span className="block text-[12px] text-muted">{r.candidate?.email ?? ''}</span>
                  </td>
                  <td className={tdCls}>
                    <span className="block text-ink">{r.job?.title ?? '—'}</span>
                    <span className="block text-[12px] text-muted">{r.job?.company_name ?? ''}</span>
                  </td>
                  <td className={tdCls}>
                    {r.pay_currency === 'usd' ? usd(r.amount_usd) : `${r.currency} ${Number(r.amount_local).toLocaleString()}`}
                    <span className="block text-[12px] text-muted">{bothLine(pricing, r)} · paid in {r.pay_currency}</span>
                  </td>
                  <td className={tdCls}>{usd(r.amount_usd)}</td>
                  <td className={tdCls}><Pill value={r.status} /></td>
                  <td className={tdCls}>{fmt(r.paid_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="px-6 pb-5">
          <Pagination page={lView.page} pageSize={lView.pageSize} total={lView.filtered.length} onPageChange={lView.setPage} onPageSizeChange={lView.setPageSize} pageSizeOptions={PAGE_SIZES} />
        </div>
      </ListCard>

      <ListCard title="Verified badges" range={`${bView.filtered.length}`} toolbar={<TableSearch value={bView.query} onChange={bView.setQuery} />}>
        <table className="w-full min-w-[900px] text-left text-[13px]">
          <thead className="border-b border-line text-muted">
            <tr>
              <th className={thCls}>Expert</th>
              <th className={thCls}>Kind</th>
              <th className={thCls}>Charged</th>
              <th className={thCls}>Status</th>
              <th className={thCls}>Purchased</th>
              <th className={thCls}>Expires</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-muted">Loading…</td></tr>
            ) : bView.paged.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-muted">No badges yet.</td></tr>
            ) : (
              bView.paged.map((r) => (
                <tr key={r.id}>
                  <td className={tdCls}>
                    <span className="block font-semibold text-ink">{r.candidate?.full_name ?? 'Unknown'}</span>
                    <span className="block text-[12px] text-muted">{r.candidate?.email ?? ''}</span>
                  </td>
                  <td className={tdCls}>{r.renewed_from ? 'Renewal' : 'First purchase'}</td>
                  <td className={tdCls}>
                    {r.pay_currency === 'usd' ? usd(r.amount_usd) : `${r.currency} ${Number(r.amount_local).toLocaleString()}`}
                    <span className="block text-[12px] text-muted">{bothLine(pricing, r)} · paid in {r.pay_currency}</span>
                  </td>
                  <td className={tdCls}><Pill value={r.status} /></td>
                  <td className={tdCls}>{fmt(r.purchased_at)}</td>
                  <td className={tdCls}>{fmt(r.expires_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="px-6 pb-5">
          <Pagination page={bView.page} pageSize={bView.pageSize} total={bView.filtered.length} onPageChange={bView.setPage} onPageSizeChange={bView.setPageSize} pageSizeOptions={PAGE_SIZES} />
        </div>
      </ListCard>
    </div>
  )
}
