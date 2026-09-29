import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { PostJobPage } from '@/pages/employer/PostJobPage'
import { MyJobsPage } from '@/pages/employer/MyJobsPage'
import { Dialog } from '@/components/app/Dialog'
import { SelectMenu } from '@/components/app/SelectMenu'
import { ArrowRightIcon, CheckIcon } from '@/components/icons'
import { useT, tr } from '@/lib/i18n'

/** Custom kanban columns were dropped in favour of the four fixed statuses. */
export function AddColumnPage() {
  return <Navigate to="/employer/applications" replace />
}

export function PostJobSuccessPage() {
  const t = useT()
  return (
    <>
      <PostJobPage />
      <Dialog closeTo="/employer/my-jobs" width="max-w-[480px]">
        <div className="flex flex-col items-center gap-5 p-10 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-brand-50 text-brand">
            <CheckIcon className="size-8" />
          </span>
          <h2 className="text-xl font-medium text-ink">{t('ui.your_job_is_successfully_posted')}</h2>
          <p className="text-sm text-muted-600">{t('ui.your_job_posting_is_now_live')}</p>
          <div className="flex gap-3">
            <Link
              to="/employer/my-jobs"
              className="rounded-[4px] bg-brand-50 px-6 py-3 text-sm font-semibold text-brand"
            >{t('ui.view_jobs')}</Link>
            <Link
              to="/employer/post-job"
              className="flex items-center gap-2 rounded-[4px] bg-brand px-6 py-3 text-sm font-semibold text-white"
            >{t('ui.post_another_job')}<ArrowRightIcon className="size-4" />
            </Link>
          </div>
        </div>
      </Dialog>
    </>
  )
}

const DURATION_OPTIONS = [
  { value: '7', get label() { return tr('em.d7') } },
  { value: '14', get label() { return tr('em.d14') } },
  { value: '30', get label() { return tr('em.d30') } },
]

export function PromoteJobPage() {
  const t = useT()
  const [duration, setDuration] = useState('7')
  return (
    <>
      <MyJobsPage />
      <Dialog closeTo="/employer/my-jobs" width="max-w-[520px]">
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col gap-6 p-8"
        >
          <h2 className="text-xl font-medium text-ink">{t('ui.promote_job')}</h2>
          <p className="text-sm text-muted-600">{t('ui.boost_this_job_to_the_top')}</p>

          <fieldset className="flex flex-col gap-3">
            {[
              { label: t('ui.featured_job_2'), desc: t('em.featured'), price: '$9' },
              { label: t('ui.urgent_job'), desc: t('em.urgent'), price: '$5' },
            ].map((o, i) => (
              <label
                key={o.label}
                className={`flex cursor-pointer gap-3 rounded-lg border p-4 ${
                  i === 0 ? 'border-brand' : 'border-line'
                }`}
              >
                <input
                  type="radio"
                  name="promo"
                  defaultChecked={i === 0}
                  className="mt-1 size-4 accent-brand"
                />
                <span className="flex flex-1 items-start justify-between gap-3">
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-ink">{o.label}</span>
                    <span className="text-xs text-muted">{o.desc}</span>
                  </span>
                  <span className="text-sm font-medium text-ink">{o.price}</span>
                </span>
              </label>
            ))}
          </fieldset>

          <div className="flex flex-col gap-2 text-sm text-ink">{t('ui.duration')}<SelectMenu value={duration} onChange={setDuration} options={DURATION_OPTIONS} />
          </div>

          <div className="flex items-center justify-between border-t border-line pt-4 text-sm font-medium text-ink">
            <span>{t('ui.total')}</span>
            <span>{t('ui.9_usd')}</span>
          </div>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-[4px] bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-600"
          >{t('ui.promote_now')}<ArrowRightIcon className="size-4" />
          </button>
        </form>
      </Dialog>
    </>
  )
}
