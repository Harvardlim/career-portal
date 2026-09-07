import { useEffect, useState } from 'react'
import { StatusPill } from './ui'
import { fetchApplicants, type Applicant, type JobRow } from '../lib/jobs'
import { errMessage } from '../lib/errors'

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })

const tone = (status: string): 'in' | 'out' =>
  status === 'shortlisted' || status === 'hired' ? 'in' : 'out'

type Props = {
  job: JobRow | null
  onClose: () => void
}

export const JobApplicantsDialog = ({ job, onClose }: Props) => {
  const [rows, setRows] = useState<Applicant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!job) return
    let alive = true
    setLoading(true)
    setError(null)
    fetchApplicants(job.id)
      .then((r) => alive && setRows(r))
      .catch((e) => alive && setError(errMessage(e)))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [job])

  useEffect(() => {
    if (!job) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [job, onClose])

  if (!job) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="applicants-title"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 cursor-default bg-black/60 backdrop-blur-sm"
      />
      <div className="relative my-auto w-full max-w-[640px] rounded-2xl border border-line bg-surface p-6 shadow-pop">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="applicants-title" className="text-[18px] font-semibold text-ink">
              Applicants
            </h2>
            <p className="mt-0.5 text-[12px] text-muted">
              {job.title}
              {job.company_name ? ` · ${job.company_name}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 text-muted hover:text-ink"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[440px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-line text-[12px] text-muted">
                <th className="py-2 pr-3 font-medium">Candidate</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 font-medium">Applied</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-muted">
                    Loading…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-danger">
                    {error}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-muted">
                    No applications yet.
                  </td>
                </tr>
              ) : (
                rows.map((a) => (
                  <tr key={a.id} className="border-b border-line/60 align-top last:border-0">
                    <td className="py-3 pr-3">
                      <div className="font-medium text-ink">
                        {a.candidate?.full_name ?? 'Unknown'}
                      </div>
                      {a.candidate?.email ? (
                        <div className="text-[12px] text-muted">{a.candidate.email}</div>
                      ) : null}
                      {a.cover_letter ? (
                        <p className="mt-1 line-clamp-2 max-w-[320px] text-[12px] text-ink-200">
                          {a.cover_letter}
                        </p>
                      ) : null}
                    </td>
                    <td className="py-3 pr-3">
                      <StatusPill tone={tone(a.status)}>{a.status}</StatusPill>
                    </td>
                    <td className="py-3 text-muted">{fmtDate(a.applied_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
