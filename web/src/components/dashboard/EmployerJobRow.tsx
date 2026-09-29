import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckIcon, MoreIcon, UsersIcon, XCircleIcon } from '@/components/icons'
import { errMessage } from '@/lib/errors'
import { expiryLabel } from '@/lib/dashboard'
import {
  deleteJob,
  extendJob,
  publishJob,
  updateJobStatus,
  NoCreditError,
  type EmployerJobRow as JobRecord,
} from '@/lib/employers'
import { useT, tr } from '@/lib/i18n'

type Status = 'draft' | 'expired'
type Confirm = 'publish' | 'extend' | 'delete'

const ACTIONS: { status: Status; label: string; toast: string }[] = [
  { status: 'draft', get label() { return tr('ejr.draft') }, get toast() { return tr('ejr.draft_t') } },
  { status: 'expired', get label() { return tr('ejr.expire') }, get toast() { return tr('ejr.expire_t') } },
]

export function EmployerJobRow({
  job,
  employerId,
  onChanged,
}: {
  job: JobRecord
  employerId: string
  onChanged?: () => void
}) {
  const t = useT()
  const [menu, setMenu] = useState(false)
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const active = job.status === 'active'
  const isDraft = job.status === 'draft'
  const { text } = expiryLabel(job.expires_at)

  const statusLabel = active ? t('ejr.published') : isDraft ? t('ejr.draft_lbl') : t('ejr.expired')
  const statusColor = active
    ? 'text-[#0ba02c]'
    : isDraft
      ? 'text-star'
      : 'text-danger'
  const subLine = active ? text : isDraft ? t('ejr.not_published') : t('ejr.expired')

  function ask(which: Confirm) {
    setMenu(false)
    setConfirm(which)
  }

  async function setStatus(status: Status, message: string) {
    setBusy(true)
    setMenu(false)
    try {
      await updateJobStatus(job.id, status)
      toast.success(message)
      onChanged?.()
    } catch (err) {
      toast.error(errMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function runConfirm() {
    if (!confirm) return
    setBusy(true)
    try {
      if (confirm === 'publish') {
        await publishJob(employerId, job)
        toast.success(t('ui.job_published'))
      } else if (confirm === 'extend') {
        await extendJob(employerId, job)
        toast.success(t('ui.job_extended_by_30_days'))
      } else {
        await deleteJob(job.id)
        toast.success(t('ui.job_deleted'))
      }
      setConfirm(null)
      onChanged?.()
    } catch (err) {
      toast.error(
        err instanceof NoCreditError
          ? t('ui.you_have_no_credits_left_buy')
          : errMessage(err),
      )
    } finally {
      setBusy(false)
    }
  }

  const dialog: Record<Confirm, { title: string; body: string; cta: string; danger?: boolean }> = {
    publish: {
      title: t('ui.publish_this_job'),
      body: job.credit_charged
        ? t('ejr.publish_free', { title: job.title })
        : t('ejr.publish_paid', { title: job.title }),
      cta: t('ui.yes_publish_now'),
    },
    extend: {
      title: t('ui.extend_this_job'),
      body: t('ui.1_credit_will_be_deducted_to', { title: job.title }),
      cta: t('ui.yes_extend_30_days'),
    },
    delete: {
      title: t('ui.delete_this_job'),
      body: t('ui.and_its_data_will_be_removed', { title: job.title }),
      cta: t('ui.delete'),
      danger: true,
    },
  }

  return (
    <div className="grid grid-cols-1 items-center gap-3 rounded-lg border border-transparent p-4 sm:grid-cols-[1fr_130px_170px_auto] sm:gap-6">
      <div className="flex flex-col gap-1">
        <Link to={`/job/${job.slug}`} className="font-medium text-ink hover:text-brand">
          {job.title}
        </Link>
        <span className="text-sm text-muted">
          {job.job_type ?? ', '} <span className="px-1">•</span> {subLine}
        </span>
      </div>
      <span
        className={`flex items-center gap-1.5 text-sm font-medium ${statusColor}`}
      >
        {active ? (
          <CheckIcon className="size-4" />
        ) : isDraft ? (
          <span className="size-2 rounded-full bg-current" />
        ) : (
          <XCircleIcon className="size-4" />
        )}
        {statusLabel}
      </span>
      <span className="flex items-center gap-2 text-sm text-ink-600">
        <UsersIcon className="size-4" />{t('ui.application', { applications: job.applications })}{job.applications === 1 ? '' : t('ui.plural_s')}
      </span>
      <div className="flex items-center gap-2">
        <Link
          to={`/employer/applications?job=${job.id}`}
          className="rounded-[4px] bg-brand-50 px-5 py-2.5 text-sm font-semibold text-brand hover:bg-brand-100"
        >{t('ui.view_applications')}</Link>
        <div className="relative">
          <button
            type="button"
            aria-label={t('ui.job_actions')}
            disabled={busy}
            onClick={() => setMenu((v) => !v)}
            className="grid size-9 place-items-center rounded text-muted hover:bg-surface-alt disabled:opacity-40"
          >
            <MoreIcon className="size-5" />
          </button>
          {menu && (
            <div className="absolute right-0 top-10 z-10 w-44 rounded-lg border border-line bg-surface py-1 text-sm shadow-lg">
              <Link
                to={`/job/${job.slug}`}
                className="block px-4 py-2 text-left text-ink-600 hover:bg-surface-alt"
              >{t('ui.view_detail')}</Link>
              {job.status !== 'active' && (
                <button
                  type="button"
                  onClick={() => ask('publish')}
                  className="block w-full px-4 py-2 text-left text-ink-600 hover:bg-surface-alt"
                >{t('ui.publish')}</button>
              )}
              {(job.status === 'active' || job.status === 'expired') && (
                <button
                  type="button"
                  onClick={() => ask('extend')}
                  className="block w-full px-4 py-2 text-left text-ink-600 hover:bg-surface-alt"
                >{t('ui.extend_30_days')}</button>
              )}
              {ACTIONS.filter((a) => a.status !== job.status).map((a) => (
                <button
                  key={a.status}
                  type="button"
                  onClick={() => setStatus(a.status, a.toast)}
                  className="block w-full px-4 py-2 text-left text-ink-600 hover:bg-surface-alt"
                >
                  {a.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => ask('delete')}
                className="block w-full px-4 py-2 text-left text-danger hover:bg-surface-alt"
              >{t('ui.delete')}</button>
            </div>
          )}
        </div>
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-[420px] rounded-xl bg-surface p-6 shadow-2xl">
            <h2 className="text-lg font-medium text-ink">{dialog[confirm].title}</h2>
            <p className="mt-2 text-sm text-muted-600">{dialog[confirm].body}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                disabled={busy}
                className="rounded-[4px] border border-line px-5 py-2.5 text-sm font-semibold text-ink-600 hover:text-ink disabled:opacity-50"
              >{t('ui.cancel')}</button>
              <button
                type="button"
                onClick={runConfirm}
                disabled={busy}
                className={`rounded-[4px] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${
                  dialog[confirm].danger
                    ? 'bg-danger hover:bg-danger/90'
                    : 'bg-brand hover:bg-brand-600'
                }`}
              >
                {busy ? t('ui.working') : dialog[confirm].cta}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
