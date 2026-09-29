import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { EmployerDashboardLayout } from '@/components/dashboard/EmployerDashboardLayout'
import { EmptyState, Pill, PrimaryButton, SecondaryButton } from '@/components/partly/ui'
import { ConfirmDialog } from '@/components/app/ConfirmDialog'
import { useEmployer } from '@/lib/employers'
import { formatDate } from '@/lib/format'
import {
  budgetLabel,
  closePosting,
  postingCountry,
  fetchMyPostings,
  isExpired,
  projectTypeLabel,
  repostPosting,
  type MatchingStatus,
  type MyPostingRow,
} from '@/lib/partly'
import { useT, tr } from '@/lib/i18n'
import { categoryLabel } from '@/lib/categoryNames'

const STATUS: Record<MatchingStatus, { label: string; tone: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' }> = {
  open: { get label() { return tr('st.open') }, tone: 'brand' },
  matched: { get label() { return tr('st.matched') }, tone: 'success' },
  released: { get label() { return tr('st.released') }, tone: 'success' },
  no_further_matches: { get label() { return tr('st.no_further') }, tone: 'warning' },
  closed: { get label() { return tr('st.closed') }, tone: 'neutral' },
}

export function MyPostingsPage() {
  const t = useT()
  const { employer, loading: employerLoading } = useEmployer()
  const navigate = useNavigate()
  const [rows, setRows] = useState<MyPostingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [reposting, setReposting] = useState<string | null>(null)
  const [closing, setClosing] = useState<MyPostingRow | null>(null)
  const [closeBusy, setCloseBusy] = useState(false)

  async function load() {
    if (!employer) return
    try {
      setRows(await fetchMyPostings(employer.id))
    } catch (err) {
      console.error('postings', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!employer) {
      if (!employerLoading) setLoading(false)
      return
    }
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employer, employerLoading])

  async function confirmClose() {
    if (!closing) return
    setCloseBusy(true)
    try {
      const ended = await closePosting(closing.id)
      toast.success(ended > 0 ? t(ended === 1 ? 'mp.closed1' : 'mp.closedn', { n: ended }) : t('ui.posting_closed_applicants_who_weren_t'))
      setClosing(null)
      void load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('ui.could_not_close_posting'))
    } finally {
      setCloseBusy(false)
    }
  }

  async function handleRepost(row: MyPostingRow) {
    if (!employer) return
    setReposting(row.id)
    try {
      const id = await repostPosting(row.id, employer.id, employer.company_name)
      toast.success(t('ui.reposted_a_fresh_copy_is_now'))
      navigate(`/employer/postings/${id}/matches`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('ui.could_not_repost'))
    } finally {
      setReposting(null)
    }
  }

  return (
    <EmployerDashboardLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-lg font-medium text-ink">{t('ui.my_postings')}{' '}<span className="text-muted">({rows.length})</span>
          </h1>
          <Link to="/employer/post-need">
            <PrimaryButton>{t('ui.post_a_need')}</PrimaryButton>
          </Link>
        </div>

        {rows.length === 0 ? (
          <EmptyState>{loading ? t('ui.loading_2') : t('ui.no_postings_yet_post_your_first')}</EmptyState>
        ) : (
          <div className="flex flex-col divide-y divide-line rounded-xl border border-line">
            {rows.map((row) => {
              const st = STATUS[row.matching_status] ?? STATUS.open
              const isClosed = row.matching_status === 'closed'
              return (
                <div key={row.id} className="flex flex-col gap-3 p-5 md:flex-row md:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/employer/postings/${row.id}/matches`} className="font-medium text-ink hover:text-brand">
                        {row.title}
                      </Link>
                      <Pill tone={st.tone}>{st.label}</Pill>
                      {isExpired(row.expires_at) && !isClosed && <Pill tone="danger">{t('ui.expired')}</Pill>}
                      {row.suspended && <Pill tone="danger">{t('ui.suspended_by_partly_asia_staff')}</Pill>}
                    </div>
                    {row.suspended && row.suspended_reason && (
                      <p className="mt-1 text-xs text-danger">{row.suspended_reason}</p>
                    )}
                    <p className="mt-1 text-sm text-muted">
                      {row.category ? categoryLabel(row.category) : t('ui.uncategorised')} · {postingCountry(row)} · {projectTypeLabel(row.project_type, row.job_type)} ·{' '}
                      {budgetLabel(row)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">{t('ui.posted', { posted_at: formatDate(row.posted_at) })}{row.expires_at ? t(isExpired(row.expires_at) ? 'mp.expired' : 'mp.expires', { date: formatDate(row.expires_at) }) : ''}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center text-sm md:w-[280px]">
                    <div>
                      <p className="text-lg font-semibold text-ink">{row.applications}</p>
                      <p className="text-xs text-muted">{t('ui.applied_2')}</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-ink">{row.released}</p>
                      <p className="text-xs text-muted">{t('ui.released_2')}</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-emerald-700">{row.unlocked}</p>
                      <p className="text-xs text-muted">{t('ui.unlocked_2')}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 md:w-[220px] md:justify-end">
                    <Link to={`/employer/postings/${row.id}/matches`}>
                      <SecondaryButton className="h-9 px-3 text-xs">
                        {row.matching_status === 'open' ? t('ui.view_applicants') : t('ui.view_matches')}
                      </SecondaryButton>
                    </Link>
                    {isClosed || row.matching_status === 'no_further_matches' ? (
                      <SecondaryButton className="h-9 px-3 text-xs" disabled={reposting === row.id} onClick={() => handleRepost(row)}>
                        {reposting === row.id ? t('ui.reposting') : t('ui.repost')}
                      </SecondaryButton>
                    ) : (
                      <SecondaryButton className="h-9 px-3 text-xs text-danger" onClick={() => setClosing(row)}>{t('ui.close')}</SecondaryButton>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!closing}
        title={closing ? t('ui.close_2', { title: closing.title }) : ''}
        message={
          closing && closing.released - closing.unlocked > 0
            ? t(closing.released - closing.unlocked === 1 ? 'mp.closing1' : 'mp.closingn', { n: closing.released - closing.unlocked })
            : t('ui.experts_will_no_longer_be_able')
        }
        confirmLabel={t('ui.close_posting')}
        tone="danger"
        busy={closeBusy}
        onConfirm={confirmClose}
        onCancel={() => setClosing(null)}
      />
    </EmployerDashboardLayout>
  )
}
