import { useEffect, useState } from 'react'
import { ListCard, Pagination, PAGE_SIZES, TableSearch, lc, useTableView } from '../components/ListShell'
import { Button, Card } from '../components/ui'
import { useAdminSession } from '../lib/admin'
import { fetchIssueReports, partlyEnabled, updateIssueStatus, type IssueRow } from '../lib/partly'

const thCls = 'px-3 py-3 font-medium first:pl-6 last:pr-6'
const tdCls = 'px-3 py-4 align-top first:pl-6 last:pr-6'
const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ','
const errMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong')

const CATEGORY_LABEL: Record<IssueRow['category'], string> = {
  bug: 'Bug',
  payment: 'Payment',
  account: 'Account',
  suggestion: 'Suggestion',
  other: 'Other',
}

const STATUS_LABEL: Record<IssueRow['status'], string> = { open: 'Open', in_progress: 'In progress', resolved: 'Resolved' }

const Pill = ({ value }: { value: IssueRow['status'] }) => {
  const tone =
    value === 'open' ? 'bg-warning/15 text-warning' : value === 'in_progress' ? 'bg-brand-2/15 text-brand-2' : 'bg-success/12 text-success'
  return <span className={`inline-flex whitespace-nowrap rounded-md px-2 py-1 text-[12px] font-medium ${tone}`}>{STATUS_LABEL[value]}</span>
}

const pagePath = (url: string | null) => {
  if (!url) return null
  try {
    const u = new URL(url)
    return u.pathname + u.search
  } catch {
    return url
  }
}

/** "Report an issue" submissions from signed-in experts and businesses. */
export const IssuesPage = () => {
  const session = useAdminSession()
  const [rows, setRows] = useState<IssueRow[]>([])
  const [loading, setLoading] = useState(partlyEnabled)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'active' | 'all'>('active')
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      setRows(await fetchIssueReports())
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

  const visible = filter === 'active' ? rows.filter((r) => r.status !== 'resolved') : rows
  const view = useTableView(visible, (r, q) =>
    [r.message, r.user_email, r.category, r.user_role, r.page_url].some((v) => lc(v).includes(q)),
  )

  async function setStatus(r: IssueRow, status: IssueRow['status']) {
    if (!session) return
    setBusyId(r.id)
    try {
      await updateIssueStatus(r.id, status, session.id)
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
          <h1 className="text-[22px] font-semibold text-ink">Issue reports</h1>
          <p className="text-[13px] text-muted">{openCount} open · sent from the “Report an issue” button by signed-in users</p>
        </div>
        <div className="flex gap-2">
          {(['active', 'all'] as const).map((f) => (
            <Button key={f} variant={filter === f ? 'primary' : 'ghost'} onClick={() => setFilter(f)}>
              {f === 'active' ? 'Unresolved' : 'All'}
            </Button>
          ))}
        </div>
      </div>

      {!partlyEnabled && <Card className="p-6 text-[13px] text-muted">Connect Supabase to see issue reports.</Card>}
      {error && <Card className="border-danger/40 p-4 text-[13px] text-danger">{error}</Card>}

      <ListCard title="Issue reports" range={`${view.filtered.length}`} toolbar={<TableSearch value={view.query} onChange={view.setQuery} placeholder="Search message, user, page…" />}>
        <table className="w-full min-w-[1000px] text-left text-[13px]">
          <thead className="border-b border-line text-muted">
            <tr>
              <th className={thCls}>Issue</th>
              <th className={thCls}>From</th>
              <th className={thCls}>Page</th>
              <th className={thCls}>Filed</th>
              <th className={thCls}>Status</th>
              <th className={thCls}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-muted">Loading…</td></tr>
            ) : view.paged.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-muted">No issues reported.</td></tr>
            ) : (
              view.paged.map((r) => (
                <tr key={r.id}>
                  <td className={tdCls}>
                    <span className="block text-[12px] font-medium text-brand-2">{CATEGORY_LABEL[r.category]}</span>
                    <span className="mt-1 block max-w-[380px] whitespace-pre-wrap break-words text-ink">{r.message}</span>
                  </td>
                  <td className={tdCls}>
                    <span className="block text-ink">{r.user_email ?? 'Unknown'}</span>
                    <span className="block text-[12px] capitalize text-muted">{r.user_role ?? 'No profile yet'}</span>
                  </td>
                  <td className={tdCls}>
                    <span className="block max-w-[200px] break-all text-[12px] text-muted" title={r.user_agent ?? undefined}>
                      {pagePath(r.page_url) ?? ','}
                    </span>
                  </td>
                  <td className={tdCls}>{fmt(r.created_at)}</td>
                  <td className={tdCls}>
                    <Pill value={r.status} />
                    {r.status === 'resolved' && <span className="mt-1 block text-[12px] text-muted">{fmt(r.resolved_at)}</span>}
                  </td>
                  <td className={tdCls}>
                    <div className="flex flex-wrap gap-2">
                      {r.status === 'open' && (
                        <Button variant="ghost" disabled={busyId === r.id} onClick={() => setStatus(r, 'in_progress')}>Start</Button>
                      )}
                      {r.status !== 'resolved' ? (
                        <Button disabled={busyId === r.id} onClick={() => setStatus(r, 'resolved')}>Resolve</Button>
                      ) : (
                        <Button variant="ghost" disabled={busyId === r.id} onClick={() => setStatus(r, 'open')}>Reopen</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
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
