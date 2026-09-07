import { useEffect, useState, type FormEvent } from 'react'
import { controlClass } from './ui'
import { SelectMenu, type Option } from './SelectMenu'
import { RichTextEditor } from './RichTextEditor'
import { ConfirmDialog } from './ConfirmDialog'
import { isPlaceholderSlug, slugify, updateJob, type JobPatch, type JobRow } from '../lib/jobs'
import { fetchCategories } from '../lib/categories'
import { fetchEmployers } from '../lib/registrations'
import { errMessage } from '../lib/errors'

const STATUS_OPTIONS: Option[] = [
  { value: 'active', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'expired', label: 'Expired' },
]

// Extend these lists to add more options.
const JOB_TYPES = ['Monthly', 'Weekly', 'Hours', 'Project Basis']
const WORKPLACE_TYPES = ['On-site', 'Hybrid', 'Remote']
const RATE_PERIODS = ['Hourly', 'Weekly', 'Monthly', 'Yearly', 'Project']
const LOCATIONS = ['Malaysia', 'Singapore']

// Picking a job type auto-selects the matching rate period.
const RATE_PERIOD_FOR_JOB_TYPE: Record<string, string> = {
  Hours: 'Hourly',
  Weekly: 'Weekly',
  Monthly: 'Monthly',
  'Project Basis': 'Project',
}

// The "Hours" field reads differently per job type.
const HOURS_HINT: Record<string, string> = {
  Hours: '30-40 hrs/week',
  Weekly: '3 days/week',
  Monthly: 'Full-time, 40 hrs/week',
  'Project Basis': 'On shoot',
}

const textField = controlClass
const labelCls = 'mb-1 block text-[12px] font-medium text-ink-200'
const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : '')
const clean = (v: string) => (v.trim() === '' ? null : v.trim())

const Req = () => <span className="text-danger"> *</span>

/** Fields a job needs before it can go live. Missing any → the job stays a draft. */
const REQUIRED_FIELDS: { label: string; filled: (f: JobPatch) => boolean }[] = [
  { label: 'Title', filled: (f) => !!f.title?.trim() },
  { label: 'Company', filled: (f) => !!f.company_name?.trim() },
  { label: 'Category', filled: (f) => !!f.category?.trim() },
  { label: 'Job type', filled: (f) => !!f.job_type?.trim() },
  { label: 'Workplace type', filled: (f) => !!f.workplace_type?.trim() },
  { label: 'Location', filled: (f) => !!f.location?.trim() },
  { label: 'Description', filled: (f) => !!f.description?.trim() },
]

/** "$50-$85/hourly" style label, kept in sync so the public page's fallbacks work. */
function buildSalaryLabel(min: number | null, max: number | null, type: string | null): string | null {
  if (min == null && max == null) return null
  const per = type ? `/${type.toLowerCase()}` : ''
  if (min != null && max != null) return `$${min.toLocaleString()}-$${max.toLocaleString()}${per}`
  return `$${(min ?? max)!.toLocaleString()}${per}`
}

type Props = {
  job: JobRow
  onSaved: () => void
  onCancel: () => void
}

export const JobEditForm = ({ job, onSaved, onCancel }: Props) => {
  const isNew = isPlaceholderSlug(job.slug)
  const [form, setForm] = useState<JobPatch>({
    title: job.title,
    employer_id: job.employer_id,
    company_name: job.company_name,
    category: job.category,
    job_type: job.job_type,
    workplace_type: job.workplace_type,
    location: job.location,
    salary_min: job.salary_min,
    salary_max: job.salary_max,
    salary_type: job.salary_type,
    salary_label: job.salary_label,
    hours: job.hours,
    duration: job.duration,
    // Applications are always handled on-platform.
    apply_method: 'on_platform',
    apply_url: null,
    apply_email: null,
    // A brand-new job defaults to Published; the save gate drops it to Draft
    // if required fields are missing.
    status: isNew ? 'active' : job.status,
    featured: job.featured,
    description: job.description,
    responsibilities: job.responsibilities,
    requirements: job.requirements,
    expires_at: job.expires_at,
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draftPrompt, setDraftPrompt] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [employers, setEmployers] = useState<{ id: string; company_name: string }[]>([])

  useEffect(() => {
    let alive = true
    fetchCategories()
      .then((rows) => alive && setCategories(rows.map((c) => c.name)))
      .catch((e) => console.error('categories', e))
    fetchEmployers()
      .then((rows) =>
        alive && setEmployers(rows.map((e) => ({ id: e.id, company_name: e.company_name }))),
      )
      .catch((e) => console.error('employers', e))
    return () => {
      alive = false
    }
  }, [])

  const set = <K extends keyof JobPatch>(key: K, value: JobPatch[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const setJobType = (v: string) =>
    setForm((f) => ({
      ...f,
      job_type: v,
      salary_type: RATE_PERIOD_FOR_JOB_TYPE[v] ?? f.salary_type,
      // Project-basis roles are "On shoot" rather than an hours figure.
      hours: v === 'Project Basis' && !f.hours ? 'On shoot' : f.hours,
    }))

  const setNum = (key: 'salary_min' | 'salary_max', raw: string) =>
    set(key, raw.trim() === '' ? null : Number(raw))

  const setCompany = (name: string) =>
    setForm((f) => ({
      ...f,
      company_name: name || null,
      employer_id: employers.find((e) => e.company_name === name)?.id ?? null,
    }))

  // Keep an unknown existing value (e.g. from older rows) selectable so it
  // isn't silently dropped on save.
  const withCurrent = (base: string[], current: string | null): Option[] => [
    { value: '', label: 'Select…' },
    ...base.map((v) => ({ value: v, label: v })),
    ...(current && !base.includes(current) ? [{ value: current, label: current }] : []),
  ]
  const companyOptions = withCurrent(
    employers.map((e) => e.company_name),
    form.company_name,
  )
  const locationOptions = withCurrent(LOCATIONS, form.location)
  const categoryOptions = withCurrent(categories, form.category)
  const jobTypeOptions = withCurrent(JOB_TYPES, form.job_type)
  const workplaceOptions = withCurrent(WORKPLACE_TYPES, form.workplace_type)
  const ratePeriodOptions = withCurrent(RATE_PERIODS, form.salary_type)

  const missing = REQUIRED_FIELDS.filter((r) => !r.filled(form)).map((r) => r.label)

  /** Writes the job. `forceDraft` pins status to 'draft' (used when required
   *  fields are still empty). */
  async function persist(forceDraft: boolean) {
    setBusy(true)
    setError(null)

    const title = form.title.trim()
    const patch: JobPatch = {
      ...form,
      title,
      status: forceDraft ? 'draft' : form.status,
      company_name: form.company_name ? clean(form.company_name) : null,
      category: form.category ? clean(form.category) : null,
      job_type: form.job_type || null,
      workplace_type: form.workplace_type || null,
      location: form.location ? clean(form.location) : null,
      salary_type: form.salary_type || null,
      salary_label: buildSalaryLabel(form.salary_min, form.salary_max, form.salary_type),
      hours: form.hours ? clean(form.hours) : null,
      duration: form.duration ? clean(form.duration) : null,
      apply_method: 'on_platform',
      apply_url: null,
      apply_email: null,
      description: form.description || null,
      responsibilities: form.responsibilities || null,
      requirements: form.requirements || null,
    }

    // Give a freshly-added job a readable slug from its title, once it has one.
    const baseSlug = title && isPlaceholderSlug(job.slug) ? slugify(title) : undefined

    try {
      if (baseSlug) {
        try {
          await updateJob(job.id, { ...patch, slug: baseSlug })
        } catch (err) {
          const msg = errMessage(err)
          if (/duplicate key|already exists|unique/i.test(msg)) {
            await updateJob(job.id, {
              ...patch,
              slug: `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`,
            })
          } else {
            throw err
          }
        }
      } else {
        await updateJob(job.id, patch)
      }
      setDraftPrompt(false)
      onSaved()
    } catch (err) {
      setError(errMessage(err))
    } finally {
      setBusy(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (missing.length > 0) {
      setDraftPrompt(true)
      return
    }
    void persist(false)
  }

  return (
    <>
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-line bg-surface p-6 shadow-card"
    >
      <p className="mb-4 text-[12px] text-muted">
        Fields marked <Req /> are required for a job to go live.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelCls}>Title<Req /></label>
          <input className={textField} value={form.title} onChange={(e) => set('title', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Company<Req /></label>
          <SelectMenu
            value={form.company_name ?? ''}
            onChange={setCompany}
            options={companyOptions}
            placeholder={employers.length === 0 ? 'Loading…' : 'Select…'}
          />
        </div>
        <div>
          <label className={labelCls}>Category<Req /></label>
          <SelectMenu
            value={form.category ?? ''}
            onChange={(v) => set('category', v)}
            options={categoryOptions}
            placeholder={categories.length === 0 ? 'Loading…' : 'Select…'}
          />
        </div>
        <div>
          <label className={labelCls}>Job type<Req /></label>
          <SelectMenu
            value={form.job_type ?? ''}
            onChange={setJobType}
            options={jobTypeOptions}
          />
        </div>
        <div>
          <label className={labelCls}>Workplace type<Req /></label>
          <SelectMenu
            value={form.workplace_type ?? ''}
            onChange={(v) => set('workplace_type', v)}
            options={workplaceOptions}
          />
        </div>
        <div>
          <label className={labelCls}>Location<Req /></label>
          <SelectMenu
            value={form.location ?? ''}
            onChange={(v) => set('location', v)}
            options={locationOptions}
          />
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <SelectMenu value={form.status} onChange={(v) => set('status', v)} options={STATUS_OPTIONS} />
        </div>

        <div className="sm:col-span-2">
          <label className={labelCls}>Rate</label>
          <div className="grid grid-cols-[1fr_1fr_1.2fr] gap-2">
            <input
              className={textField}
              inputMode="numeric"
              placeholder="Min"
              value={form.salary_min ?? ''}
              onChange={(e) => setNum('salary_min', e.target.value)}
            />
            <input
              className={textField}
              inputMode="numeric"
              placeholder="Max"
              value={form.salary_max ?? ''}
              onChange={(e) => setNum('salary_max', e.target.value)}
            />
            <SelectMenu
              value={form.salary_type ?? ''}
              onChange={(v) => set('salary_type', v)}
              options={ratePeriodOptions}
              placeholder="Period"
            />
          </div>
          <p className="mt-1 text-[11px] text-muted">
            Leave blank for “Not posted”. Shown as{' '}
            {buildSalaryLabel(form.salary_min, form.salary_max, form.salary_type) ?? '—'}
          </p>
        </div>

        <div>
          <label className={labelCls}>Hours</label>
          <input
            className={textField}
            placeholder={HOURS_HINT[form.job_type ?? ''] ?? 'e.g. 30-40 hrs/week'}
            value={form.hours ?? ''}
            onChange={(e) => set('hours', e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>Duration</label>
          <input
            className={textField}
            placeholder="12 months"
            value={form.duration ?? ''}
            onChange={(e) => set('duration', e.target.value)}
          />
        </div>

        <div>
          <label className={labelCls}>Expiry date</label>
          <input
            type="date"
            className={`${textField} cursor-pointer`}
            value={toDateInput(form.expires_at)}
            onClick={(e) => e.currentTarget.showPicker?.()}
            onFocus={(e) => e.currentTarget.showPicker?.()}
            onChange={(e) =>
              set('expires_at', e.target.value ? new Date(e.target.value).toISOString() : null)
            }
          />
        </div>
        <label className="flex items-center gap-2 self-end pb-2 text-[13px] text-ink-200">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => set('featured', e.target.checked)}
            className="size-4 accent-brand"
          />
          Featured
        </label>

        <div className="sm:col-span-2">
          <label className={labelCls}>Description<Req /></label>
          <RichTextEditor
            value={form.description ?? ''}
            onChange={(html) => set('description', html)}
            placeholder="Overview of the role…"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Key Responsibilities</label>
          <RichTextEditor
            value={form.responsibilities ?? ''}
            onChange={(html) => set('responsibilities', html)}
            placeholder="What this person will own and do…"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Required Qualifications &amp; Experience</label>
          <RichTextEditor
            value={form.requirements ?? ''}
            onChange={(html) => set('requirements', html)}
            placeholder="Must-have skills, experience, education…"
          />
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg bg-danger/12 px-3 py-2 text-[13px] text-danger">{error}</p>
      ) : null}

      <div className="mt-5 flex justify-end gap-2.5 border-t border-line pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="rounded-lg border border-line px-4 py-2 text-[13px] font-semibold text-ink-200 transition hover:text-ink disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="gradient-brand rounded-lg px-4 py-2 text-[13px] font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {busy
            ? isNew
              ? 'Publishing…'
              : 'Saving…'
            : isNew
              ? 'Publish Now'
              : 'Save Changes'}
        </button>
      </div>
    </form>

    <ConfirmDialog
      open={draftPrompt}
      tone="default"
      title="Some required fields are empty"
      message={
        <>
          This job can't go live yet. It will be saved as a <strong>Draft</strong> until you
          fill in:
          <ul className="mt-2 list-disc pl-5">
            {missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </>
      }
      confirmLabel="Save as Draft"
      cancelLabel="Continue editing"
      busy={busy}
      error={error}
      onConfirm={() => void persist(true)}
      onCancel={() => setDraftPrompt(false)}
    />
    </>
  )
}
