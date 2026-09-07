import { useEffect, useState, type ReactNode } from 'react'
import { Card } from '../components/ui'
import {
  ListCard,
  Pagination,
  PAGE_SIZES,
  TableSearch,
  lc,
  useTableView,
} from '../components/ListShell'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { IconDollar, IconUsers, IconTrend, IconTag } from '../components/Icons'
import {
  affiliatesEnabled,
  fetchAffiliateData,
  setCommissionPaid,
  type Affiliate,
  type AffiliateData,
  type AffiliateReferral,
} from '../lib/affiliates'

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : '—'

function errMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === 'object' && e && 'message' in e) return String((e as { message: unknown }).message)
  return 'Something went wrong'
}

const thCls = 'px-3 py-3 font-medium first:pl-6 last:pr-6'
const tdCls = 'px-3 py-4 align-top first:pl-6 last:pr-6'

const StatCard = ({
  icon,
  label,
  value,
  tint,
}: {
  icon: ReactNode
  label: string
  value: string | number
  tint: string
}) => (
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

const EmptyRow = ({ span, label }: { span: number; label: string }) => (
  <tr>
    <td colSpan={span} className="px-6 py-10 text-center text-[13px] text-muted">
      {label}
    </td>
  </tr>
)

const StatusPill = ({ value }: { value: string }) => {
  const tone =
    value === 'paid'
      ? 'bg-success/12 text-success'
      : value === 'earned'
        ? 'bg-brand/15 text-brand-2'
        : 'bg-white/[0.05] text-muted'
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-[12px] font-medium capitalize ${tone}`}
    >
      {value}
    </span>
  )
}

const Who = ({ name, sub }: { name: string | null; sub: string }) => (
  <>
    <span className="block font-semibold text-ink">{name ?? 'Unknown'}</span>
    <span className="block text-[12px] text-muted">{sub}</span>
  </>
)

export const AffiliatePage = () => {
  const [data, setData] = useState<AffiliateData | null>(null)
  const [loading, setLoading] = useState(affiliatesEnabled)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<AffiliateReferral | null>(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      setData(await fetchAffiliateData())
      setError(null)
    } catch (e) {
      setError(errMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!affiliatesEnabled) return
    void load()
  }, [])

  const affiliates: Affiliate[] = data?.affiliates ?? []
  // Only rows with a recognised commission are payable.
  const payable = (data?.referrals ?? []).filter(
    (r) => r.commission_usd != null && r.commission_status !== 'pending',
  )

  const affView = useTableView(affiliates, (a, q) =>
    [a.name, a.email, a.referral_code].some((v) => lc(v).includes(q)),
  )
  const payView = useTableView(payable, (r, q) =>
    [r.affiliate_name, r.affiliate_code, r.purchase_ref, r.referred_role, r.commission_status].some(
      (v) => lc(v).includes(q),
    ),
  )

  async function confirmToggle() {
    if (!pending) return
    setBusy(true)
    setActionError(null)
    const markPaid = pending.commission_status !== 'paid'
    try {
      await setCommissionPaid(pending.id, markPaid)
      setPending(null)
      await load()
    } catch (e) {
      setActionError(errMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold text-ink">Affiliate</h1>
        <p className="mt-1 text-[13px] text-muted">
          Referral commissions and payouts. Mark a commission as paid once the money is sent.
        </p>
      </div>

      {!affiliatesEnabled ? (
        <Card className="p-6 text-[14px] text-muted">Connect Supabase to see affiliate data.</Card>
      ) : (
        <>
          {error ? (
            <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-[13px] text-danger">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<IconUsers width={18} height={18} />}
              label="Affiliates"
              value={data?.totals.affiliates ?? 0}
              tint="bg-brand/15 text-brand"
            />
            <StatCard
              icon={<IconTrend width={18} height={18} />}
              label="Commission earned"
              value={usd(data?.totals.earned ?? 0)}
              tint="bg-cyan/15 text-cyan"
            />
            <StatCard
              icon={<IconDollar width={18} height={18} />}
              label="Paid out"
              value={usd(data?.totals.paid ?? 0)}
              tint="bg-success/15 text-success"
            />
            <StatCard
              icon={<IconTag width={18} height={18} />}
              label="Outstanding"
              value={usd(data?.totals.owed ?? 0)}
              tint="bg-warning/15 text-warning"
            />
          </div>

          {/* Per-affiliate summary */}
          <ListCard
            title="Affiliates"
            range={loading ? 'Loading…' : `${affView.filtered.length} of ${affiliates.length}`}
            toolbar={
              <TableSearch
                value={affView.query}
                onChange={affView.setQuery}
                placeholder="Search name, code…"
              />
            }
          >
            <table className="w-full min-w-[820px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-y border-line text-[12px] text-muted">
                  <th className={thCls}>Affiliate</th>
                  <th className={thCls}>Code</th>
                  <th className={thCls}>Joined</th>
                  <th className={thCls}>Referrals</th>
                  <th className={thCls}>Earned</th>
                  <th className={thCls}>Paid</th>
                  <th className={thCls}>Owed</th>
                </tr>
              </thead>
              <tbody>
                {!loading && affView.paged.length === 0 ? (
                  <EmptyRow
                    span={7}
                    label={affiliates.length === 0 ? 'No affiliates yet.' : 'No matches.'}
                  />
                ) : (
                  affView.paged.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-line/60 last:border-0 hover:bg-white/[0.02]"
                    >
                      <td className={tdCls}>
                        <Who name={a.name} sub={a.email ?? a.user_id} />
                      </td>
                      <td className={`${tdCls} font-mono text-ink-200`}>{a.referral_code}</td>
                      <td className={`${tdCls} whitespace-nowrap text-muted`}>
                        {fmtDate(a.joined_at)}
                      </td>
                      <td className={`${tdCls} text-ink-200`}>{a.referrals}</td>
                      <td className={`${tdCls} text-ink-200`}>{usd(a.earned)}</td>
                      <td className={`${tdCls} text-ink-200`}>{usd(a.paid)}</td>
                      <td className={`${tdCls} font-medium ${a.owed > 0 ? 'text-warning' : 'text-ink'}`}>
                        {usd(a.owed)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </ListCard>
          {!loading ? (
            <Pagination
              page={affView.page}
              pageSize={affView.pageSize}
              total={affView.filtered.length}
              onPageChange={affView.setPage}
              onPageSizeChange={affView.setPageSize}
              pageSizeOptions={PAGE_SIZES}
            />
          ) : null}

          {/* Commission ledger / payouts */}
          <ListCard
            title="Commission Payouts"
            range={loading ? 'Loading…' : `${payView.filtered.length} of ${payable.length}`}
            toolbar={
              <TableSearch
                value={payView.query}
                onChange={payView.setQuery}
                placeholder="Search affiliate, plan…"
              />
            }
          >
            <table className="w-full min-w-[900px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-y border-line text-[12px] text-muted">
                  <th className={thCls}>Affiliate</th>
                  <th className={thCls}>Referred</th>
                  <th className={thCls}>Plan / package</th>
                  <th className={thCls}>Amount</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Earned</th>
                  <th className={thCls} aria-label="Action" />
                </tr>
              </thead>
              <tbody>
                {!loading && payView.paged.length === 0 ? (
                  <EmptyRow
                    span={7}
                    label={payable.length === 0 ? 'No commissions to pay yet.' : 'No matches.'}
                  />
                ) : (
                  payView.paged.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-line/60 last:border-0 hover:bg-white/[0.02]"
                    >
                      <td className={tdCls}>
                        <Who name={r.affiliate_name} sub={r.affiliate_code} />
                      </td>
                      <td className={`${tdCls} capitalize text-ink-200`}>{r.referred_role}</td>
                      <td className={`${tdCls} text-ink-200`}>
                        {r.purchase_ref ?? r.purchase_source ?? '—'}
                      </td>
                      <td className={`${tdCls} font-medium text-ink`}>{usd(r.commission_usd ?? 0)}</td>
                      <td className={tdCls}>
                        <StatusPill value={r.commission_status} />
                      </td>
                      <td className={`${tdCls} whitespace-nowrap text-muted`}>
                        {fmtDate(r.earned_at ?? r.referred_at)}
                      </td>
                      <td className={`${tdCls} text-right`}>
                        {r.commission_status === 'paid' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActionError(null)
                              setPending(r)
                            }}
                            className="text-[12px] font-medium text-muted hover:text-ink-200"
                          >
                            Mark unpaid
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setActionError(null)
                              setPending(r)
                            }}
                            className="rounded-lg bg-success/15 px-3 py-1.5 text-[12px] font-semibold text-success hover:bg-success/25"
                          >
                            Mark paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </ListCard>
          {!loading ? (
            <Pagination
              page={payView.page}
              pageSize={payView.pageSize}
              total={payView.filtered.length}
              onPageChange={payView.setPage}
              onPageSizeChange={payView.setPageSize}
              pageSizeOptions={PAGE_SIZES}
            />
          ) : null}
        </>
      )}

      <ConfirmDialog
        open={pending !== null}
        tone={pending?.commission_status === 'paid' ? 'danger' : 'default'}
        title={pending?.commission_status === 'paid' ? 'Mark commission unpaid' : 'Mark commission paid'}
        message={
          pending ? (
            <>
              {pending.commission_status === 'paid' ? 'Revert' : 'Confirm you have sent'}{' '}
              <strong className="text-ink-200">{usd(pending.commission_usd ?? 0)}</strong> to{' '}
              <strong className="text-ink-200">{pending.affiliate_name ?? pending.affiliate_code}</strong>
              {pending.commission_status === 'paid'
                ? ' — it will move back to "earned".'
                : '.'}
            </>
          ) : null
        }
        confirmLabel={pending?.commission_status === 'paid' ? 'Mark unpaid' : 'Mark paid'}
        busy={busy}
        error={actionError}
        onConfirm={confirmToggle}
        onCancel={() => setPending(null)}
      />
    </div>
  )
}
