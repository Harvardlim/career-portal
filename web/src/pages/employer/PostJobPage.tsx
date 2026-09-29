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
import { useT } from '@/lib/i18n'

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

const withCurrent = (base: string[], current: string, placeholder: string): Option[] => {
  return ([
  { value: '', label: placeholder },
  ...base.map((v) => ({ value: v, label: v })),
  ...(current && !base.includes(current) ? [{ value: current, label: current }] : []),
])
}

export function PostJobPage() {
  const t = useT()
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
  const categoryOptions = withCurrent(categories, form.category, t('ui.select_3'))
  const jobTypeOptions = withCurrent(JOB_TYPES, form.job_type, t('ui.select_3'))
  const workplaceOptions = withCurrent(WORKPLACE_TYPES, form.workplace_type, t('ui.select_3'))
  const locationOptions = withCurrent(LOCATIONS, form.location, t('ui.select_3'))
  const ratePeriodOptions = withCurrent(RATE_PERIODS, form.salary_type, t('ui.select_3'))

  const salaryMin = form.salary_min.trim() === '' ? null : Number(form.salary_min)
  const salaryMax = form.salary_max.trim() === '' ? null : Number(form.salary_max)
  const previewLabel =
    buildSalaryLabel(salaryMin, salaryMax, form.salary_type || null) ?? ', '

  const missing = REQUIRED_FIELDS.filter((r) => !r.filled(form)).map((r) => r.label)

  /**
   * `forceDraft` saves a draft (no credit). Otherwise the job is published:
   * missing required fields are refused, and ,  unless `confirmed` ,  a
   * "1 credit will be deducted" prompt is shown first.
   */
  async function persist(forceDraft: boolean, confirmed = false) {
    if (!user || user.role !== 'employer' || !user.profileId) {
      toast.error(t('ui.only_employer_accounts_can_post_a'))
      return
    }
    if (form.title.trim() === '') {
      setError(t('ui.title_is_required_even_a_draft'))
      return
    }

    if (!forceDraft) {
      if (missing.length > 0) {
        setDraftPrompt(true)
        return
      }
      if (creditsLeft !== null && creditsLeft < 1) {
        toast.error(t('ui.you_need_at_least_1_credit'))
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
        toast.success(t('ui.saved_as_draft'))
        navigate('/employer/my-jobs')
      } else {
        await spendJobCredit(user.profileId, `Job post: ${input.title}`)
        toast.success(t('ui.job_published_live_for_30_days'))
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
        <h1 className="text-2xl font-medium text-ink">{t('ui.post_a_job')}</h1>

        {!loading && user && user.role !== 'employer' && (
          <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{t('ui.this_account_isn_t_an_employer')}</p>
        )}

        <p className="text-xs text-muted">{t('ui.fields_marked')}{' '}<Req />{' '}{t('ui.are_required_for_a_job_to')}</p>

        {employerId && creditsLeft !== null && (
          <p
            className={`rounded-md px-4 py-3 text-sm ${
              creditsLeft < 1
                ? 'bg-red-50 text-red-600'
                : 'bg-brand-50 text-brand'
            }`}
          >{t('ui.publishing_costs_1_credit_you_have')}<span className="font-semibold">{creditsLeft}</span>{' '}{t(creditsLeft === 1 ? 'ui.credit' : 'ui.credit_plural')}.{' '}
            {creditsLeft < 1 && (
              <Link to="/employer/pricing" className="font-semibold underline">{t('ui.buy_credits')}</Link>
            )}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls}>{t('ui.title')}<Req />
            </label>
            <input
              className={inputCls}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls}>{t('ui.company')}</label>
            <input
              className={`${inputCls} cursor-not-allowed bg-surface-alt text-muted`}
              value={user?.name ?? 'Loading…'}
              disabled
              readOnly
            />
          </div>
          <div>
            <label className={labelCls}>{t('ui.category')}<Req />
            </label>
            <SelectMenu
              value={form.category}
              onChange={(v) => set('category', v)}
              options={categoryOptions}
              placeholder={categories.length === 0 ? t('ui.loading_2') : t('ui.select')}
            />
          </div>
          <div>
            <label className={labelCls}>{t('ui.job_type_2')}<Req />
            </label>
            <SelectMenu
              value={form.job_type}
              onChange={setJobType}
              options={jobTypeOptions}
            />
          </div>
          <div>
            <label className={labelCls}>{t('ui.workplace_type_2')}<Req />
            </label>
            <SelectMenu
              value={form.workplace_type}
              onChange={(v) => set('workplace_type', v)}
              options={workplaceOptions}
            />
          </div>
          <div>
            <label className={labelCls}>{t('ui.location')}<Req />
            </label>
            <SelectMenu
              value={form.location}
              onChange={(v) => set('location', v)}
              options={locationOptions}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelCls}>{t('ui.rate_3')}</label>
            <div className="grid grid-cols-[1fr_1fr_1.2fr] gap-2">
              <input
                className={inputCls}
                inputMode="numeric"
                placeholder={t('ui.min')}
                value={form.salary_min}
                onChange={(e) => set('salary_min', e.target.value)}
              />
              <input
                className={inputCls}
                inputMode="numeric"
                placeholder={t('ui.max')}
                value={form.salary_max}
                onChange={(e) => set('salary_max', e.target.value)}
              />
              <SelectMenu
                value={form.salary_type}
                onChange={(v) => set('salary_type', v)}
                options={ratePeriodOptions}
                placeholder={t('ui.period')}
              />
            </div>
            <p className="mt-1 text-xs text-muted">{t('ui.leave_blank_for_not_posted_shown', { previewLabel })}</p>
          </div>

          <div>
            <label className={labelCls}>{t('ui.hours')}</label>
            <input
              className={inputCls}
              placeholder={HOURS_HINT[form.job_type] ?? t('ui.e_g_30_40_hrs_week')}
              value={form.hours}
              onChange={(e) => set('hours', e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>{t('ui.duration')}</label>
            <input
              className={inputCls}
              placeholder={t('ui.12_months')}
              value={form.duration}
              onChange={(e) => set('duration', e.target.value)}
            />
          </div>

          <div className="flex flex-col justify-end">
            <p className="text-xs text-muted">{t('ui.published_jobs_stay_live_for_days', { JOB_LIVE_DAYS })}</p>
          </div>
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink-600">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => set('featured', e.target.checked)}
              className="size-4 accent-brand"
            />{t('ui.featured')}</label>

          <div className="sm:col-span-2">
            <label className={labelCls}>{t('ui.summary')}</label>
            <textarea
              className={`${inputCls} h-auto py-2`}
              rows={2}
              value={form.summary}
              onChange={(e) => set('summary', e.target.value)}
              placeholder={t('ui.one_or_two_lines_shown_at')}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>{t('ui.description')}<Req />
            </label>
            <RichTextEditor
              value={form.description}
              onChange={(html) => set('description', html)}
              placeholder={t('ui.overview_of_the_role')}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>{t('ui.key_responsibilities')}</label>
            <RichTextEditor
              value={form.responsibilities}
              onChange={(html) => set('responsibilities', html)}
              placeholder={t('ui.what_this_person_will_own_and')}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>{t('ui.required_qualifications_experience')}</label>
            <RichTextEditor
              value={form.requirements}
              onChange={(html) => set('requirements', html)}
              placeholder={t('ui.must_have_skills_experience_education')}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>{t('ui.benefits')}</label>
            <RichTextEditor
              value={form.benefits}
              onChange={(html) => set('benefits', html)}
              placeholder={t('ui.perks_leave_equipment_budget')}
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
            {submitting ? t('ui.saving') : t('ui.save_as_draft')}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-[4px] bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? t('ui.publishing') : t('ui.publish_job')}
            <ArrowRightIcon className="size-4" />
          </button>
          {missing.length > 0 && (
            <span className="text-xs text-muted">{t('ui.missing_for_publish', { v: missing.join(', ') })}</span>
          )}
        </div>
      </form>

      {draftPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-[440px] rounded-xl bg-surface p-6 shadow-2xl">
            <h2 className="text-lg font-medium text-ink">{t('ui.some_required_fields_are_empty')}</h2>
            <p className="mt-2 text-sm text-muted-600">{t('ui.this_job_can_t_be_published')}</p>
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
              >{t('ui.edit_first')}</button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void persist(true)}
                className="rounded-[4px] bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {submitting ? t('ui.saving') : t('ui.save_as_draft')}
              </button>
            </div>
          </div>
        </div>
      )}

      {publishPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-[440px] rounded-xl bg-surface p-6 shadow-2xl">
            <h2 className="text-lg font-medium text-ink">{t('ui.publish_this_job')}</h2>
            <p className="mt-2 text-sm text-muted-600">{t('ui.1_credit_will_be_deducted_and', { JOB_LIVE_DAYS })}{creditsLeft !== null && (
                <>{t('ui.you_ll_have')}<span className="font-medium text-ink">
                    {Math.max(0, creditsLeft - 1)}
                  </span>{t(creditsLeft - 1 === 1 ? 'ui.credit' : 'ui.credit_plural')}{' '}{t('ui.left')}</>
              )}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPublishPrompt(false)}
                className="rounded-[4px] border border-line px-5 py-2.5 text-sm font-semibold text-ink-600 hover:text-ink"
              >{t('ui.cancel')}</button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void persist(false, true)}
                className="rounded-[4px] bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {submitting ? t('ui.publishing') : t('ui.yes_publish_now')}
              </button>
            </div>
          </div>
        </div>
      )}
    </EmployerDashboardLayout>
  )
}
