import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { EmployerDashboardLayout } from '@/components/dashboard/EmployerDashboardLayout'
import { Field, TextInput } from '@/components/dashboard/form'
import { SelectMenu } from '@/components/app/SelectMenu'
import { Link } from 'react-router-dom'
import { Card, FullyVerifiedBubble, Notice, PrimaryButton } from '@/components/partly/ui'
import { useCategories } from '@/lib/categories'
import { useEmployer } from '@/lib/employers'
import {
  COUNTRY_NAMES,
  PROJECT_TYPES,
  createPosting,
  validatePostingInput,
  type PostingInput,
  type ProjectType,
} from '@/lib/partly'

const BUDGET_CURRENCIES = ['USD', 'SGD', 'MYR', 'IDR', 'THB', 'VND', 'PHP']

export function PostNeedPage() {
  const navigate = useNavigate()
  const { employer, loading } = useEmployer()
  const { categories } = useCategories()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [country, setCountry] = useState('SG')
  const [projectType, setProjectType] = useState<ProjectType>('project')
  const [duration, setDuration] = useState('')
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [budgetCurrency, setBudgetCurrency] = useState('USD')
  const [people, setPeople] = useState('1')
  const [skills, setSkills] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [subIds, setSubIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const category = useMemo(() => categories.find((c) => c.id === categoryId), [categories, categoryId])

  function toggleSub(id: string) {
    setSubIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!employer) return
    if (!employer.basic_verified) {
      toast.error('Add your business registration number before you can post.')
      return
    }

    // Every detail is required: experts apply on what they read here, so a
    // half-empty brief wastes everyone's matches.
    const input: PostingInput = {
      title: title.trim(),
      description: description.trim(),
      country,
      project_type: projectType,
      project_duration: duration.trim() || null,
      budget_min: budgetMin ? Number(budgetMin) : null,
      budget_max: budgetMax ? Number(budgetMax) : null,
      budget_currency: budgetCurrency,
      people_required: Number(people),
      skill_requirements: skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      main_category_id: categoryId,
      subcategory_ids: subIds,
    }
    const problem = validatePostingInput(input, {
      requireSubcategory: (category?.subcategories.length ?? 0) > 0,
    })
    if (problem) {
      toast.error(problem)
      return
    }

    setSubmitting(true)
    try {
      const id = await createPosting(employer.id, employer.company_name, input)
      toast.success('Your need is live. Experts can now apply.')
      navigate(`/employer/postings/${id}/matches`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not post your need')
    } finally {
      setSubmitting(false)
    }
  }

  const badgeLive = !!employer?.verified_badge_until && new Date(employer.verified_badge_until) > new Date()

  return (
    <EmployerDashboardLayout>
      <form onSubmit={handleSubmit} className="flex max-w-3xl flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">Post your need</h1>
          <p className="mt-1 text-sm text-muted">
            Posting is free. Describe what you need and we'll match you with up to 10 verified
            experts — you only ever choose who to contact.
          </p>
        </div>

        {!loading && employer && !employer.basic_verified && (
          <Notice tone="warning" title="Add your registration number">
            A business registration number is what makes you Basic verified — and lets you post.{' '}
            <Link to="/employer/verification" className="font-medium underline">
              Add it now
            </Link>
            .
          </Notice>
        )}
        {!loading && employer && !badgeLive && (
          <FullyVerifiedBubble
            audience="business"
            action={
              <Link to="/employer/verification" className="font-semibold underline">
                Get Fully verified
              </Link>
            }
          />
        )}

        <Card className="flex flex-col gap-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">1 · The brief (all fields required)</h2>
          <Field label="What do you need? (title)">
            <TextInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fractional CFO for a Series A fundraise"
              required
            />
          </Field>
          <Field label="Project brief">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              required
              placeholder="The problem, the outcome you want, and anything an expert should know before applying."
              className="w-full rounded-md border border-line bg-surface p-4 text-base text-ink outline-none focus:border-brand placeholder:text-muted-400"
            />
          </Field>
        </Card>

        <Card className="flex flex-col gap-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">2 · Category</h2>
          <p className="text-sm text-muted">One main category and at least one sub-category.</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {categories.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => {
                  setCategoryId(c.id)
                  setSubIds([])
                }}
                className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                  categoryId === c.id
                    ? 'border-brand bg-brand-50 font-medium text-brand'
                    : 'border-line text-ink-600 hover:bg-surface-alt'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
          {category && category.subcategories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {category.subcategories.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => toggleSub(s.id)}
                  title={s.notes ?? undefined}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    subIds.includes(s.id)
                      ? 'border-brand bg-brand text-white'
                      : 'border-line text-ink-600 hover:bg-surface-alt'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card className="flex flex-col gap-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">3 · Scope</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Country where the work sits">
              <SelectMenu
                value={country}
                onChange={setCountry}
                options={Object.entries(COUNTRY_NAMES).map(([code, name]) => ({ value: code, label: name }))}
              />
            </Field>
            <Field label="People required">
              <TextInput required type="number" min={1} value={people} onChange={(e) => setPeople(e.target.value)} />
            </Field>
          </div>
          <div>
            <p className="mb-2 text-sm text-ink">Project type</p>
            <div className="grid gap-2 sm:grid-cols-5">
              {PROJECT_TYPES.map((p) => (
                <button
                  type="button"
                  key={p.value}
                  onClick={() => setProjectType(p.value)}
                  className={`rounded-md border px-3 py-2 text-left transition-colors ${
                    projectType === p.value
                      ? 'border-brand bg-brand-50'
                      : 'border-line hover:bg-surface-alt'
                  }`}
                >
                  <span className="block text-sm font-medium text-ink">{p.label}</span>
                  <span className="block text-xs text-muted">{p.hint}</span>
                </button>
              ))}
            </div>
          </div>
          <Field label="Duration / timeline">
            <TextInput
              required
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 3 months, 2 days a week from October"
            />
          </Field>
          <Field label="Skills / requirements (comma separated)">
            <TextInput
              required
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. Finance, FP&A, Investor relations"
            />
          </Field>
        </Card>

        <Card className="flex flex-col gap-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">4 · Budget</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Currency">
              <SelectMenu
                value={budgetCurrency}
                onChange={setBudgetCurrency}
                options={BUDGET_CURRENCIES.map((c) => ({ value: c, label: c }))}
              />
            </Field>
            <Field label="From">
              <TextInput required type="number" min={1} value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
            </Field>
            <Field label="To">
              <TextInput required type="number" min={1} value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
            </Field>
          </div>
        </Card>

        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-muted">
            You'll see up to 10 matched experts for this posting — a fixed shortlist, not a rolling list.
          </p>
          <PrimaryButton type="submit" disabled={submitting || loading}>
            {submitting ? 'Posting…' : 'Post — it’s free'}
          </PrimaryButton>
        </div>
      </form>
    </EmployerDashboardLayout>
  )
}
