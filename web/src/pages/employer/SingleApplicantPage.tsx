import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { JobApplicationsPage } from '@/pages/employer/JobApplicationsPage'
import { Dialog } from '@/components/app/Dialog'
import { ConfirmDialog } from '@/components/app/ConfirmDialog'
import { Avatar, Notice, Pill, StarRating, VerifiedChips } from '@/components/partly/ui'
import {
  BookmarkIcon,
  BriefcaseIcon,
  CheckIcon,
  GlobeIcon,
  LayersIcon,
  MapPinIcon,
  StarIcon,
  XCircleIcon,
} from '@/components/icons'
import { errMessage } from '@/lib/errors'
import {
  fetchApplicationById,
  saveCandidate,
  updateApplicationStatus,
  useEmployer,
  type ApplicationRow,
  type ApplicationStatus,
} from '@/lib/employers'
import { countryName, expressInterest } from '@/lib/partly'

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
  const [confirmInterest, setConfirmInterest] = useState(false)

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

  async function setStatus(status: Exclude<ApplicationStatus, 'interested'>) {
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

  async function interested() {
    if (!row?.job || !row.candidate) return
    setBusy(true)
    try {
      const result = await expressInterest(row.job.id, row.candidate.id)
      toast.success(
        result === 'released'
          ? `${row.candidate.full_name} has been told you're interested. They have 2 days to unlock your contact.`
          : 'You already told this expert you’re interested.',
      )
      setConfirmInterest(false)
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

  const c = row?.candidate
  const isInterested = row?.status === 'interested'

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
                  <Avatar name={c.full_name} src={c.avatar_path} size={64} />
                  <div className="flex flex-col gap-1">
                    <p className="text-2xl font-medium text-ink">{c.full_name}</p>
                    <p className="text-sm text-muted">
                      {c.headline || c.title || c.expertise_field?.[0] || 'Expert'}
                      {row?.job?.title ? ` · applied for ${row.job.title}` : ''}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <VerifiedChips identity={c.identity_verified} badge={c.badge_verified} />
                      <StarRating value={c.avg_stars} count={c.rating_count} size={13} showEmpty={false} />
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={save}
                  aria-label="Save candidate"
                  className="w-fit rounded-[5px] bg-brand-50 p-3 text-brand hover:bg-brand-100"
                >
                  <BookmarkIcon className="size-6" />
                </button>
              </div>

              <Notice tone="brand">
                Contact details stay private. They're shared both ways only after you say you're interested and{' '}
                {c.full_name.split(' ')[0]} unlocks the lead.
              </Notice>

              <div className="grid gap-4 sm:grid-cols-2">
                <Detail Icon={BriefcaseIcon} label="Experience" value={c.years_experience} />
                <Detail Icon={LayersIcon} label="Education" value={c.education} />
                <Detail Icon={MapPinIcon} label="Based in" value={c.country_code ? countryName(c.country_code) : null} />
                <Detail Icon={GlobeIcon} label="Nationality" value={c.nationality} />
              </div>

              {(c.expertise_field?.length ?? 0) > 0 && (
                <Section title="Expertise">
                  <div className="flex flex-wrap gap-2">
                    {c.expertise_field!.map((f) => (
                      <span key={f} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand">
                        {f}
                      </span>
                    ))}
                    {c.subcategories.map((f) => (
                      <span key={f} className="rounded-full bg-surface-alt px-3 py-1 text-xs text-ink-600">
                        {f}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {c.biography && (
                <Section title="About">
                  <p className="whitespace-pre-line text-sm leading-6 text-muted-600">{c.biography}</p>
                </Section>
              )}

              {c.past_experience && (
                <Section title="Experience summary">
                  <p className="whitespace-pre-line text-sm leading-6 text-muted-600">{c.past_experience}</p>
                </Section>
              )}

              {(c.portfolio_links?.length ?? 0) > 0 && (
                <Section title="Portfolio">
                  <ul className="flex flex-col gap-1 text-sm">
                    {c.portfolio_links!.map((l) => (
                      <li key={l.url}>
                        <a href={l.url} target="_blank" rel="noreferrer noopener" className="text-brand hover:underline">
                          {l.label || l.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {row?.cover_letter && (
                <Section title="Cover letter">
                  <p className="whitespace-pre-line text-sm leading-6 text-muted-600">{row.cover_letter}</p>
                </Section>
              )}

              <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
                {isInterested ? (
                  <Pill tone={row?.release_status === 'paid' ? 'success' : 'warning'}>
                    {row?.release_status === 'paid'
                      ? 'Interested · contact unlocked'
                      : row?.release_status === 'awaiting_payment'
                        ? 'Interested · waiting for them to unlock'
                        : 'Interested · lead went cold'}
                  </Pill>
                ) : (
                  <>
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
                      onClick={() => setConfirmInterest(true)}
                      className="flex items-center gap-2 rounded-[4px] bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
                    >
                      <CheckIcon className="size-5" />
                      I&apos;m interested
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </Dialog>

      <ConfirmDialog
        open={confirmInterest}
        title={`Tell ${c?.full_name ?? 'this expert'} you're interested?`}
        message="Your contact is released to them. They have 2 days to pay a small fixed fee to unlock it — once they do, contact is exchanged both ways. If they don't, the lead goes cold and nobody is charged."
        confirmLabel="I'm interested"
        busy={busy}
        onConfirm={interested}
        onCancel={() => setConfirmInterest(false)}
      />
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs uppercase tracking-wide text-muted-400">{title}</h3>
      {children}
    </div>
  )
}

function Detail({
  Icon,
  label,
  value,
}: {
  Icon: typeof BriefcaseIcon
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
