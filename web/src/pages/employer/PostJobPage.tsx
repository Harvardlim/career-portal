import { EmployerDashboardLayout } from '@/components/dashboard/EmployerDashboardLayout'
import { Field, RichText, Select, TextInput } from '@/components/dashboard/form'
import { ArrowRightIcon } from '@/components/icons'

const applyOptions = [
  {
    title: 'On Jobpilot',
    desc: 'Candidate will apply job using jobpilot & all application will show on your dashboard.',
  },
  {
    title: 'External Platform',
    desc: 'Candidate apply job on your website, all application on your own website.',
  },
  {
    title: 'On Your Email',
    desc: 'Candidate apply job on your email address, and all application in your email.',
  },
]

export function PostJobPage() {
  return (
    <EmployerDashboardLayout>
      <form onSubmit={(e) => e.preventDefault()} className="flex max-w-[860px] flex-col gap-8">
        <h1 className="text-2xl font-medium text-ink">Post a job</h1>

        <Field label="Job Tittle">
          <TextInput placeholder="Add job tittle, role, vacancies etc" />
        </Field>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Tags">
            <TextInput placeholder="Job keyword, tags etc..." />
          </Field>
          <Field label="Job Role">
            <Select options={['Select...', 'Designer', 'Developer', 'Manager']} />
          </Field>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-medium text-ink">Salary</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <Field label="Min Salary">
              <div className="flex h-12 items-center rounded-md border border-line">
                <input
                  placeholder="Minimum salary..."
                  className="h-full flex-1 rounded-l-md bg-transparent px-4 text-base text-ink outline-none placeholder:text-muted-400"
                />
                <span className="border-l border-line px-4 text-sm text-muted">USD</span>
              </div>
            </Field>
            <Field label="Max Salary">
              <div className="flex h-12 items-center rounded-md border border-line">
                <input
                  placeholder="Maximum salary..."
                  className="h-full flex-1 rounded-l-md bg-transparent px-4 text-base text-ink outline-none placeholder:text-muted-400"
                />
                <span className="border-l border-line px-4 text-sm text-muted">USD</span>
              </div>
            </Field>
            <Field label="Salary Type">
              <Select options={['Select...', 'Monthly', 'Yearly', 'Hourly']} />
            </Field>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-medium text-ink">Advance Information</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <Field label="Education">
              <Select options={['Select...', 'Graduation', 'Master Degree']} />
            </Field>
            <Field label="Experience">
              <Select options={['Select...', '1-2 Years', '2-4 Years']} />
            </Field>
            <Field label="Job Type">
              <Select options={['Select...', 'Full Time', 'Part Time', 'Remote']} />
            </Field>
            <Field label="Vacancies">
              <Select options={['Select...', '1', '2-5', '5-10']} />
            </Field>
            <Field label="Expiration Date">
              <TextInput placeholder="DD/MM/YYYY" />
            </Field>
            <Field label="Job Level">
              <Select options={['Select...', 'Entry Level', 'Mid Level', 'Expert Level']} />
            </Field>
          </div>
        </div>

        <fieldset className="flex flex-col gap-4 rounded-lg bg-surface-alt/60 p-6">
          <legend className="text-base font-medium text-ink">Apply Job on:</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            {applyOptions.map((o, i) => (
              <label
                key={o.title}
                className={`flex cursor-pointer gap-3 rounded-lg p-4 ${
                  i === 0 ? 'bg-surface shadow-sm' : ''
                }`}
              >
                <input
                  type="radio"
                  name="apply-on"
                  defaultChecked={i === 0}
                  className="mt-1 size-4 shrink-0 accent-brand"
                />
                <span className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-ink">{o.title}</span>
                  <span className="text-xs text-muted">{o.desc}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-medium text-ink">
            Description &amp; Responsibility
          </h2>
          <Field label="Description">
            <RichText placeholder="Add your job description..." />
          </Field>
          <Field label="Responsibilities">
            <RichText placeholder="Add your job responsibilities..." />
          </Field>
        </div>

        <button
          type="submit"
          className="flex w-fit items-center gap-2 rounded-[4px] bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-600"
        >
          Post Job
          <ArrowRightIcon className="size-4" />
        </button>
      </form>
    </EmployerDashboardLayout>
  )
}
