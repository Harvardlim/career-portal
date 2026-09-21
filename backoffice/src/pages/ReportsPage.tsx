import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ListCard, Pagination, PAGE_SIZES, TableSearch, lc, useTableView } from '../components/ListShell'
import { Button, Card } from '../components/ui'
import { useAdminSession } from '../lib/admin'
import { fetchReports, partlyEnabled, updateReportStatus, type ReportRow } from '../lib/partly'

const thCls = 'px-3 py-3 font-medium first:pl-6 last:pr-6'
const tdCls = 'px-3 py-4 align-top first:pl-6 last:pr-6'
const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
const errMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong')

const KIND_LABEL: Record<ReportRow['target_kind'], string> = { job: 'Posting', employer: 'Business', candidate: 'Expert' }

const targetHref = (r: ReportRow): string | null => {
  if (r.target_kind === 'candidate') return `/users/candidates/${r.target_id}`
  if (r.target_kind === 'employer') return `/users/employers/${r.target_id}`
  return `/jobs/edit/${r.target_id}`
}

const Pill = ({ value }: { value: ReportRow['status'] }) => {
  const tone = value === 'open' ? 'bg-warning/15 text-warning' : value === 'reviewed' ? 'bg-success/12 text-success' : 'bg-white/[0.05] text-muted'
  return <span className={`inline-flex rounded-md px-2 py-1 text-[12px] font-medium capitalize ${tone}`}>{value}</span>
}

/** Reports filed against a posting, a business, or an expert. Anyone can file one; staff triage here. */
export const ReportsPage = () => {
  const session = useAdminSession()
  const [rows, setRows] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(partlyEnabled)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'open' | 'all'>('open')
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      setRows(await fetchReports())
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

  const visible = filter === 'open' ? rows.filter((r) => r.status === 'open') : rows
  const view = useTableView(visible, (r, q) => [r.reason, r.details, r.reporter_email, r.target_label, r.target_kind].some((v) => lc(v).includes(q)))

  async function setStatus(r: ReportRow, status: ReportRow['status']) {
    if (!session) return
    setBusyId(r.id)
    try {
      await updateReportStatus(r.id, status, session.id)
      await load()
    } catch (e) {
      setError(errMessage(e))
    } finally {
      setBusyId(null)
    }
  }

  const openCount = rows.filter((r) => r.status === 'open').length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-ink">Reports</h1>
          <p className="text-[13px] text-muted">{openCount} open · filed against postings, businesses and experts</p>
        </div>
        <div className="flex gap-2">
          {(['open', 'all'] as const).map((f) => (
            <Button key={f} variant={filter === f ? 'primary' : 'ghost'} onClick={() => setFilter(f)}>
              {f === 'open' ? 'Open' : 'All'}
            </Button>
          ))}
        </div>
      </div>

      {!partlyEnabled && <Card className="p-6 text-[13px] text-muted">Connect Supabase to see reports.</Card>}
      {error && <Card className="border-danger/40 p-4 text-[13px] text-danger">{error}</Card>}

      <ListCard title="Reports" range={`${view.filtered.length}`} toolbar={<TableSearch value={view.query} onChange={view.setQuery} placeholder="Search reason, target…" />}>
        <table className="w-full min-w-[980px] text-left text-[13px]">
          <thead className="border-b border-line text-muted">
            <tr>
              <th className={thCls}>Target</th>
              <th className={thCls}>Reason</th>
              <th className={thCls}>Reporter</th>
              <th className={thCls}>Filed</th>
              <th className={thCls}>Status</th>
              <th className={thCls}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-muted">Loading…</td></tr>
            ) : view.paged.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-muted">Nothing to review.</td></tr>
            ) : (
              view.paged.map((r) => {
                const href = targetHref(r)
                return (
                  <tr key={r.id}>
                    <td className={tdCls}>
                      <span className="block text-[12px] text-muted">{KIND_LABEL[r.target_kind]}</span>
                      {href ? (
                        <Link to={href} className="font-semibold text-ink hover:text-brand-2">{r.target_label ?? 'Unknown'}</Link>
                      ) : (
                        <span className="font-semibold text-ink">{r.target_label ?? 'Unknown'}</span>
                      )}
                    </td>
                    <td className={tdCls}>
                      <span className="block text-ink">{r.reason}</span>
                      {r.details && <span className="mt-1 block max-w-[280px] text-[12px] text-muted">{r.details}</span>}
                    </td>
                    <td className={tdCls}>{r.reporter_email ?? 'Anonymous'}</td>
                    <td className={tdCls}>{fmt(r.created_at)}</td>
                    <td className={tdCls}><Pill value={r.status} /></td>
                    <td className={tdCls}>
                      {r.status === 'open' && (
                        <div className="flex gap-2">
                          <Button disabled={busyId === r.id} onClick={() => setStatus(r, 'reviewed')}>Mark reviewed</Button>
                          <Button variant="ghost" disabled={busyId === r.id} onClick={() => setStatus(r, 'dismissed')}>Dismiss</Button>
                        </div>
                      )}
                      {r.status !== 'open' && <span className="text-muted">{fmt(r.reviewed_at)}</span>}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        <div className="px-6 pb-5">
          <Pagination page={view.page} pageSize={view.pageSize} total={view.filtered.length} onPageChange={view.setPage} onPageSizeChange={view.setPageSize} pageSizeOptions={PAGE_SIZES} />
        </div>
      </ListCard>
    </div>
  )
}
