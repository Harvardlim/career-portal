import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { JobApplicationsPage } from '@/pages/employer/JobApplicationsPage'
import { Dialog } from '@/components/app/Dialog'
import {
  BookmarkIcon,
  BriefcaseIcon,
  FileIcon,
  LayersIcon,
  MailIcon,
  PhoneIcon,
  StarIcon,
  XCircleIcon,
  CheckIcon,
} from '@/components/icons'
import { errMessage } from '@/lib/errors'
import { initialsFromName } from '@/lib/name'
import {
  fetchApplicationById,
  resumeSignedUrl,
  saveCandidate,
  updateApplicationStatus,
  useEmployer,
  type ApplicationRow,
  type ApplicationStatus,
} from '@/lib/employers'

export function SingleApplicantPage() {
  const { employer, session } = useEmployer()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const id = params.get('id')
  const jobParam = params.get('job')
  const closeTo = jobParam
    ? `/employer/applications?job=${jobParam}`
    : '/employer/applications'

  const [row, setRow] = useState<ApplicationRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    let alive = true
    fetchApplicationById(id)
      .then((r) => alive && setRow(r))
      .catch((err) => console.error('applicant', err))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [id])

  async function setStatus(status: ApplicationStatus) {
    if (!row) return
    setBusy(true)
    try {
      await updateApplicationStatus(row.id, status)
      toast.success(`Marked as ${status === 'active' ? 'new' : status}`)
      navigate(closeTo)
    } catch (err) {
      toast.error(errMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function save() {
    if (!row?.candidate || !employer || !session) return
    try {
      await saveCandidate(employer.id, session.user.id, row.candidate.id)
      toast.success('Candidate saved')
    } catch (err) {
      toast.error(errMessage(err))
    }
  }

  async function viewResume() {
    if (!row?.resume) return
    try {
      const url = await resumeSignedUrl(row.resume.storage_path)
      window.open(url, '_blank', 'noopener')
    } catch (err) {
      toast.error(errMessage(err))
    }
  }

  const c = row?.candidate

  return (
    <>
      <JobApplicationsPage />
      <Dialog closeTo={closeTo} width="max-w-[720px]">
        <div className="flex flex-col gap-6 p-8">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted">Loading…</p>
          ) : !c ? (
            <p className="py-8 text-center text-sm text-muted">
              Applicant not found.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="grid size-16 place-items-center rounded-full bg-brand-50 text-lg font-semibold text-brand">
                    {initialsFromName(c.full_name) || '?'}
                  </span>
                  <div>
                    <p className="text-2xl font-medium text-ink">{c.full_name}</p>
                    <p className="text-sm text-muted">
                      {c.title || c.expertise_field?.[0] || 'Candidate'}
                      {row?.job?.title ? ` · applied for ${row.job.title}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={save}
                    aria-label="Save candidate"
                    className="rounded-[5px] bg-brand-50 p-3 text-brand hover:bg-brand-100"
                  >
                    <BookmarkIcon className="size-6" />
                  </button>
                  {row?.resume && (
                    <button
                      type="button"
                      onClick={viewResume}
                      className="flex items-center gap-2 rounded-[4px] border border-brand px-5 py-3 text-sm font-semibold text-brand hover:bg-brand-50"
                    >
                      <FileIcon className="size-5" />
                      View Resume
                    </button>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Detail Icon={BriefcaseIcon} label="Experience" value={c.years_experience} />
                <Detail Icon={LayersIcon} label="Education" value={c.education} />
                <Detail Icon={MailIcon} label="Email" value={c.email} />
                <Detail Icon={PhoneIcon} label="Phone" value={c.contact_number} />
              </div>

              {c.expertise_field && c.expertise_field.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {c.expertise_field.map((f) => (
                    <span
                      key={f}
                      className="rounded-full bg-surface-alt px-3 py-1 text-xs text-ink-600"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}

              {row?.cover_letter && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs uppercase tracking-wide text-muted-400">
                    Cover letter
                  </h3>
                  <p className="whitespace-pre-line text-sm leading-6 text-muted-600">
                    {row.cover_letter}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-3 border-t border-line pt-6">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setStatus('shortlisted')}
                  className="flex items-center gap-2 rounded-[4px] bg-brand-50 px-5 py-3 text-sm font-semibold text-brand disabled:opacity-50"
                >
                  <StarIcon className="size-5" />
                  Shortlist
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setStatus('rejected')}
                  className="flex items-center gap-2 rounded-[4px] border border-line px-5 py-3 text-sm font-semibold text-ink-600 disabled:opacity-50"
                >
                  <XCircleIcon className="size-5" />
                  Reject
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setStatus('hired')}
                  className="flex items-center gap-2 rounded-[4px] bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  <CheckIcon className="size-5" />
                  Hire
                </button>
              </div>
            </>
          )}
        </div>
      </Dialog>
    </>
  )
}

function Detail({
  Icon,
  label,
  value,
}: {
  Icon: typeof MailIcon
  label: string
  value: string | null | undefined
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-line p-3">
      <Icon className="mt-0.5 size-5 shrink-0 text-brand" />
      <div className="flex flex-col">
        <span className="text-xs uppercase tracking-wide text-muted-400">{label}</span>
        <span className="text-sm font-medium text-ink">{value || '—'}</span>
      </div>
    </div>
  )
}
