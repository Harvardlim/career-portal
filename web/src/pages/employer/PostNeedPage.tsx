import { useEffect, useMemo, useState, type FormEvent } from 'react'
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
import { useT } from '@/lib/i18n'
import { categoryLabel } from '@/lib/categoryNames'

const BUDGET_CURRENCIES = ['USD', 'SGD', 'MYR', 'IDR', 'THB', 'VND', 'PHP']

export function PostNeedPage() {
  const t = useT()
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

  // Only the functions the business said it's looking to hire for (Business
  // profile → Looking to Hire). An old profile with none ticked sees them all.
  const lookingFor = useMemo(() => employer?.looking_for ?? [], [employer])
  const offered = useMemo(() => {
    const picked = categories.filter((c) => lookingFor.includes(c.name))
    return picked.length > 0 ? picked : categories
  }, [categories, lookingFor])
  const restricted = offered.length < categories.length

  // With a single function there is nothing to choose.
  useEffect(() => {
    if (offered.length === 1 && !categoryId) setCategoryId(offered[0].id)
  }, [offered, categoryId])

  function toggleSub(id: string) {
    setSubIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!employer) return
    if (!employer.basic_verified) {
      toast.error(t('ui.add_your_business_registration_number_before'))
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
      toast.success(t('ui.your_need_is_live_experts_can'))
      navigate(`/employer/postings/${id}/matches`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('ui.could_not_post_your_need'))
    } finally {
      setSubmitting(false)
    }
  }

  const badgeLive = !!employer?.verified_badge_until && new Date(employer.verified_badge_until) > new Date()

  return (
    <EmployerDashboardLayout>
      <form onSubmit={handleSubmit} className="flex max-w-3xl flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">{t('ui.post_your_need')}</h1>
          <p className="mt-1 text-sm text-muted">{t('ui.posting_is_free_describe_what_you')}</p>
        </div>

        {!loading && employer && !employer.basic_verified && (
          <Notice tone="warning" title={t('ui.add_your_registration_number')}>{t('ui.a_business_registration_number_is_what')}<Link to="/employer/verification" className="font-medium underline">{t('ui.add_it_now')}</Link>
            .
          </Notice>
        )}
        {!loading && employer && !badgeLive && (
          <FullyVerifiedBubble
            audience="business"
            action={
              <Link to="/employer/verification" className="font-semibold underline">{t('ui.get_fully_verified')}</Link>
            }
          />
        )}

        <Card className="flex flex-col gap-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t('ui.1_the_brief_all_fields_required')}</h2>
          <Field label={t('ui.what_do_you_need_title')}>
            <TextInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('ui.e_g_fractional_cfo_for_a')}
              required
            />
          </Field>
          <Field label={t('ui.project_brief')}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              required
              placeholder={t('ui.the_problem_the_outcome_you_want')}
              className="w-full rounded-md border border-line bg-surface p-4 text-base text-ink outline-none focus:border-brand placeholder:text-muted-400"
            />
          </Field>
        </Card>

        <Card className="flex flex-col gap-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t('ui.2_category')}</h2>
          <p className="text-sm text-muted">{t('ui.one_main_category_and_at_least')}{restricted && (
              <>{t('ui.showing_what_you_re_looking_to')}<Link to="/company/register" className="font-medium underline">{t('ui.change_in_your_business_profile')}</Link>
                .
              </>
            )}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {offered.map((c) => (
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
                {categoryLabel(c.name)}
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
                  {categoryLabel(s.name)}
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card className="flex flex-col gap-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t('ui.3_scope')}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('ui.country_where_the_work_sits')}>
              <SelectMenu
                value={country}
                onChange={setCountry}
                options={Object.entries(COUNTRY_NAMES).map(([code, name]) => ({ value: code, label: name }))}
              />
            </Field>
            <Field label={t('ui.people_required')}>
              <TextInput required type="number" min={1} value={people} onChange={(e) => setPeople(e.target.value)} />
            </Field>
          </div>
          <div>
            <p className="mb-2 text-sm text-ink">{t('ui.project_type')}</p>
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
          <Field label={t('ui.duration_timeline')}>
            <TextInput
              required
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder={t('ui.e_g_3_months_2_days')}
            />
          </Field>
          <Field label={t('ui.skills_requirements_comma_separated')}>
            <TextInput
              required
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder={t('ui.e_g_finance_fp_a_investor')}
            />
          </Field>
        </Card>

        <Card className="flex flex-col gap-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t('ui.4_budget')}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t('ui.currency')}>
              <SelectMenu
                value={budgetCurrency}
                onChange={setBudgetCurrency}
                options={BUDGET_CURRENCIES.map((c) => ({ value: c, label: c }))}
              />
            </Field>
            <Field label={t('ui.from')}>
              <TextInput required type="number" min={1} value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
            </Field>
            <Field label={t('ui.to')}>
              <TextInput required type="number" min={1} value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
            </Field>
          </div>
        </Card>

        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-muted">{t('ui.you_ll_see_up_to_10')}</p>
          <PrimaryButton type="submit" disabled={submitting || loading}>
            {submitting ? t('ui.posting') : t('ui.post_it_s_free')}
          </PrimaryButton>
        </div>
      </form>
    </EmployerDashboardLayout>
  )
}
