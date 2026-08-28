import { Link, useNavigate } from 'react-router-dom'
import { PostJobPage } from '@/pages/employer/PostJobPage'
import { MyJobsPage } from '@/pages/employer/MyJobsPage'
import { JobApplicationsPage } from '@/pages/employer/JobApplicationsPage'
import { Dialog } from '@/components/app/Dialog'
import { ArrowRightIcon, CheckIcon } from '@/components/icons'

export function AddColumnPage() {
  const navigate = useNavigate()
  return (
    <>
      <JobApplicationsPage />
      <Dialog closeTo="/employer/applications" width="max-w-[480px]">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            navigate('/employer/applications')
          }}
          className="flex flex-col gap-6 p-8"
        >
          <h2 className="text-lg font-medium text-ink">Add New Column</h2>
          <label className="flex flex-col gap-2 text-sm text-ink">
            Column Name
            <input
              className="h-12 rounded-md border border-line px-4 text-base text-ink outline-none focus:border-brand"
            />
          </label>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/employer/applications')}
              className="rounded-[4px] bg-brand-50 px-6 py-3 text-sm font-semibold text-brand"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-[4px] bg-brand px-6 py-3 text-sm font-semibold text-white"
            >
              Add Column
            </button>
          </div>
        </form>
      </Dialog>
    </>
  )
}

/**
 * The Figma nodes for these two modals only contain the dark overlay rectangle,
 * so the content follows the MyJob template's standard success / promote dialogs.
 */

export function PostJobSuccessPage() {
  return (
    <>
      <PostJobPage />
      <Dialog closeTo="/employer/my-jobs" width="max-w-[480px]">
        <div className="flex flex-col items-center gap-5 p-10 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-brand-50 text-brand">
            <CheckIcon className="size-8" />
          </span>
          <h2 className="text-xl font-medium text-ink">
            🎉 Your job is successfully posted!
          </h2>
          <p className="text-sm text-muted-600">
            Your job posting is now live and candidates can start applying right
            away. You can manage it any time from My Jobs.
          </p>
          <div className="flex gap-3">
            <Link
              to="/employer/my-jobs"
              className="rounded-[4px] bg-brand-50 px-6 py-3 text-sm font-semibold text-brand"
            >
              View Jobs
            </Link>
            <Link
              to="/employer/post-job"
              className="flex items-center gap-2 rounded-[4px] bg-brand px-6 py-3 text-sm font-semibold text-white"
            >
              Post Another Job
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        </div>
      </Dialog>
    </>
  )
}

export function PromoteJobPage() {
  return (
    <>
      <MyJobsPage />
      <Dialog closeTo="/employer/my-jobs" width="max-w-[520px]">
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col gap-6 p-8"
        >
          <h2 className="text-xl font-medium text-ink">Promote Job</h2>
          <p className="text-sm text-muted-600">
            Boost this job to the top of search results and highlight it in the
            listings.
          </p>

          <fieldset className="flex flex-col gap-3">
            {[
              { label: 'Featured Job', desc: 'Pinned to the top with a highlighted card.', price: '$9' },
              { label: 'Urgent Job', desc: 'Adds an “Urgent” badge to attract applicants.', price: '$5' },
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

          <label className="flex flex-col gap-2 text-sm text-ink">
            Duration
            <select className="h-12 rounded-md border border-line px-4 text-base text-ink outline-none focus:border-brand">
              <option>7 days</option>
              <option>14 days</option>
              <option>30 days</option>
            </select>
          </label>

          <div className="flex items-center justify-between border-t border-line pt-4 text-sm font-medium text-ink">
            <span>Total</span>
            <span>$9 USD</span>
          </div>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-[4px] bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-600"
          >
            Promote Now
            <ArrowRightIcon className="size-4" />
          </button>
        </form>
      </Dialog>
    </>
  )
}
