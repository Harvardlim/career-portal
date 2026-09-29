import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { EmployerDashboardLayout } from '@/components/dashboard/EmployerDashboardLayout'
import { MoreIcon } from '@/components/icons'
import { Pill, VerifiedChips } from '@/components/partly/ui'
import { errMessage } from '@/lib/errors'
import { initialsFromName } from '@/lib/name'
import {
  fetchApplications,
  updateApplicationStatus,
  useEmployer,
  type ApplicationRow,
  type ApplicationStatus,
} from '@/lib/employers'
import { formatDate } from '@/lib/format'
import { useT, tr } from '@/lib/i18n'

const COLUMNS: { key: ApplicationStatus; label: string }[] = [
  { key: 'active', get label() { return tr('col.new') } },
  { key: 'shortlisted', get label() { return tr('col.shortlisted') } },
  { key: 'rejected', get label() { return tr('col.rejected') } },
  { key: 'interested', get label() { return tr('col.interested') } },
]

/** Cards reach "Interested" only by releasing contact, so it is never a manual move target. */
const MOVE_TARGETS = COLUMNS.filter((c) => c.key !== 'interested')

const RELEASE_LABEL: Record<string, { text: string; tone: 'warning' | 'success' | 'neutral' }> = {
  awaiting_payment: { get text() { return tr('rel.awaiting') }, tone: 'warning' },
  paid: { get text() { return tr('rel.paid') }, tone: 'success' },
  cold: { get text() { return tr('rel.cold') }, tone: 'neutral' },
  job_closed: { get text() { return tr('rel.closed') }, tone: 'neutral' },
}

export function JobApplicationsPage() {
  const t = useT()
  const { employer, loading: employerLoading } = useEmployer()
  const [params] = useSearchParams()
  const jobFilter = params.get('job')
  const [rows, setRows] = useState<ApplicationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!employer) return
    setLoading(true)
    fetchApplications()
      .then(setRows)
      .catch((err) => console.error('applications', err))
      .finally(() => setLoading(false))
  }, [employer])

  useEffect(() => {
    if (!employer) {
      if (!employerLoading) setLoading(false)
      return
    }
    load()
  }, [employer, employerLoading, load])

  const visible = useMemo(
    () => (jobFilter ? rows.filter((r) => r.job?.id === jobFilter) : rows),
    [rows, jobFilter],
  )

  async function move(row: ApplicationRow, status: ApplicationStatus) {
    if (row.status === 'interested' || status === 'interested') return
    setOpenMenu(null)
    setRows((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, status } : r)),
    )
    try {
      await updateApplicationStatus(row.id, status)
    } catch (err) {
      toast.error(errMessage(err))
      load()
    }
  }

  const jobTitle = jobFilter
    ? visible[0]?.job?.title ?? rows.find((r) => r.job?.id === jobFilter)?.job?.title
    : null

  return (
    <EmployerDashboardLayout>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg font-medium text-ink">
            {jobTitle ? t('ui.applications_2', { jobTitle }) : t('ui.job_applications')}{' '}
            <span className="text-muted">({visible.length})</span>
          </h1>
          {jobFilter && (
            <Link to="/employer/applications" className="text-sm font-medium text-brand">{t('ui.show_all_jobs')}</Link>
          )}
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-muted">{t('ui.loading_2')}</p>
        ) : visible.length === 0 ? (
          <p className="rounded-lg bg-surface-alt px-4 py-12 text-center text-sm text-muted">{t('ui.no_applications_yet')}</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-4">
            {COLUMNS.map((col) => {
              const items = visible.filter((r) => r.status === col.key)
              return (
                <div key={col.key} className="flex flex-col gap-3 rounded-lg bg-surface-alt/60 p-3">
                  <p className="px-1 text-sm font-medium text-ink">
                    {col.label}{' '}
                    <span className="text-muted">({items.length})</span>
                  </p>
                  {items.map((row) => (
                    <div
                      key={row.id}
                      className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand">
                            {initialsFromName(row.candidate?.full_name) || '?'}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-ink">
                              {row.candidate?.full_name ?? t('ui.unknown')}
                            </span>
                            <span className="text-xs text-muted">
                              {row.candidate?.headline ||
                                row.candidate?.title ||
                                row.candidate?.expertise_field?.[0] ||
                                ', '}
                            </span>
                          </div>
                        </div>
                        {row.status !== 'interested' && (
                        <div className="relative">
                          <button
                            type="button"
                            aria-label={t('ui.move_applicant')}
                            onClick={() =>
                              setOpenMenu(openMenu === row.id ? null : row.id)
                            }
                            className="grid size-8 place-items-center rounded text-muted hover:bg-surface-alt"
                          >
                            <MoreIcon className="size-4" />
                          </button>
                          {openMenu === row.id && (
                            <div className="absolute right-0 top-9 z-10 w-40 rounded-lg border border-line bg-surface py-1 text-sm shadow-lg">
                              {MOVE_TARGETS.filter((c) => c.key !== row.status).map(
                                (c) => (
                                  <button
                                    key={c.key}
                                    type="button"
                                    onClick={() => move(row, c.key)}
                                    className="block w-full px-4 py-2 text-left text-ink-600 hover:bg-surface-alt"
                                  >{t('ui.move_to', { label: c.label })}</button>
                                ),
                              )}
                            </div>
                          )}
                        </div>
                        )}
                      </div>
                      {row.candidate && (
                        <VerifiedChips identity={row.candidate.identity_verified} badge={row.candidate.badge_verified} />
                      )}
                      {row.status === 'interested' && row.release_status && (
                        <Pill tone={RELEASE_LABEL[row.release_status]?.tone ?? 'neutral'}>
                          {RELEASE_LABEL[row.release_status]?.text ?? row.release_status}
                        </Pill>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted">
                        <span>{row.candidate?.education || ', '}</span>
                        <span>
                          {formatDate(row.applied_at)}
                        </span>
                      </div>
                      <Link
                        to={`/employer/applications/applicant?id=${row.id}${
                          jobFilter ? `&job=${jobFilter}` : ''
                        }`}
                        className="rounded-[4px] bg-brand-50 py-2 text-center text-xs font-semibold text-brand hover:bg-brand-100"
                      >{t('ui.view_profile')}</Link>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <p className="px-1 py-4 text-center text-xs text-muted">{t('ui.nothing_here')}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </EmployerDashboardLayout>
  )
}
