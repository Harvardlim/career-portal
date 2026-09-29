import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { EmployerJob } from '@/data/employerJobs'
import {
  CheckIcon,
  MoreIcon,
  UsersIcon,
  XCircleIcon,
} from '@/components/icons'
import { useT } from '@/lib/i18n'

export function JobPostRow({ job }: { job: EmployerJob }) {
  const t = useT()
  const [menu, setMenu] = useState(false)
  const active = job.status === 'active'
  return (
    <div
      className={`grid grid-cols-1 items-center gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_130px_170px_auto] sm:gap-6 ${
        job.highlighted ? 'border-brand shadow-feature' : 'border-transparent'
      }`}
    >
      <div className="flex flex-col gap-1">
        <span className="font-medium text-ink">{job.title}</span>
        <span className="text-sm text-muted">
          {job.type} <span className="px-1">•</span> {job.remaining}
        </span>
      </div>
      <span
        className={`flex items-center gap-1.5 text-sm font-medium ${
          active ? 'text-[#0ba02c]' : 'text-danger'
        }`}
      >
        {active ? <CheckIcon className="size-4" /> : <XCircleIcon className="size-4" />}
        {active ? t('ui.active') : t('ui.expire')}
      </span>
      <span className="flex items-center gap-2 text-sm text-ink-600">
        <UsersIcon className="size-4" />{t('ui.applications', { applications: job.applications })}</span>
      <div className="flex items-center gap-2">
        <Link
          to="/employer/applications"
          className={`rounded-[4px] px-5 py-2.5 text-sm font-semibold ${
            job.highlighted
              ? 'bg-brand text-white'
              : 'bg-brand-50 text-brand hover:bg-brand-100'
          }`}
        >{t('ui.view_applications')}</Link>
        <div className="relative">
          <button
            type="button"
            aria-label={t('ui.job_actions')}
            onClick={() => setMenu((v) => !v)}
            className="grid size-9 place-items-center rounded text-muted hover:bg-surface-alt"
          >
            <MoreIcon className="size-5" />
          </button>
          {menu && (
            <div className="absolute right-0 top-10 z-10 w-44 rounded-lg border border-line bg-surface py-1 text-sm shadow-lg">
              <button className="block w-full px-4 py-2 text-left text-brand hover:bg-surface-alt">{t('ui.promote_job')}</button>
              <button className="block w-full px-4 py-2 text-left text-ink-600 hover:bg-surface-alt">{t('ui.view_detail')}</button>
              <button className="block w-full px-4 py-2 text-left text-ink-600 hover:bg-surface-alt">{t('ui.make_it_expire')}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
