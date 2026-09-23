import { useEffect, useState } from 'react'
import { ListCard, Pagination, PAGE_SIZES, TableSearch, lc, useTableView } from '../components/ListShell'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Card } from '../components/ui'
import { IconStar, IconTrash } from '../components/Icons'
import { deleteRating, fetchRatings, partlyEnabled, type RatingRow } from '../lib/partly'

const thCls = 'px-3 py-3 font-medium first:pl-6 last:pr-6'
const tdCls = 'px-3 py-4 align-top first:pl-6 last:pr-6'
const fmt = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
const errMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong')

const Stars = ({ n }: { n: number }) => (
  <span className="flex items-center gap-0.5 text-warning">
    {Array.from({ length: 5 }, (_, i) => (
      <IconStar key={i} width={13} height={13} className={i < n ? 'opacity-100' : 'opacity-20'} />
    ))}
  </span>
)

/** Ratings businesses and experts leave for each other after an unlocked lead. Moderated here, same as Reports. */
export const RatingsPage = () => {
  const [rows, setRows] = useState<RatingRow[]>([])
  const [loading, setLoading] = useState(partlyEnabled)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<RatingRow | null>(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    setLoading(true)
    try {
      setRows(await fetchRatings())
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

  const view = useTableView(rows, (r, q) => [r.rater_label, r.ratee_label, r.comment, r.rater_kind, r.ratee_kind].some((v) => lc(v).includes(q)))

  async function confirmDelete() {
    if (!deleting) return
    setBusy(true)
    try {
      await deleteRating(deleting.id)
      setDeleting(null)
      await load()
    } catch (e) {
      setError(errMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const avg = rows.length ? (rows.reduce((s, r) => s + r.stars, 0) / rows.length).toFixed(2) : '—'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold text-ink">Ratings</h1>
        <p className="text-[13px] text-muted">{rows.length} ratings · platform average {avg}</p>
      </div>

      {!partlyEnabled && <Card className="p-6 text-[13px] text-muted">Connect Supabase to see ratings.</Card>}
      {error && <Card className="border-danger/40 p-4 text-[13px] text-danger">{error}</Card>}

      <ListCard title="All ratings" range={`${view.filtered.length}`} toolbar={<TableSearch value={view.query} onChange={view.setQuery} placeholder="Search rater, ratee, comment…" />}>
        <table className="w-full min-w-[980px] text-left text-[13px]">
          <thead className="border-b border-line text-muted">
            <tr>
              <th className={thCls}>Rater</th>
              <th className={thCls}>Ratee</th>
              <th className={thCls}>Stars</th>
              <th className={thCls}>Comment</th>
              <th className={thCls}>Date</th>
              <th className={thCls}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-muted">Loading…</td></tr>
            ) : view.paged.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-muted">No ratings yet.</td></tr>
            ) : (
              view.paged.map((r) => (
                <tr key={r.id}>
                  <td className={tdCls}>
                    <span className="block font-semibold text-ink">{r.rater_label ?? 'Unknown'}</span>
                    <span className="block text-[12px] text-muted">{r.rater_kind === 'employer' ? 'Business' : 'Expert'}</span>
                  </td>
                  <td className={tdCls}>
                    <span className="block font-semibold text-ink">{r.ratee_label ?? 'Unknown'}</span>
                    <span className="block text-[12px] text-muted">{r.ratee_kind === 'employer' ? 'Business' : 'Expert'}</span>
                  </td>
                  <td className={tdCls}><Stars n={r.stars} /></td>
                  <td className={tdCls}>
                    <span className="block max-w-[320px] text-ink-200">{r.comment ?? '—'}</span>
                  </td>
                  <td className={tdCls}>{fmt(r.created_at)}</td>
                  <td className={tdCls}>
                    <button
                      type="button"
                      onClick={() => setDeleting(r)}
                      className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-danger hover:underline"
                    >
                      <IconTrash width={14} height={14} />
                      Delete
                    </button>
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

      <ConfirmDialog
        open={!!deleting}
        title="Delete rating"
        message={deleting ? `Remove this ${deleting.stars}-star rating from ${deleting.rater_label ?? 'the rater'}? This can't be undone.` : ''}
        confirmLabel="Delete"
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
