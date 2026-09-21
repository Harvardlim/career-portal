import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ListCard, Pagination, PAGE_SIZES, TableSearch, lc, useTableView } from '../components/ListShell'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Button, Card, controlClass } from '../components/ui'
import { useAdminSession } from '../lib/admin'
import {
  adminClosePosting,
  fetchPostings,
  fetchReleases,
  partlyEnabled,
  setJobSuspended,
  type PostingRow,
  type ReleaseRow,
} from '../lib/partly'

const thCls = 'px-3 py-3 font-medium first:pl-6 last:pr-6'
const tdCls = 'px-3 py-4 align-top first:pl-6 last:pr-6'
const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
const errMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong')

const MATCHING: Record<string, { label: string; cls: string }> = {
  open: { label: 'Taking applications', cls: 'bg-brand/15 text-brand-2' },
  matched: { label: 'Matches drawn', cls: 'bg-success/12 text-success' },
  released: { label: 'Contact released', cls: 'bg-success/12 text-success' },
  no_further_matches: { label: 'No further matches', cls: 'bg-warning/15 text-warning' },
  closed: { label: 'Closed', cls: 'bg-white/[0.05] text-muted' },
}

const RELEASE: Record<string, { label: string; cls: string }> = {
  awaiting_payment: { label: 'Awaiting unlock', cls: 'bg-warning/15 text-warning' },
  paid: { label: 'Unlocked', cls: 'bg-success/12 text-success' },
  cold: { label: 'Went cold', cls: 'bg-white/[0.05] text-muted' },
  job_closed: { label: 'Job closed', cls: 'bg-white/[0.05] text-muted' },
}

const Pill = ({ map, value }: { map: Record<string, { label: string; cls: string }>; value: string }) => {
  const m = map[value] ?? { label: value, cls: 'bg-white/[0.05] text-muted' }
  return <span className={`inline-flex rounded-md px-2 py-1 text-[12px] font-medium ${m.cls}`}>{m.label}</span>
}

/** Postings (needs) and every contact release — the matching flow monitor. */
export const PostingsPage = () => {
  const session = useAdminSession()
  const [postings, setPostings] = useState<PostingRow[]>([])
  const [releases, setReleases] = useState<ReleaseRow[]>([])
  const [loading, setLoading] = useState(partlyEnabled)
  const [error, setError] = useState<string | null>(null)
  const [closing, setClosing] = useState<PostingRow | null>(null)
  const [suspending, setSuspending] = useState<PostingRow | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [p, r] = await Promise.all([fetchPostings(), fetchReleases()])
      setPostings(p)
      setReleases(r)
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

  const pView = useTableView(postings, (r, q) =>
    [r.title, r.company_name, r.category, r.country, r.matching_status].some((v) => lc(v).includes(q)),
  )
  const rView = useTableView(releases, (r, q) =>
    [r.job?.title, r.job?.company_name, r.candidate?.full_name, r.candidate?.email, r.status].some((v) => lc(v).includes(q)),
  )

  async function confirmClose() {
    if (!closing || !session) return
    setBusy(true)
    try {
      await adminClosePosting(closing.id, session.id)
      setClosing(null)
      await load()
    } catch (e) {
      setError(errMessage(e))
    } finally {
      setBusy(false)
    }
  }

  async function confirmSuspend() {
    if (!suspending || !session) return
    setBusy(true)
    try {
      await setJobSuspended(suspending.id, !suspending.suspended, reason.trim() || null, session.id)
      setSuspending(null)
      setReason('')
      await load()
    } catch (e) {
      setError(errMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const openWindows = releases.filter((r) => r.status === 'awaiting_payment' && r.window_open).length
  const unlocked = releases.filter((r) => r.status === 'paid').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold text-ink">Postings & leads</h1>
        <p className="text-[13px] text-muted">
          {postings.length} postings · {openWindows} open payment windows · {unlocked} contacts unlocked
        </p>
      </div>

      {!partlyEnabled && <Card className="p-6 text-[13px] text-muted">Connect Supabase to see postings.</Card>}
      {error && <Card className="border-danger/40 p-4 text-[13px] text-danger">{error}</Card>}

      <ListCard
        title="Postings"
        range={`${pView.filtered.length}`}
        toolbar={<TableSearch value={pView.query} onChange={pView.setQuery} placeholder="Search title, business…" />}
      >
        <table className="w-full min-w-[980px] text-left text-[13px]">
          <thead className="border-b border-line text-muted">
            <tr>
              <th className={thCls}>Posting</th>
              <th className={thCls}>Category · Country</th>
              <th className={thCls}>Status</th>
              <th className={thCls}>Applied</th>
              <th className={thCls}>Matches</th>
              <th className={thCls}>Released</th>
              <th className={thCls}>Unlocked</th>
              <th className={thCls}>Posted</th>
              <th className={thCls}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr><td colSpan={9} className="px-6 py-10 text-center text-muted">Loading…</td></tr>
            ) : pView.paged.length === 0 ? (
              <tr><td colSpan={9} className="px-6 py-10 text-center text-muted">No postings yet.</td></tr>
            ) : (
              pView.paged.map((r) => (
                <tr key={r.id}>
                  <td className={tdCls}>
                    <Link to={`/jobs/edit/${r.id}`} className="block font-semibold text-ink hover:text-brand-2">
                      {r.title}
                    </Link>
                    <span className="block text-[12px] text-muted">{r.company_name}</span>
                  </td>
                  <td className={tdCls}>
                    {r.category ?? '—'} · {r.country ?? '—'}
                    <span className="block text-[12px] text-muted">{r.project_type ?? ''}</span>
                  </td>
                  <td className={tdCls}>
                    <div className="flex flex-wrap gap-1">
                      <Pill map={MATCHING} value={r.matching_status} />
                      {r.suspended && <span className="inline-flex rounded-md bg-danger/12 px-2 py-1 text-[12px] font-medium text-danger">Suspended</span>}
                    </div>
                    {r.suspended && r.suspended_reason && <span className="mt-1 block text-[12px] text-muted">{r.suspended_reason}</span>}
                  </td>
                  <td className={tdCls}>{r.applications}</td>
                  <td className={tdCls}>{r.matches} / 10</td>
                  <td className={tdCls}>{r.released}</td>
                  <td className={tdCls}>{r.unlocked}</td>
                  <td className={tdCls}>{fmt(r.posted_at)}</td>
                  <td className={tdCls}>
                    <div className="flex flex-col items-start gap-1">
                      {r.matching_status !== 'closed' && (
                        <Button variant="ghost" onClick={() => setClosing(r)}>Close</Button>
                      )}
                      <Button variant="ghost" onClick={() => setSuspending(r)}>
                        {r.suspended ? 'Reinstate' : 'Suspend'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="px-6 pb-5">
          <Pagination page={pView.page} pageSize={pView.pageSize} total={pView.filtered.length} onPageChange={pView.setPage} onPageSizeChange={pView.setPageSize} pageSizeOptions={PAGE_SIZES} />
        </div>
      </ListCard>

      <ListCard
        title="Contact releases"
        range={`${rView.filtered.length}`}
        toolbar={<TableSearch value={rView.query} onChange={rView.setQuery} placeholder="Search expert, posting…" />}
      >
        <table className="w-full min-w-[980px] text-left text-[13px]">
          <thead className="border-b border-line text-muted">
            <tr>
              <th className={thCls}>Expert</th>
              <th className={thCls}>Posting</th>
              <th className={thCls}>Released</th>
              <th className={thCls}>Window ends</th>
              <th className={thCls}>Cohort</th>
              <th className={thCls}>Status</th>
              <th className={thCls}>Contact until</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-10 text-center text-muted">Loading…</td></tr>
            ) : rView.paged.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-10 text-center text-muted">No releases yet.</td></tr>
            ) : (
              rView.paged.map((r) => (
                <tr key={r.id}>
                  <td className={tdCls}>
                    <span className="block font-semibold text-ink">{r.candidate?.full_name ?? 'Unknown'}</span>
                    <span className="block text-[12px] text-muted">{r.candidate?.email ?? ''}{r.candidate?.country_code ? ` · ${r.candidate.country_code}` : ''}</span>
                  </td>
                  <td className={tdCls}>
                    <span className="block text-ink">{r.job?.title ?? '—'}</span>
                    <span className="block text-[12px] text-muted">{r.job?.company_name ?? ''}</span>
                  </td>
                  <td className={tdCls}>{fmt(r.released_at)}</td>
                  <td className={tdCls}>{fmt(r.window_expires_at)}</td>
                  <td className={tdCls}>{r.cohort_size}</td>
                  <td className={tdCls}>
                    <Pill map={RELEASE} value={r.status} />
                    {r.ended_reason && <span className="mt-1 block text-[12px] text-muted">{r.ended_reason}</span>}
                  </td>
                  <td className={tdCls}>{fmt(r.contact_expires_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="px-6 pb-5">
          <Pagination page={rView.page} pageSize={rView.pageSize} total={rView.filtered.length} onPageChange={rView.setPage} onPageSizeChange={rView.setPageSize} pageSizeOptions={PAGE_SIZES} />
        </div>
      </ListCard>

      <ConfirmDialog
        open={!!closing}
        title="Close posting"
        message={
          closing
            ? `Close "${closing.title}" on the business's behalf? Every open payment window ends immediately and those experts are told the lead went cold — nobody is charged.`
            : ''
        }
        confirmLabel="Close posting"
        busy={busy}
        onCancel={() => setClosing(null)}
        onConfirm={confirmClose}
      />

      <ConfirmDialog
        open={!!suspending}
        title={suspending?.suspended ? 'Reinstate posting' : 'Suspend posting'}
        message={
          <div className="space-y-3">
            <p>
              {suspending
                ? suspending.suspended
                  ? `Make "${suspending.title}" visible again on Open Needs and the job board.`
                  : `Hide "${suspending.title}" from every public listing immediately. The business can still see it in their dashboard, marked suspended.`
                : ''}
            </p>
            {!suspending?.suspended && (
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Reason shown to the business (optional)"
                className={`${controlClass} h-auto py-2`}
              />
            )}
          </div>
        }
        confirmLabel={suspending?.suspended ? 'Reinstate' : 'Suspend'}
        tone={suspending?.suspended ? 'default' : 'danger'}
        busy={busy}
        onCancel={() => {
          setSuspending(null)
          setReason('')
        }}
        onConfirm={confirmSuspend}
      />
    </div>
  )
}
