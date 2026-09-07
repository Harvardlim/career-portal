import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { EmployerDashboardLayout } from '@/components/dashboard/EmployerDashboardLayout'
import { SelectMenu, type Option } from '@/components/app/SelectMenu'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { ArrowRightIcon } from '@/components/icons'
import { errMessage } from '@/lib/errors'
import { useCategoryNames } from '@/lib/categories'
import { useDisplayUser } from '@/lib/useDisplayUser'
import {
  JOB_LIVE_DAYS,
  fetchCreditsLeft,
  spendJobCredit,
} from '@/lib/employers'
import { buildSalaryLabel, createJob, type NewJobInput } from '@/lib/jobs'

const JOB_TYPES = ['Monthly', 'Weekly', 'Hours', 'Project Basis']
const WORKPLACE_TYPES = ['On-site', 'Hybrid', 'Remote']
const RATE_PERIODS = ['Hourly', 'Weekly', 'Monthly', 'Yearly', 'Project']
const LOCATIONS = ['Malaysia', 'Singapore']

const RATE_PERIOD_FOR_JOB_TYPE: Record<string, string> = {
  Hours: 'Hourly',
  Weekly: 'Weekly',
  Monthly: 'Monthly',
  'Project Basis': 'Project',
}
const HOURS_HINT: Record<string, string> = {
  Hours: '30-40 hrs/week',
  Weekly: '3 days/week',
  Monthly: 'Full-time, 40 hrs/week',
  'Project Basis': 'On shoot',
}

const inputCls =
  'h-11 w-full rounded-md border border-line bg-surface px-4 text-sm text-ink outline-none transition focus:border-brand placeholder:text-muted-400'
const labelCls = 'mb-1 block text-xs font-medium text-ink-600'

const clean = (v: string) => (v.trim() === '' ? null : v.trim())

const Req = () => <span className="text-danger"> *</span>

/** Fields a job needs before it can go live. Missing any → save as draft. */
const REQUIRED_FIELDS: { label: string; filled: (f: FormState) => boolean }[] = [
  { label: 'Title', filled: (f) => f.title.trim() !== '' },
  { label: 'Category', filled: (f) => f.category.trim() !== '' },
  { label: 'Job type', filled: (f) => f.job_type.trim() !== '' },
  { label: 'Workplace type', filled: (f) => f.workplace_type.trim() !== '' },
  { label: 'Location', filled: (f) => f.location.trim() !== '' },
  { label: 'Description', filled: (f) => f.description.trim() !== '' },
]

type FormState = {
  title: string
  company_name: string
  category: string
  job_type: string
  workplace_type: string
  location: string
  salary_min: string
  salary_max: string
  salary_type: string
  hours: string
  duration: string
  featured: boolean
  summary: string
  description: string
  responsibilities: string
  requirements: string
  benefits: string
}

const initialState: FormState = {
  title: '',
  company_name: '',
  category: '',
  job_type: '',
  workplace_type: '',
  location: '',
  salary_min: '',
  salary_max: '',
  salary_type: '',
  hours: '',
  duration: '',
  featured: false,
  summary: '',
  description: '',
  responsibilities: '',
  requirements: '',
  benefits: '',
}

const withCurrent = (base: string[], current: string): Option[] => [
  { value: '', label: 'Select…' },
  ...base.map((v) => ({ value: v, label: v })),
  ...(current && !base.includes(current) ? [{ value: current, label: current }] : []),
]

export function PostJobPage() {
  const { user, loading } = useDisplayUser()
  const navigate = useNavigate()
  const categories = useCategoryNames()
  const [form, setForm] = useState<FormState>(initialState)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draftPrompt, setDraftPrompt] = useState(false)
  const [publishPrompt, setPublishPrompt] = useState(false)
  const [creditsLeft, setCreditsLeft] = useState<number | null>(null)

  const employerId =
    user?.role === 'employer' ? (user.profileId ?? null) : null

  useEffect(() => {
    if (!employerId) return
    let alive = true
    fetchCreditsLeft(employerId)
      .then((n) => alive && setCreditsLeft(n))
      .catch((err) => console.error('credits', err))
    return () => {
      alive = false
    }
  }, [employerId])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  // Picking a job type auto-selects the matching rate period (backoffice parity).
  const setJobType = (v: string) =>
    setForm((f) => ({
      ...f,
      job_type: v,
      salary_type: RATE_PERIOD_FOR_JOB_TYPE[v] ?? f.salary_type,
      hours: v === 'Project Basis' && !f.hours ? 'On shoot' : f.hours,
    }))

  const companyName = user?.name || form.company_name || ''
  const categoryOptions = withCurrent(categories, form.category)
  const jobTypeOptions = withCurrent(JOB_TYPES, form.job_type)
  const workplaceOptions = withCurrent(WORKPLACE_TYPES, form.workplace_type)
  const locationOptions = withCurrent(LOCATIONS, form.location)
  const ratePeriodOptions = withCurrent(RATE_PERIODS, form.salary_type)

  const salaryMin = form.salary_min.trim() === '' ? null : Number(form.salary_min)
  const salaryMax = form.salary_max.trim() === '' ? null : Number(form.salary_max)
  const previewLabel =
    buildSalaryLabel(salaryMin, salaryMax, form.salary_type || null) ?? '—'

  const missing = REQUIRED_FIELDS.filter((r) => !r.filled(form)).map((r) => r.label)

  /**
   * `forceDraft` saves a draft (no credit). Otherwise the job is published:
   * missing required fields are refused, and — unless `confirmed` — a
   * "1 credit will be deducted" prompt is shown first.
   */
  async function persist(forceDraft: boolean, confirmed = false) {
    if (!user || user.role !== 'employer' || !user.profileId) {
      toast.error('Only employer accounts can post a job.')
      return
    }
    if (form.title.trim() === '') {
      setError('Title is required — even a draft needs one.')
      return
    }

    if (!forceDraft) {
      if (missing.length > 0) {
        setDraftPrompt(true)
        return
      }
      if (creditsLeft !== null && creditsLeft < 1) {
        toast.error('You need at least 1 credit to publish a job.')
        return
      }
      if (!confirmed) {
        setPublishPrompt(true)
        return
      }
    }

    setDraftPrompt(false)
    setPublishPrompt(false)
    setSubmitting(true)
    setError(null)

    const now = new Date()
    const input: NewJobInput = {
      title: form.title.trim(),
      company_name: clean(companyName),
      category: form.category ? clean(form.category) : null,
      job_type: form.job_type || null,
      workplace_type: form.workplace_type || null,
      location: form.location ? clean(form.location) : null,
      salary_min: salaryMin,
      salary_max: salaryMax,
      salary_type: form.salary_type || null,
      salary_label: buildSalaryLabel(salaryMin, salaryMax, form.salary_type || null),
      hours: form.hours ? clean(form.hours) : null,
      duration: form.duration ? clean(form.duration) : null,
      status: forceDraft ? 'draft' : 'active',
      featured: form.featured,
      expires_at: forceDraft
        ? null
        : new Date(now.getTime() + JOB_LIVE_DAYS * 86_400_000).toISOString(),
      first_published_at: forceDraft ? null : now.toISOString(),
      credit_charged: !forceDraft,
      summary: form.summary.trim() || null,
      description: form.description || null,
      responsibilities: form.responsibilities || null,
      requirements: form.requirements || null,
      benefits: form.benefits || null,
    }

    try {
      const slug = await createJob(user.profileId, input)
      if (forceDraft) {
        toast.success('Saved as draft')
        navigate('/employer/my-jobs')
      } else {
        await spendJobCredit(user.profileId, `Job post: ${input.title}`)
        toast.success('Job published — live for 30 days')
        navigate(`/job/${slug}`)
      }
    } catch (err) {
      setError(errMessage(err))
      toast.error(errMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    void persist(false)
  }

  return (
    <EmployerDashboardLayout>
      <form onSubmit={handleSubmit} className="flex max-w-[860px] flex-col gap-6">
        <h1 className="text-2xl font-medium text-ink">Post a job</h1>

        {!loading && user && user.role !== 'employer' && (
          <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
            This account isn&apos;t an employer account, so it can&apos;t post jobs.
          </p>
        )}

        <p className="text-xs text-muted">
          Fields marked <Req /> are required for a job to go live. You can save an
          incomplete job as a draft and publish it later.
        </p>

        {employerId && creditsLeft !== null && (
          <p
            className={`rounded-md px-4 py-3 text-sm ${
              creditsLeft < 1
                ? 'bg-red-50 text-red-600'
                : 'bg-brand-50 text-brand'
            }`}
          >
            Publishing costs 1 credit. You have{' '}
            <span className="font-semibold">{creditsLeft}</span> credit
            {creditsLeft === 1 ? '' : 's'}.{' '}
            {creditsLeft < 1 && (
              <Link to="/employer/pricing" className="font-semibold underline">
                Buy credits
              </Link>
            )}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls}>
              Title
              <Req />
            </label>
            <input
              className={inputCls}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls}>Company</label>
            <input
              className={`${inputCls} cursor-not-allowed bg-surface-alt text-muted`}
              value={user?.name ?? 'Loading…'}
              disabled
              readOnly
            />
          </div>
          <div>
            <label className={labelCls}>
              Category
              <Req />
            </label>
            <SelectMenu
              value={form.category}
              onChange={(v) => set('category', v)}
              options={categoryOptions}
              placeholder={categories.length === 0 ? 'Loading…' : 'Select…'}
            />
          </div>
          <div>
            <label className={labelCls}>
              Job type
              <Req />
            </label>
            <SelectMenu
              value={form.job_type}
              onChange={setJobType}
              options={jobTypeOptions}
            />
          </div>
          <div>
            <label className={labelCls}>
              Workplace type
              <Req />
            </label>
            <SelectMenu
              value={form.workplace_type}
              onChange={(v) => set('workplace_type', v)}
              options={workplaceOptions}
            />
          </div>
          <div>
            <label className={labelCls}>
              Location
              <Req />
            </label>
            <SelectMenu
              value={form.location}
              onChange={(v) => set('location', v)}
              options={locationOptions}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelCls}>Rate</label>
            <div className="grid grid-cols-[1fr_1fr_1.2fr] gap-2">
              <input
                className={inputCls}
                inputMode="numeric"
                placeholder="Min"
                value={form.salary_min}
                onChange={(e) => set('salary_min', e.target.value)}
              />
              <input
                className={inputCls}
                inputMode="numeric"
                placeholder="Max"
                value={form.salary_max}
                onChange={(e) => set('salary_max', e.target.value)}
              />
              <SelectMenu
                value={form.salary_type}
                onChange={(v) => set('salary_type', v)}
                options={ratePeriodOptions}
                placeholder="Period"
              />
            </div>
            <p className="mt-1 text-xs text-muted">
              Leave blank for “Not posted”. Shown as {previewLabel}
            </p>
          </div>

          <div>
            <label className={labelCls}>Hours</label>
            <input
              className={inputCls}
              placeholder={HOURS_HINT[form.job_type] ?? 'e.g. 30-40 hrs/week'}
              value={form.hours}
              onChange={(e) => set('hours', e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Duration</label>
            <input
              className={inputCls}
              placeholder="12 months"
              value={form.duration}
              onChange={(e) => set('duration', e.target.value)}
            />
          </div>

          <div className="flex flex-col justify-end">
            <p className="text-xs text-muted">
              Published jobs stay live for {JOB_LIVE_DAYS} days from the publish
              date. You can extend them later from My Jobs.
            </p>
          </div>
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink-600">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => set('featured', e.target.checked)}
              className="size-4 accent-brand"
            />
            Featured
          </label>

          <div className="sm:col-span-2">
            <label className={labelCls}>Summary</label>
            <textarea
              className={`${inputCls} h-auto py-2`}
              rows={2}
              value={form.summary}
              onChange={(e) => set('summary', e.target.value)}
              placeholder="One or two lines shown at the top of the job page."
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>
              Description
              <Req />
            </label>
            <RichTextEditor
              value={form.description}
              onChange={(html) => set('description', html)}
              placeholder="Overview of the role…"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Key Responsibilities</label>
            <RichTextEditor
              value={form.responsibilities}
              onChange={(html) => set('responsibilities', html)}
              placeholder="What this person will own and do…"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Required Qualifications &amp; Experience</label>
            <RichTextEditor
              value={form.requirements}
              onChange={(html) => set('requirements', html)}
              placeholder="Must-have skills, experience, education…"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Benefits</label>
            <RichTextEditor
              value={form.benefits}
              onChange={(html) => set('benefits', html)}
              placeholder="Perks, leave, equipment budget…"
            />
          </div>
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
          <button
            type="button"
            onClick={() => void persist(true)}
            disabled={submitting}
            className="rounded-[4px] border border-line px-6 py-3 text-base font-semibold text-ink-600 transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Save as Draft'}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-[4px] bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Publishing…' : 'Publish Job'}
            <ArrowRightIcon className="size-4" />
          </button>
          {missing.length > 0 && (
            <span className="text-xs text-muted">
              Missing for publish: {missing.join(', ')}
            </span>
          )}
        </div>
      </form>

      {draftPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-[440px] rounded-xl bg-surface p-6 shadow-2xl">
            <h2 className="text-lg font-medium text-ink">
              Some required fields are empty
            </h2>
            <p className="mt-2 text-sm text-muted-600">
              This job can&apos;t be published yet. Fill these in first, or save
              it as a draft and finish later:
            </p>
            <ul className="mt-3 list-disc pl-5 text-sm text-ink-600">
              {missing.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDraftPrompt(false)}
                className="rounded-[4px] border border-line px-5 py-2.5 text-sm font-semibold text-ink-600 hover:text-ink"
              >
                Edit first
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void persist(true)}
                className="rounded-[4px] bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {submitting ? 'Saving…' : 'Save as Draft'}
              </button>
            </div>
          </div>
        </div>
      )}

      {publishPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-[440px] rounded-xl bg-surface p-6 shadow-2xl">
            <h2 className="text-lg font-medium text-ink">Publish this job?</h2>
            <p className="mt-2 text-sm text-muted-600">
              1 credit will be deducted and the job goes live for{' '}
              {JOB_LIVE_DAYS} days.
              {creditsLeft !== null && (
                <>
                  {' '}
                  You&apos;ll have{' '}
                  <span className="font-medium text-ink">
                    {Math.max(0, creditsLeft - 1)}
                  </span>{' '}
                  credit{creditsLeft - 1 === 1 ? '' : 's'} left.
                </>
              )}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPublishPrompt(false)}
                className="rounded-[4px] border border-line px-5 py-2.5 text-sm font-semibold text-ink-600 hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void persist(false, true)}
                className="rounded-[4px] bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {submitting ? 'Publishing…' : 'Yes, publish now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </EmployerDashboardLayout>
  )
}
