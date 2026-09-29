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
  isExpired,
  markNoFurtherMatches,
  projectTypeLabel,
  releaseContact,
  type BusinessContact,
  type MatchCard,
  type PostingRow,
} from '@/lib/partly'
import { formatDate } from '@/lib/format'
import { formatStoredPhone } from '@/lib/phone'
import { useT } from '@/lib/i18n'
import { categoryLabel } from '@/lib/categoryNames'

export function PostingMatchesPage() {
  const t = useT()
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
      if (p.matching_status === 'open' || p.matching_status === 'matched' || p.matching_status === 'released') {
        // Keeps everyone already drawn, in order; only fills empty slots (up
        // to 10) with experts who applied since.
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
  const expired = isExpired(posting?.expires_at)

  function toggle(cid: string) {
    setSelected((s) => (s.includes(cid) ? s.filter((x) => x !== cid) : [...s, cid]))
  }

  function handleRelease(ids: string[]) {
    if (ids.length === 0) return
    const others = released.length + ids.length - 1
    setConfirmState({
      title: ids.length === 1 ? t('pm.tell_one') : t('pm.tell_many', { n: ids.length }),
      message:
        ids.length === 1
          ? others > 0
            ? others === 1
              ? t('pm.msg_one_other1')
              : t('pm.msg_one_others', { n: others })
            : t('pm.msg_one')
          : t('pm.msg_many'),
      confirmLabel: t('ui.i_m_interested'),
      tone: 'default',
      run: async () => {
        const n = await releaseContact(id, ids)
        toast.success(n === 1 ? t('ui.expert_told_you_re_interested') : t('ui.experts_told_you_re_interested', { n }))
        setSelected([])
        await load()
      },
    })
  }

  function handlePassOnAll() {
    setConfirmState({
      title: t('ui.pass_on_all_matches', { length: matches.length }),
      message:
        t('ui.no_further_candidates_will_be_surfaced'),
      confirmLabel: t('ui.pass_on_all'),
      tone: 'danger',
      run: async () => {
        await markNoFurtherMatches(id)
        toast(t('pm.marked'))
        await load()
      },
    })
  }

  function handleClose() {
    setConfirmState({
      title: t('ui.close_this_posting'),
      message:
        pending.length > 0
          ? t(pending.length === 1 ? 'pm.close_pending1' : 'pm.close_pendingn', { n: pending.length })
          : t('pm.close_none'),
      confirmLabel: t('ui.close_posting'),
      tone: 'danger',
      run: async () => {
        await closePosting(id)
        toast.success(t('ui.posting_closed'))
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
      toast.error(err instanceof Error ? err.message : t('ui.something_went_wrong'))
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <EmployerDashboardLayout>
        <p className="text-sm text-muted">{t('ui.loading_2')}</p>
      </EmployerDashboardLayout>
    )
  }
  if (!posting) {
    return (
      <EmployerDashboardLayout>
        <EmptyState>{t('ui.posting_not_found')}</EmptyState>
      </EmployerDashboardLayout>
    )
  }

  return (
    <EmployerDashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <Link to="/employer/postings" className="text-xs text-muted hover:text-brand">{t('ui.my_postings_2')}</Link>
            <h1 className="mt-1 text-xl font-semibold text-ink">{posting.title}</h1>
            <p className="mt-1 text-sm text-muted">
              {posting.category ? categoryLabel(posting.category) : t('ui.uncategorised')} · {postingCountry(posting)} · {projectTypeLabel(posting.project_type, posting.job_type)} ·{' '}
              {budgetLabel(posting)}
            </p>
            <p className="mt-1 text-xs text-muted">{t('ui.posted', { posted_at: formatDate(posting.posted_at) })}{posting.expires_at && (
                <>
                  {' · '}
                  <span className={expired ? 'font-medium text-danger' : ''}>
                    {expired ? t('ui.expired') : t('ui.expires')} {formatDate(posting.expires_at)}
                  </span>
                </>
              )}
            </p>
          </div>
          {!isClosed && (
            <SecondaryButton className="text-danger" onClick={handleClose} disabled={busy}>{t('ui.close_posting')}</SecondaryButton>
          )}
        </div>

        {posting.matching_status === 'no_further_matches' && (
          <Notice tone="warning" title={t('ui.no_further_matches')}>{t('ui.you_passed_on_all_matches_for')}</Notice>
        )}
        {posting.matching_status === 'closed' && (
          <Notice tone="brand" title={t('ui.this_posting_is_closed')}>{t('ui.every_open_payment_window_was_ended')}</Notice>
        )}

        {/* Unlocked contacts */}
        {contacts.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t('ui.unlocked_contacts', { length: contacts.length })}</h2>
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
                          <PhoneIcon className="size-4 text-muted" /> {formatStoredPhone(c.contact_number)}
                        </span>
                        {c.linkedin_url && (
                          <a href={c.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-ink hover:text-brand">
                            <LinkedinIcon className="size-4 text-muted" />{' '}{t('ui.linkedin')}</a>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-muted">{t('ui.visible_until_keep_this_conversation_on', { contact_expires_at: formatDate(c.contact_expires_at) })}</p>
                      <div className="mt-3">
                        <RatingWidget releaseId={c.release_id} raterKind="employer" raterLabel={t('ui.this_expert')} />
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
          <section className="grid gap-4 md:grid-cols-3">
            <Card>
              <h2 className="text-sm font-semibold text-ink">{t('ui.awaiting_unlock_2', { length: pending.length })}</h2>
              <p className="mb-3 text-xs text-muted">{t('ui.you_released_contact_they_have_2')}</p>
              {pending.length === 0 ? (
                <p className="text-sm text-muted">{t('ui.nobody_pending')}</p>
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
              <h2 className="text-sm font-semibold text-ink">{t('ui.unlocked_3', { length: unlocked.length })}</h2>
              <p className="mb-3 text-xs text-muted">{t('ui.paid_leads_contact_is_exchanged_both')}</p>
              {unlocked.length === 0 ? (
                <p className="text-sm text-muted">{t('ui.nobody_has_unlocked_yet')}</p>
              ) : (
                <ul className="flex flex-col divide-y divide-line">
                  {unlocked.map((m) => (
                    <li key={m.match_id} className="flex items-center justify-between gap-3 py-2">
                      <span className="flex items-center gap-2">
                        <Avatar name={m.full_name} src={m.avatar_path} size={32} />
                        <span className="text-sm text-ink">{m.full_name}</span>
                      </span>
                      <Pill tone="success">{t('ui.unlocked')}</Pill>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card>
              <h2 className="text-sm font-semibold text-ink">{t('ui.gone_cold', { length: cold.length })}</h2>
              <p className="mb-3 text-xs text-muted">{t('ui.the_window_ran_out_or_the')}</p>
              {cold.length === 0 ? (
                <p className="text-sm text-muted">{t('ui.nothing_has_gone_cold')}</p>
              ) : (
                <ul className="flex flex-col divide-y divide-line">
                  {cold.map((m) => (
                    <li key={m.match_id} className="flex items-center justify-between gap-3 py-2">
                      <span className="flex items-center gap-2">
                        <Avatar name={m.full_name} src={m.avatar_path} size={32} />
                        <span className="text-sm text-ink">{m.full_name}</span>
                      </span>
                      <Pill tone="neutral">{m.release_status === 'job_closed' ? t('ui.closed') : t('ui.went_cold')}</Pill>
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
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t('ui.your_matches_10', { length: matches.length })}</h2>
            {!isClosed && releasable.length > 0 && (
              <div className="flex items-center gap-2">
                {selected.length > 0 && (
                  <PrimaryButton className="h-9 px-4 text-xs" disabled={busy} onClick={() => handleRelease(selected)}>{t('ui.i_m_interested_in_selected', { length: selected.length })}</PrimaryButton>
                )}
                {released.length === 0 && matches.length > 0 && (
                  <SecondaryButton className="h-9 px-3 text-xs" disabled={busy} onClick={handlePassOnAll}>{t('ui.pass_on_all')}</SecondaryButton>
                )}
              </div>
            )}
          </div>

          {matches.length > 0 && !isClosed && (
            <Notice tone="warning">
              <strong>{t('ui.your_shortlist_holds_at_most_10')}</strong>{' '}{t('ui.experts_already_on_it_keep_their')}</Notice>
          )}

          {matches.length === 0 ? (
            <EmptyState>
              {posting.matching_status === 'open'
                ? t('ui.no_applicants_yet_your_matches_appear')
                : t('ui.no_matches_for_this_posting')}
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
                        {m.application_id ? (
                          <Link
                            to={`/employer/applications/applicant?id=${m.application_id}`}
                            className="block truncate font-medium text-ink hover:text-brand hover:underline"
                          >
                            {m.full_name}
                          </Link>
                        ) : (
                          <p className="truncate font-medium text-ink">{m.full_name}</p>
                        )}
                        <p className="truncate text-sm text-muted">{m.headline ?? m.title ?? t('ui.expert')}</p>
                        {m.business_name && <p className="truncate text-xs text-muted">{m.business_name}</p>}
                        <p className="text-xs text-muted">
                          {m.years_experience ? t('ui.experience_3', { years_experience: m.years_experience }) : ''}
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
                    {m.application_id && (
                      <Link
                        to={`/employer/applications/applicant?id=${m.application_id}`}
                        className="w-fit text-xs font-semibold text-brand hover:underline"
                      >{t('ui.view_full_profile')}</Link>
                    )}
                    <div className="mt-auto flex items-center gap-2 pt-1">
                      {done ? (
                        <Pill tone={m.release_status === 'paid' ? 'success' : m.release_status === 'awaiting_payment' ? 'warning' : 'neutral'}>
                          {m.release_status === 'paid'
                            ? t('ui.unlocked')
                            : m.release_status === 'awaiting_payment'
                              ? t('ui.interested_awaiting_unlock')
                              : t('ui.interested_went_cold')}
                        </Pill>
                      ) : isClosed ? (
                        <Pill tone="neutral">{t('ui.not_released')}</Pill>
                      ) : (
                        <>
                          <PrimaryButton className="h-9 flex-1 text-xs" disabled={busy} onClick={() => handleRelease([m.candidate_id])}>{t('ui.i_m_interested')}</PrimaryButton>
                          <label className="flex cursor-pointer items-center gap-1 text-xs text-muted">
                            <input type="checkbox" checked={checked} onChange={() => toggle(m.candidate_id)} />{t('ui.select_3')}</label>
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
