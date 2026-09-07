import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { EmployerDashboardLayout } from '@/components/dashboard/EmployerDashboardLayout'
import { BookmarkIcon } from '@/components/icons'
import { errMessage } from '@/lib/errors'
import { initialsFromName } from '@/lib/name'
import {
  fetchSavedCandidates,
  unsaveCandidate,
  useEmployer,
  type SavedCandidateRow,
} from '@/lib/employers'

export function SavedCandidatesPage() {
  const { employer, loading: employerLoading } = useEmployer()
  const [rows, setRows] = useState<SavedCandidateRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    if (!employer) return
    setLoading(true)
    fetchSavedCandidates(employer.id)
      .then(setRows)
      .catch((err) => console.error('saved candidates', err))
      .finally(() => setLoading(false))
  }, [employer])

  useEffect(() => {
    if (!employer) {
      if (!employerLoading) setLoading(false)
      return
    }
    load()
  }, [employer, employerLoading, load])

  async function remove(candidateId: string) {
    if (!employer) return
    setRows((r) => r.filter((x) => x.candidate?.id !== candidateId))
    try {
      await unsaveCandidate(employer.id, candidateId)
    } catch (err) {
      toast.error(errMessage(err))
      load()
    }
  }

  return (
    <EmployerDashboardLayout>
      <div className="flex flex-col gap-5">
        <h1 className="text-lg font-medium text-ink">
          Saved Candidates <span className="text-muted">({rows.length})</span>
        </h1>

        {rows.length > 0 ? (
          <div className="flex flex-col gap-3">
            {rows.map((rec) => {
              const c = rec.candidate
              if (!c) return null
              return (
                <div
                  key={rec.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-line p-4"
                >
                  <div className="flex items-center gap-4">
                    <span className="grid size-12 shrink-0 place-items-center rounded-md bg-brand-50 text-sm font-semibold text-brand">
                      {initialsFromName(c.full_name) || '?'}
                    </span>
                    <span className="flex flex-col">
                      <span className="font-medium text-ink">{c.full_name}</span>
                      <span className="text-sm text-muted">
                        {c.title || c.expertise_field?.[0] || '—'}
                        {c.years_experience ? ` · ${c.years_experience}` : ''}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {rec.application_id && (
                      <Link
                        to={`/employer/applications/applicant?id=${rec.application_id}`}
                        className="rounded-[3px] border border-line px-4 py-2 text-sm font-semibold text-ink-600 hover:bg-surface-alt"
                      >
                        View Details
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(c.id)}
                      aria-label="Remove from saved"
                      className="grid size-9 place-items-center rounded text-brand hover:bg-surface-alt"
                    >
                      <BookmarkIcon className="size-5 fill-current" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="rounded-lg bg-surface-alt px-4 py-12 text-center text-sm text-muted">
            {loading
              ? 'Loading…'
              : 'No saved candidates yet. Save applicants from the '}
            {!loading && (
              <Link to="/employer/applications" className="font-medium text-brand">
                Applications
              </Link>
            )}
            {!loading && ' board.'}
          </p>
        )}
      </div>
    </EmployerDashboardLayout>
  )
}
