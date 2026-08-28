import { useNavigate } from 'react-router-dom'
import { JobDetailPage } from '@/pages/JobDetailPage'
import { Dialog } from '@/components/app/Dialog'
import { ArrowRightIcon, ChevronDownIcon } from '@/components/icons'

const toolbarButtons = ['B', 'I', 'U', 'S', '🔗', '• ', '1.']

export function ApplyJobPage() {
  const navigate = useNavigate()
  return (
    <>
      <JobDetailPage />
      <Dialog closeTo="/job-detail">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            navigate('/job-detail')
          }}
          className="flex flex-col gap-6 p-8"
        >
          <h2 className="text-xl font-medium text-ink">
            Apply Job: Senior UX Designer
          </h2>

          <label className="flex flex-col gap-2 text-sm text-muted-600">
            Choose Resume
            <div className="relative">
              <select
                defaultValue=""
                className="h-12 w-full appearance-none rounded-md border border-line bg-surface px-4 pr-9 text-base text-ink outline-none focus:border-brand"
              >
                <option value="" disabled>
                  Select...
                </option>
                <option>Professional Resume</option>
                <option>UX Portfolio 2024</option>
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-muted" />
            </div>
          </label>

          <label className="flex flex-col gap-2 text-sm text-muted-600">
            Cover Letter
            <div className="rounded-md border border-line focus-within:border-brand">
              <textarea
                rows={5}
                placeholder="Write down your biography here. Let the employers know who you are..."
                className="w-full resize-none bg-transparent p-4 text-base text-ink outline-none placeholder:text-muted-400"
              />
              <div className="flex gap-1 border-t border-line px-3 py-2 text-sm text-muted">
                {toolbarButtons.map((b, i) => (
                  <button
                    key={i}
                    type="button"
                    className="grid size-7 place-items-center rounded hover:bg-surface-alt"
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </label>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/job-detail')}
              className="rounded-[4px] bg-brand-50 px-6 py-3 text-base font-semibold text-brand"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-3 rounded-[4px] bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-600"
            >
              Apply Now
              <ArrowRightIcon className="size-5" />
            </button>
          </div>
        </form>
      </Dialog>
    </>
  )
}
