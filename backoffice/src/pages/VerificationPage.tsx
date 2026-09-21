import { useEffect, useState } from 'react'
import { ListCard, Pagination, PAGE_SIZES, TableSearch, lc, useTableView } from '../components/ListShell'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Button, Card, controlClass } from '../components/ui'
import { useAdminSession } from '../lib/admin'
import {
  fetchVerificationQueue,
  partlyEnabled,
  reviewVerification,
  verificationDocUrl,
  type VerificationItem,
} from '../lib/partly'

const thCls = 'px-3 py-3 font-medium first:pl-6 last:pr-6'
const tdCls = 'px-3 py-4 align-top first:pl-6 last:pr-6'

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

const errMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong')

const DOC_LABEL: Record<string, string> = {
  identity: 'Identity (ID)',
  business_registration: 'Business registration',
  credential: 'Credential',
}

const Pill = ({ value }: { value: string }) => {
  const tone =
    value === 'approved'
      ? 'bg-success/12 text-success'
      : value === 'rejected'
        ? 'bg-danger/12 text-danger'
        : 'bg-brand/15 text-brand-2'
  return <span className={`inline-flex rounded-md px-2 py-1 text-[12px] font-medium capitalize ${tone}`}>{value}</span>
}

/**
 * Manual verification queue. An admin opens the uploaded document (signed URL,
 * 10 minutes) and approves or rejects; the RPC flips the owner's verified flag
 * and notifies them. Phase 3 replaces this with OCR.
 */
export const VerificationPage = () => {
  const session = useAdminSession()
  const [rows, setRows] = useState<VerificationItem[]>([])
  const [loading, setLoading] = useState(partlyEnabled)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const [pending, setPending] = useState<{ item: VerificationItem; approve: boolean } | null>(null)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    setLoading(true)
    try {
      setRows(await fetchVerificationQueue())
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

  const visible = filter === 'pending' ? rows.filter((r) => r.status === 'pending') : rows
  const view = useTableView(visible, (r, q) =>
    [r.owner_name, r.owner_email, r.owner_reg_no, r.doc_type, r.owner_kind, r.status].some((v) => lc(v).includes(q)),
  )

  async function openDoc(item: VerificationItem) {
    try {
      window.open(await verificationDocUrl(item.doc_path), '_blank', 'noopener')
    } catch (e) {
      setError(errMessage(e))
    }
  }

  async function confirm() {
    if (!pending || !session) return
    setBusy(true)
    try {
      await reviewVerification(pending.item.id, pending.approve, session.id, notes.trim() || undefined)
      setPending(null)
      setNotes('')
      await load()
    } catch (e) {
      setError(errMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const pendingCount = rows.filter((r) => r.status === 'pending').length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-ink">Verification queue</h1>
          <p className="text-[13px] text-muted">
            {pendingCount} pending · business docs approve registration; expert docs (only uploaded for the paid badge) activate it on approval
          </p>
        </div>
        <div className="flex gap-2">
          {(['pending', 'all'] as const).map((f) => (
            <Button key={f} variant={filter === f ? 'primary' : 'ghost'} onClick={() => setFilter(f)}>
              {f === 'pending' ? 'Pending' : 'All'}
            </Button>
          ))}
        </div>
      </div>

      {!partlyEnabled && <Card className="p-6 text-[13px] text-muted">Connect Supabase to review verifications.</Card>}
      {error && <Card className="border-danger/40 p-4 text-[13px] text-danger">{error}</Card>}

      <ListCard
        title="Documents"
        range={`${view.filtered.length}`}
        toolbar={<TableSearch value={view.query} onChange={view.setQuery} placeholder="Search name, email, reg no…" />}
      >
        <table className="w-full min-w-[960px] text-left text-[13px]">
          <thead className="border-b border-line text-muted">
            <tr>
              <th className={thCls}>Who</th>
              <th className={thCls}>Type</th>
              <th className={thCls}>Document</th>
              <th className={thCls}>Uploaded</th>
              <th className={thCls}>Status</th>
              <th className={thCls}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-muted">Loading…</td>
              </tr>
            ) : view.paged.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-muted">Nothing to review.</td>
              </tr>
            ) : (
              view.paged.map((r) => (
                <tr key={r.id}>
                  <td className={tdCls}>
                    <span className="block font-semibold text-ink">{r.owner_name ?? 'Unknown'}</span>
                    <span className="block text-[12px] text-muted">
                      {r.owner_kind === 'employer' ? 'Business' : 'Expert'} · {r.owner_email ?? '—'}
                      {r.owner_country ? ` · ${r.owner_country}` : ''}
                      {r.owner_reg_no ? ` · Reg ${r.owner_reg_no}` : ''}
                    </span>
                    {r.owner_verified && <span className="text-[11px] text-success">{r.owner_kind === 'employer' ? 'Registration currently verified' : 'Basic check already complete (self-serve)'}</span>}
                  </td>
                  <td className={tdCls}>{DOC_LABEL[r.doc_type] ?? r.doc_type}</td>
                  <td className={tdCls}>
                    <button type="button" onClick={() => openDoc(r)} className="text-brand-2 hover:underline">
                      Open document
                    </button>
                  </td>
                  <td className={tdCls}>{fmtDate(r.created_at)}</td>
                  <td className={tdCls}>
                    <Pill value={r.status} />
                    {r.notes && <span className="mt-1 block text-[12px] text-muted">{r.notes}</span>}
                  </td>
                  <td className={tdCls}>
                    {r.status === 'pending' ? (
                      <div className="flex gap-2">
                        <Button onClick={() => setPending({ item: r, approve: true })}>Approve</Button>
                        <Button variant="ghost" onClick={() => setPending({ item: r, approve: false })}>
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-muted">Reviewed {fmtDate(r.reviewed_at)}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="px-6 pb-5">
          <Pagination
            page={view.page}
            pageSize={view.pageSize}
            total={view.filtered.length}
            onPageChange={view.setPage}
            onPageSizeChange={view.setPageSize}
            pageSizeOptions={PAGE_SIZES}
          />
        </div>
      </ListCard>

      <ConfirmDialog
        open={!!pending}
        title={pending?.approve ? 'Approve verification' : 'Reject verification'}
        message={
          <div className="space-y-3">
            <p>
              {pending
                ? `${pending.approve ? 'Mark' : 'Do not mark'} ${pending.item.owner_name ?? 'this account'} as ${
                    pending.item.owner_kind === 'employer' ? 'registration' : 'identity'
                  }-verified. They will be notified in-app.`
                : ''}
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={pending?.approve ? 'Internal note (optional)' : 'Tell them what to fix (shown to the user)'}
              className={`${controlClass} h-auto py-2`}
            />
          </div>
        }
        confirmLabel={pending?.approve ? 'Approve' : 'Reject'}
        tone={pending?.approve ? 'default' : 'danger'}
        busy={busy}
        onCancel={() => {
          setPending(null)
          setNotes('')
        }}
        onConfirm={confirm}
      />
    </div>
  )
}
