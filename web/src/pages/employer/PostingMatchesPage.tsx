import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { EmployerDashboardLayout } from '@/components/dashboard/EmployerDashboardLayout'
import { InviteFriendPanel } from '@/components/partly/InviteFriendPanel'
import { ConfirmDialog } from '@/components/app/ConfirmDialog'
import { RatingWidget } from '@/components/partly/RatingWidget'
import {
  Avatar,
  Card,
  Countdown,
  EmptyState,
  Notice,
  Pill,
  PrimaryButton,
  SecondaryButton,
  StarRating,
  VerifiedChips,
} from '@/components/partly/ui'
import { LinkedinIcon, MailIcon, PhoneIcon } from '@/components/icons'
import {
  budgetLabel,
  closePosting,
  countryName,
  postingCountry,
  fetchBusinessContacts,
  fetchMatches,
  fetchPosting,
  generateMatches,
  markNoFurtherMatches,
  projectTypeLabel,
  releaseContact,
  type BusinessContact,
  type MatchCard,
  type PostingRow,
} from '@/lib/partly'

export function PostingMatchesPage() {
  const { id = '' } = useParams()
  const [posting, setPosting] = useState<PostingRow | null>(null)
  const [matches, setMatches] = useState<MatchCard[]>([])
  const [contacts, setContacts] = useState<BusinessContact[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [confirmState, setConfirmState] = useState<{
    title: string
    message: string
    confirmLabel: string
    tone: 'danger' | 'default'
    run: () => Promise<void>
  } | null>(null)

  const load = useCallback(async () => {
    try {
      const p = await fetchPosting(id)
      setPosting(p)
      if (!p) return
      if (p.matching_status === 'open' || p.matching_status === 'matched') {
        // Idempotent: draws the 10 once, then returns the same fixed set.
        await generateMatches(id).catch(() => 0)
      }
      const [m, c] = await Promise.all([fetchMatches(id), fetchBusinessContacts(id)])
      setMatches(m)
      setContacts(c)
      if (m.length > 0 && p.matching_status === 'open') setPosting(await fetchPosting(id))
    } catch (err) {
      console.error('matches', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const isClosed = posting?.matching_status === 'closed' || posting?.matching_status === 'no_further_matches'
  const releasable = matches.filter((m) => !m.release_id)
  const released = matches.filter((m) => m.release_id)
  const pending = released.filter((m) => m.release_status === 'awaiting_payment')
  const unlocked = released.filter((m) => m.release_status === 'paid')
  const cold = released.filter((m) => m.release_status === 'cold' || m.release_status === 'job_closed')

  function toggle(cid: string) {
    setSelected((s) => (s.includes(cid) ? s.filter((x) => x !== cid) : [...s, cid]))
  }

  function handleRelease(ids: string[]) {
    if (ids.length === 0) return
    const others = released.length + ids.length - 1
    setConfirmState({
      title: ids.length === 1 ? 'Release your contact to this expert?' : `Release your contact to ${ids.length} experts at once?`,
      message:
        ids.length === 1
          ? `They'll have 2 days to unlock it${others > 0 ? ` and will be told ${others} other expert${others === 1 ? ' was' : 's were'} also released` : ''}.`
          : 'Each will have 2 days to unlock it and will be told they are one of several being considered.',
      confirmLabel: 'Release',
      tone: 'default',
      run: async () => {
        const n = await releaseContact(id, ids)
        toast.success(n === 1 ? 'Contact released.' : `Contact released to ${n} experts.`)
        setSelected([])
        await load()
      },
    })
  }

  function handlePassOnAll() {
    setConfirmState({
      title: 'Pass on all 10 matches?',
      message:
        'These are the only matches for this posting — no further candidates will be surfaced and the posting will be marked as having no further matches.',
      confirmLabel: 'Pass on all',
      tone: 'danger',
      run: async () => {
        await markNoFurtherMatches(id)
        toast('Posting marked: no further matches.')
        await load()
      },
    })
  }

  function handleClose() {
    setConfirmState({
      title: 'Close this posting?',
      message:
        pending.length > 0
          ? `${pending.length} expert${pending.length === 1 ? '' : 's'} still have an open payment window — closing ends all of them immediately and nobody is charged.`
          : 'This stops any further matches from being surfaced.',
      confirmLabel: 'Close posting',
      tone: 'danger',
      run: async () => {
        await closePosting(id)
        toast.success('Posting closed.')
        await load()
      },
    })
  }

  async function runConfirmed() {
    if (!confirmState) return
    setBusy(true)
    try {
      await confirmState.run()
      setConfirmState(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <EmployerDashboardLayout>
        <p className="text-sm text-muted">Loading…</p>
      </EmployerDashboardLayout>
    )
  }
  if (!posting) {
    return (
      <EmployerDashboardLayout>
        <EmptyState>Posting not found.</EmptyState>
      </EmployerDashboardLayout>
    )
  }

  return (
    <EmployerDashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <Link to="/employer/postings" className="text-xs text-muted hover:text-brand">
              ← My postings
            </Link>
            <h1 className="mt-1 text-xl font-semibold text-ink">{posting.title}</h1>
            <p className="mt-1 text-sm text-muted">
              {posting.category ?? 'Uncategorised'} · {postingCountry(posting)} · {projectTypeLabel(posting.project_type, posting.job_type)} ·{' '}
              {budgetLabel(posting)}
            </p>
          </div>
          {!isClosed && (
            <SecondaryButton className="text-danger" onClick={handleClose} disabled={busy}>
              Close posting
            </SecondaryButton>
          )}
        </div>

        {posting.matching_status === 'no_further_matches' && (
          <Notice tone="warning" title="No further matches">
            You passed on all matches for this posting. No additional candidates will be surfaced.
          </Notice>
        )}
        {posting.matching_status === 'closed' && (
          <Notice tone="brand" title="This posting is closed">
            Every open payment window was ended when you closed it. Contacts already unlocked stay visible until they expire.
          </Notice>
        )}

        {/* Unlocked contacts */}
        {contacts.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Unlocked contacts ({contacts.length})
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {contacts.map((c) => (
                <Card key={c.release_id} className="border-emerald-200 bg-emerald-50/40">
                  <div className="flex items-start gap-3">
                    <Avatar name={c.full_name} size={44} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-ink">{c.full_name}</p>
                        <StarRating value={c.candidate_avg_stars} count={c.candidate_rating_count} size={13} showEmpty={false} />
                      </div>
                      {c.headline && <p className="text-sm text-muted">{c.headline}</p>}
                      <div className="mt-2 flex flex-col gap-1 text-sm">
                        <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-ink hover:text-brand">
                          <MailIcon className="size-4 text-muted" /> {c.email}
                        </a>
                        <span className="flex items-center gap-2 text-ink">
                          <PhoneIcon className="size-4 text-muted" /> {c.contact_number}
                        </span>
                        {c.linkedin_url && (
                          <a href={c.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-ink hover:text-brand">
                            <LinkedinIcon className="size-4 text-muted" /> LinkedIn
                          </a>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-muted">
                        Visible until {new Date(c.contact_expires_at).toLocaleDateString()} — keep this conversation on partly.asia.
                      </p>
                      <div className="mt-3">
                        <RatingWidget releaseId={c.release_id} raterKind="employer" raterLabel="this expert" />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {contacts.length > 0 && <InviteFriendPanel audience="business" />}

        {/* Released vs pending */}
        {released.length > 0 && (
          <section className="grid gap-4 md:grid-cols-2">
            <Card>
              <h2 className="text-sm font-semibold text-ink">Awaiting unlock ({pending.length})</h2>
              <p className="mb-3 text-xs text-muted">You released contact; they have 2 days to pay to unlock it.</p>
              {pending.length === 0 ? (
                <p className="text-sm text-muted">Nobody pending.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-line">
                  {pending.map((m) => (
                    <li key={m.match_id} className="flex items-center justify-between gap-3 py-2">
                      <span className="flex items-center gap-2">
                        <Avatar name={m.full_name} src={m.avatar_path} size={32} />
                        <span className="text-sm text-ink">{m.full_name}</span>
                      </span>
                      <Countdown until={m.window_expires_at} prefix="" />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card>
              <h2 className="text-sm font-semibold text-ink">Unlocked / gone cold ({unlocked.length + cold.length})</h2>
              <p className="mb-3 text-xs text-muted">Paid leads exchange contact both ways; cold leads were never charged.</p>
              {unlocked.length + cold.length === 0 ? (
                <p className="text-sm text-muted">Nothing here yet.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-line">
                  {[...unlocked, ...cold].map((m) => (
                    <li key={m.match_id} className="flex items-center justify-between gap-3 py-2">
                      <span className="flex items-center gap-2">
                        <Avatar name={m.full_name} src={m.avatar_path} size={32} />
                        <span className="text-sm text-ink">{m.full_name}</span>
                      </span>
                      {m.release_status === 'paid' ? (
                        <Pill tone="success">Unlocked</Pill>
                      ) : (
                        <Pill tone="neutral">{m.release_status === 'job_closed' ? 'Closed' : 'Went cold'}</Pill>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>
        )}

        {/* The 10 */}
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Your matches ({matches.length}/10)
            </h2>
            {!isClosed && releasable.length > 0 && (
              <div className="flex items-center gap-2">
                {selected.length > 0 && (
                  <PrimaryButton className="h-9 px-4 text-xs" disabled={busy} onClick={() => handleRelease(selected)}>
                    Release contact to {selected.length} selected
                  </PrimaryButton>
                )}
                {released.length === 0 && matches.length > 0 && (
                  <SecondaryButton className="h-9 px-3 text-xs" disabled={busy} onClick={handlePassOnAll}>
                    Pass on all
                  </SecondaryButton>
                )}
              </div>
            )}
          </div>

          {matches.length > 0 && !isClosed && (
            <Notice tone="warning">
              <strong>These are your only matches for this posting — choose carefully.</strong> The shortlist is fixed
              at 10; passing on all of them means no further candidates will be surfaced.
            </Notice>
          )}

          {matches.length === 0 ? (
            <EmptyState>
              {posting.matching_status === 'open'
                ? 'No applicants yet. Your matches appear here as soon as experts apply.'
                : 'No matches for this posting.'}
            </EmptyState>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {matches.map((m) => {
                const done = !!m.release_id
                const checked = selected.includes(m.candidate_id)
                return (
                  <Card key={m.match_id} className={`flex flex-col gap-3 ${checked ? 'border-brand' : ''}`}>
                    <div className="flex items-start gap-3">
                      <Avatar name={m.full_name} src={m.avatar_path} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-ink">{m.full_name}</p>
                        <p className="truncate text-sm text-muted">{m.headline ?? m.title ?? 'Expert'}</p>
                        <p className="text-xs text-muted">
                          {m.years_experience ? `${m.years_experience} experience` : ''}
                          {m.years_experience && m.country_code ? ' · ' : ''}
                          {countryName(m.country_code)}
                        </p>
                        <StarRating value={m.avg_stars} count={m.rating_count} size={13} showEmpty={false} />
                      </div>
                      <span className="rounded bg-surface-alt px-1.5 py-0.5 text-xs text-muted">#{m.rank}</span>
                    </div>
                    <VerifiedChips identity={m.identity_verified} badge={m.badge_verified} />
                    {m.expertise_field && m.expertise_field.length > 0 && (
                      <p className="line-clamp-2 text-xs text-ink-600">{m.expertise_field.join(' · ')}</p>
                    )}
                    <div className="mt-auto flex items-center gap-2 pt-1">
                      {done ? (
                        <Pill tone={m.release_status === 'paid' ? 'success' : m.release_status === 'awaiting_payment' ? 'warning' : 'neutral'}>
                          {m.release_status === 'paid'
                            ? 'Unlocked'
                            : m.release_status === 'awaiting_payment'
                              ? 'Released · awaiting unlock'
                              : 'Released · went cold'}
                        </Pill>
                      ) : isClosed ? (
                        <Pill tone="neutral">Not released</Pill>
                      ) : (
                        <>
                          <PrimaryButton className="h-9 flex-1 text-xs" disabled={busy} onClick={() => handleRelease([m.candidate_id])}>
                            Release contact
                          </PrimaryButton>
                          <label className="flex cursor-pointer items-center gap-1 text-xs text-muted">
                            <input type="checkbox" checked={checked} onChange={() => toggle(m.candidate_id)} />
                            Select
                          </label>
                        </>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.title ?? ''}
        message={confirmState?.message ?? ''}
        tone={confirmState?.tone}
        confirmLabel={confirmState?.confirmLabel}
        busy={busy}
        onConfirm={runConfirmed}
        onCancel={() => setConfirmState(null)}
      />
    </EmployerDashboardLayout>
  )
}
