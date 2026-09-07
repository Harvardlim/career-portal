import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Card } from '../components/ui'
import {
  ListCard,
  Pagination,
  PAGE_SIZES,
  TableSearch,
  lc,
  useTableView,
} from '../components/ListShell'
import { IconDollar, IconBriefcase, IconTag, IconTrend } from '../components/Icons'
import {
  fetchCreditBalances,
  fetchMemberships,
  fetchPurchases,
  financeEnabled,
  type CreditBalance,
  type Membership,
  type Purchase,
} from '../lib/finance'

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(n || 0)

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—'

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

const StatusPill = ({ value }: { value: string }) => {
  const tone =
    value === 'paid' || value === 'active'
      ? 'bg-success/12 text-success'
      : value === 'refunded' || value === 'cancelled' || value === 'expired'
        ? 'bg-danger/12 text-danger'
        : 'bg-white/[0.05] text-muted'
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-[12px] font-medium capitalize ${tone}`}
    >
      {value}
    </span>
  )
}

const thCls = 'px-3 py-3 font-medium first:pl-6 last:pr-6'
const tdCls = 'px-3 py-4 first:pl-6 last:pr-6'

const EmptyRow = ({ span, label }: { span: number; label: string }) => (
  <tr>
    <td colSpan={span} className="px-6 py-10 text-center text-[13px] text-muted">
      {label}
    </td>
  </tr>
)

const CreditsBadge = ({ n }: { n: number }) => (
  <span
    className={`inline-flex items-center rounded-md px-2 py-1 text-[12px] font-semibold ${
      n > 0 ? 'bg-brand/15 text-brand' : 'bg-white/[0.05] text-muted'
    }`}
  >
    {n}
  </span>
)

export const FinancePage = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [balances, setBalances] = useState<CreditBalance[]>([])
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [loading, setLoading] = useState(financeEnabled)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!financeEnabled) return
    let alive = true
    Promise.all([fetchPurchases(), fetchCreditBalances(), fetchMemberships()])
      .then(([p, b, m]) => {
        if (!alive) return
        setPurchases(p)
        setBalances(b)
        setMemberships(m)
      })
      .catch((e: unknown) => alive && setError(errMessage(e)))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  const stats = useMemo(() => {
    const creditRevenue = purchases
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount_usd), 0)
    const membershipRevenue = memberships
      .filter((m) => m.status === 'active')
      .reduce((sum, m) => sum + Number(m.amount_usd), 0)
    const creditsOutstanding = balances.reduce(
      (sum, b) => sum + Math.max(0, b.credits_left),
      0,
    )
    const payingEmployers = balances.filter((b) => b.credits_purchased > 0).length
    return {
      totalRevenue: creditRevenue + membershipRevenue,
      creditsOutstanding,
      payingEmployers,
      payingMembers: memberships.filter((m) => m.status === 'active').length,
    }
  }, [purchases, balances, memberships])

  const purchasesView = useTableView(purchases, (p, q) =>
    [p.employer?.company_name, p.employer?.business_email, p.package, p.status].some((v) =>
      lc(v).includes(q),
    ),
  )
  const balancesView = useTableView(balances, (b, q) =>
    [b.company_name, b.business_email].some((v) => lc(v).includes(q)),
  )
  const membershipsView = useTableView(memberships, (m, q) =>
    [m.candidate?.full_name, m.candidate?.email, m.plan, m.status].some((v) => lc(v).includes(q)),
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold text-ink">Finance</h1>
        <p className="mt-1 text-[13px] text-muted">
          Credit purchases, memberships, and each employer&apos;s remaining balance.
        </p>
      </div>

      {!financeEnabled ? (
        <Card className="p-6 text-[13px] text-ink-200">
          <p className="font-semibold text-ink">Connect Supabase to see finance data</p>
          <p className="mt-1 text-muted">
            Set <code className="text-ink-200">VITE_SUPABASE_URL</code> and{' '}
            <code className="text-ink-200">VITE_SUPABASE_PUBLISHABLE_KEY</code> in{' '}
            <code className="text-ink-200">backoffice/.env.local</code>, then run the{' '}
            <code className="text-ink-200">20260903160000_finance.sql</code> migration.
          </p>
        </Card>
      ) : (
        <>
          {error ? (
            <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-[13px] text-danger">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<IconDollar width={18} height={18} />}
              label="Total revenue"
              value={usd(stats.totalRevenue)}
              tint="bg-success/15 text-success"
            />
            <StatCard
              icon={<IconTag width={18} height={18} />}
              label="Credits outstanding"
              value={stats.creditsOutstanding}
              tint="bg-brand/15 text-brand"
            />
            <StatCard
              icon={<IconBriefcase width={18} height={18} />}
              label="Paying employers"
              value={stats.payingEmployers}
              tint="bg-cyan/15 text-cyan"
            />
            <StatCard
              icon={<IconTrend width={18} height={18} />}
              label="Active members"
              value={stats.payingMembers}
              tint="bg-white/[0.05] text-ink-200"
            />
          </div>

          {/* Who purchased -- credit packages */}
          <ListCard
            title="Credit Purchases"
            range={loading ? 'Loading…' : `${purchasesView.filtered.length} of ${purchases.length}`}
            toolbar={
              <TableSearch
                value={purchasesView.query}
                onChange={purchasesView.setQuery}
                placeholder="Search employer, package…"
              />
            }
          >
            <table className="w-full min-w-[820px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-y border-line text-[12px] text-muted">
                  <th className={thCls}>Employer</th>
                  <th className={thCls}>Package</th>
                  <th className={thCls}>Amount</th>
                  <th className={thCls}>Credits</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Date</th>
                </tr>
              </thead>
              <tbody>
                {!loading && purchasesView.paged.length === 0 ? (
                  <EmptyRow span={6} label={purchases.length === 0 ? 'No credit purchases yet.' : 'No matches.'} />
                ) : (
                  purchasesView.paged.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-line/60 last:border-0 hover:bg-white/[0.02]"
                    >
                      <td className={tdCls}>
                        <span className="block font-semibold text-ink">
                          {p.employer?.company_name ?? 'Unknown employer'}
                        </span>
                        <span className="block text-[12px] text-muted">
                          {p.employer?.business_email ?? p.employer_id}
                        </span>
                      </td>
                      <td className={`${tdCls} text-ink-200`}>{p.package}</td>
                      <td className={`${tdCls} font-medium text-ink`}>
                        {usd(Number(p.amount_usd))}
                      </td>
                      <td className={tdCls}>
                        <CreditsBadge n={p.credits} />
                      </td>
                      <td className={tdCls}>
                        <StatusPill value={p.status} />
                      </td>
                      <td className={`${tdCls} whitespace-nowrap text-muted`}>
                        {fmtDate(p.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </ListCard>
          {!loading && purchasesView.filtered.length > 0 ? (
            <Pagination
              page={purchasesView.page}
              pageSize={purchasesView.pageSize}
              total={purchasesView.filtered.length}
              onPageChange={purchasesView.setPage}
              onPageSizeChange={purchasesView.setPageSize}
              pageSizeOptions={PAGE_SIZES}
            />
          ) : null}

          {/* Credits left per employer */}
          <ListCard
            title="Employer Credit Balances"
            range={loading ? 'Loading…' : `${balancesView.filtered.length} of ${balances.length}`}
            toolbar={
              <TableSearch
                value={balancesView.query}
                onChange={balancesView.setQuery}
                placeholder="Search employer…"
              />
            }
          >
            <table className="w-full min-w-[820px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-y border-line text-[12px] text-muted">
                  <th className={thCls}>Employer</th>
                  <th className={thCls}>Purchased</th>
                  <th className={thCls}>Used</th>
                  <th className={thCls}>Left</th>
                  <th className={thCls}>Spent</th>
                  <th className={thCls}>Last purchase</th>
                </tr>
              </thead>
              <tbody>
                {!loading && balancesView.paged.length === 0 ? (
                  <EmptyRow span={6} label={balances.length === 0 ? 'No employers yet.' : 'No matches.'} />
                ) : (
                  balancesView.paged.map((b) => (
                    <tr
                      key={b.employer_id}
                      className="border-b border-line/60 last:border-0 hover:bg-white/[0.02]"
                    >
                      <td className={tdCls}>
                        <span className="block font-semibold text-ink">
                          {b.company_name ?? 'Unknown employer'}
                        </span>
                        <span className="block text-[12px] text-muted">
                          {b.business_email ?? b.employer_id}
                        </span>
                      </td>
                      <td className={`${tdCls} text-ink-200`}>{b.credits_purchased}</td>
                      <td className={`${tdCls} text-ink-200`}>{b.credits_used}</td>
                      <td className={tdCls}>
                        <CreditsBadge n={b.credits_left} />
                      </td>
                      <td className={`${tdCls} text-ink-200`}>
                        {usd(Number(b.total_spent_usd))}
                      </td>
                      <td className={`${tdCls} whitespace-nowrap text-muted`}>
                        {fmtDate(b.last_purchase_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </ListCard>
          {!loading && balancesView.filtered.length > 0 ? (
            <Pagination
              page={balancesView.page}
              pageSize={balancesView.pageSize}
              total={balancesView.filtered.length}
              onPageChange={balancesView.setPage}
              onPageSizeChange={balancesView.setPageSize}
              pageSizeOptions={PAGE_SIZES}
            />
          ) : null}

          {/* Candidate memberships */}
          <ListCard
            title="Candidate Memberships"
            range={loading ? 'Loading…' : `${membershipsView.filtered.length} of ${memberships.length}`}
            toolbar={
              <TableSearch
                value={membershipsView.query}
                onChange={membershipsView.setQuery}
                placeholder="Search candidate, plan…"
              />
            }
          >
            <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-y border-line text-[12px] text-muted">
                  <th className={thCls}>Candidate</th>
                  <th className={thCls}>Plan</th>
                  <th className={thCls}>Amount</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Started</th>
                </tr>
              </thead>
              <tbody>
                {!loading && membershipsView.paged.length === 0 ? (
                  <EmptyRow span={5} label={memberships.length === 0 ? 'No memberships yet.' : 'No matches.'} />
                ) : (
                  membershipsView.paged.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-line/60 last:border-0 hover:bg-white/[0.02]"
                    >
                      <td className={tdCls}>
                        <span className="block font-semibold text-ink">
                          {m.candidate?.full_name ?? 'Unknown candidate'}
                        </span>
                        <span className="block text-[12px] text-muted">
                          {m.candidate?.email ?? m.candidate_id}
                        </span>
                      </td>
                      <td className={`${tdCls} text-ink-200`}>{m.plan}</td>
                      <td className={`${tdCls} font-medium text-ink`}>
                        {usd(Number(m.amount_usd))}
                      </td>
                      <td className={tdCls}>
                        <StatusPill value={m.status === 'active' ? 'paid' : m.status} />
                      </td>
                      <td className={`${tdCls} whitespace-nowrap text-muted`}>
                        {fmtDate(m.started_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </ListCard>
          {!loading && membershipsView.filtered.length > 0 ? (
            <Pagination
              page={membershipsView.page}
              pageSize={membershipsView.pageSize}
              total={membershipsView.filtered.length}
              onPageChange={membershipsView.setPage}
              onPageSizeChange={membershipsView.setPageSize}
              pageSizeOptions={PAGE_SIZES}
            />
          ) : null}
        </>
      )}
    </div>
  )
}

function errMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === 'object' && e && 'message' in e)
    return String((e as { message: unknown }).message)
  return 'Something went wrong'
}
