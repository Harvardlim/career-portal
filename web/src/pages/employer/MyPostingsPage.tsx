import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { EmployerDashboardLayout } from '@/components/dashboard/EmployerDashboardLayout'
import { EmptyState, Pill, PrimaryButton, SecondaryButton } from '@/components/partly/ui'
import { useEmployer } from '@/lib/employers'
import {
  budgetLabel,
  closePosting,
  postingCountry,
  fetchMyPostings,
  projectTypeLabel,
  repostPosting,
  type MatchingStatus,
  type MyPostingRow,
} from '@/lib/partly'

const STATUS: Record<MatchingStatus, { label: string; tone: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' }> = {
  open: { label: 'Taking applications', tone: 'brand' },
  matched: { label: 'Matches ready', tone: 'success' },
  released: { label: 'Contact released', tone: 'success' },
  no_further_matches: { label: 'No further matches', tone: 'warning' },
  closed: { label: 'Closed', tone: 'neutral' },
}

export function MyPostingsPage() {
  const { employer, loading: employerLoading } = useEmployer()
  const navigate = useNavigate()
  const [rows, setRows] = useState<MyPostingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [reposting, setReposting] = useState<string | null>(null)

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

  async function handleClose(row: MyPostingRow) {
    const pending = row.released - row.unlocked
    const msg =
      pending > 0
        ? `Close "${row.title}"? ${pending} released expert${pending === 1 ? '' : 's'} still have an open payment window — closing ends all of them now and they will not be charged.`
        : `Close "${row.title}"? Experts will no longer be able to apply.`
    if (!confirm(msg)) return
    try {
      const ended = await closePosting(row.id)
      toast.success(ended > 0 ? `Posting closed. ${ended} open window${ended === 1 ? '' : 's'} ended.` : 'Posting closed. Applicants who weren’t hired have been emailed.')
      void load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not close posting')
    }
  }

  async function handleRepost(row: MyPostingRow) {
    if (!employer) return
    setReposting(row.id)
    try {
      const id = await repostPosting(row.id, employer.id, employer.company_name)
      toast.success('Reposted — a fresh copy is now live.')
      navigate(`/employer/postings/${id}/matches`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not repost')
    } finally {
      setReposting(null)
    }
  }

  return (
    <EmployerDashboardLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-lg font-medium text-ink">
            My postings <span className="text-muted">({rows.length})</span>
          </h1>
          <Link to="/employer/post-need">
            <PrimaryButton>Post a need</PrimaryButton>
          </Link>
        </div>

        {rows.length === 0 ? (
          <EmptyState>{loading ? 'Loading…' : 'No postings yet. Post your first need — it’s free.'}</EmptyState>
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
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {row.category ?? 'Uncategorised'} · {postingCountry(row)} · {projectTypeLabel(row.project_type, row.job_type)} ·{' '}
                      {budgetLabel(row)}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center text-sm md:w-[280px]">
                    <div>
                      <p className="text-lg font-semibold text-ink">{row.applications}</p>
                      <p className="text-xs text-muted">applied</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-ink">{row.released}</p>
                      <p className="text-xs text-muted">released</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-emerald-700">{row.unlocked}</p>
                      <p className="text-xs text-muted">unlocked</p>
                    </div>
                  </div>
                  <div className="flex gap-2 md:w-[220px] md:justify-end">
                    <Link to={`/employer/postings/${row.id}/matches`}>
                      <SecondaryButton className="h-9 px-3 text-xs">
                        {row.matching_status === 'open' ? 'View applicants' : 'View matches'}
                      </SecondaryButton>
                    </Link>
                    {isClosed || row.matching_status === 'no_further_matches' ? (
                      <SecondaryButton className="h-9 px-3 text-xs" disabled={reposting === row.id} onClick={() => handleRepost(row)}>
                        {reposting === row.id ? 'Reposting…' : 'Repost'}
                      </SecondaryButton>
                    ) : (
                      <SecondaryButton className="h-9 px-3 text-xs text-danger" onClick={() => handleClose(row)}>
                        Close
                      </SecondaryButton>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </EmployerDashboardLayout>
  )
}
