import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Card, EmptyState, Notice, Pill, PrimaryButton, SecondaryButton, VerifiedChips } from '@/components/partly/ui'
import { SelectMenu } from '@/components/app/SelectMenu'
import { useCategories } from '@/lib/categories'
import { useCandidate } from '@/lib/dashboard'
import {
  COUNTRY_NAMES,
  PROJECT_TYPES,
  applyToNeed,
  isOutsideExpertise,
  budgetLabel,
  fetchOpenNeeds,
  missingApplyProfile,
  postingCountry,
  projectTypeLabel,
  type OpenNeedRow,
  type ProjectType,
} from '@/lib/partly'
import { useDisplayUser } from '@/lib/useDisplayUser'
import { formatDate } from '@/lib/format'
import { useT } from '@/lib/i18n'
import { categoryLabel } from '@/lib/categoryNames'

const selectCls =
  'h-11 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-brand'

export function BrowseNeedsPage() {
  const t = useT()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { categories } = useCategories()
  const { candidate, session } = useCandidate()
  const { user } = useDisplayUser()
  const [rows, setRows] = useState<OpenNeedRow[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState<string | null>(null)

  // A signed-in expert starts on the categories they serve; 'all' opts out.
  const categoryParam = params.get('category') ?? ''
  const myCategories = candidate?.expertise_field ?? []
  const mineDefault = myCategories.length > 0 && categoryParam === ''
  const categoryId = categoryParam === 'all' ? '' : categoryParam
  const categoryNames = mineDefault ? myCategories : undefined
  const country = params.get('country') ?? ''
  const projectType = (params.get('type') ?? '') as ProjectType | ''
  const minBudget = Number(params.get('budget') ?? '') || 0
  const q = params.get('q') ?? ''
  const categoryName = categories.find((c) => c.id === categoryId)?.name
  const missingProfile = candidate ? missingApplyProfile(candidate) : []

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  useEffect(() => {
    let alive = true
    setLoading(true)
    fetchOpenNeeds({ categoryId, categoryName, categoryNames, country, projectType, minBudget, q }, candidate?.id)
      .then((d) => alive && setRows(d))
      .catch((err) => console.error('open needs', err))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
    // categoryNames is derived from the candidate; its contents are the dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, categoryName, (categoryNames ?? []).join('|'), country, projectType, minBudget, q, candidate?.id])

  async function handleApply(row: OpenNeedRow) {
    if (!session) {
      navigate(`/sign-in?next=${encodeURIComponent('/needs')}`)
      return
    }
    if (user?.role === 'employer' || !candidate) {
      toast.error(t('ui.create_an_expert_profile_to_apply'))
      return
    }
    const missing = missingApplyProfile(candidate)
    if (missing.length > 0) {
      toast.error(t('ui.complete_your_profile_before_applying_add', { v: missing.join(t('ui.and')) }))
      navigate('/dashboard/expert-profile')
      return
    }
    if (isOutsideExpertise(row.category, candidate.expertise_field)) {
      toast.error(t('ui.this_need_is_in_which_isn', { category: categoryLabel(row.category ?? '') }))
      return
    }
    if (!candidate.identity_verified) {
      toast.error(t('ui.verify_your_identity_before_applying_it'))
      navigate('/dashboard/verification')
      return
    }
    setApplying(row.id)
    try {
      await applyToNeed(row.id, candidate.id, session.user.id)
      setRows((r) => r.map((x) => (x.id === row.id ? { ...x, applied: true } : x)))
      toast.success(t('ui.applied_you_ll_be_notified_here'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('ui.could_not_apply'))
    } finally {
      setApplying(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1320px] px-6 py-10 lg:px-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink">{t('ui.open_needs')}</h1>
        <p className="mt-1 text-sm text-muted">{t('ui.real_projects_from_verified_businesses_apply')}</p>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-5">
        <input
          value={q}
          onChange={(e) => setParam('q', e.target.value)}
          placeholder={t('ui.search_titles')}
          className={selectCls}
        />
        <SelectMenu
          value={categoryParam}
          onChange={(v) => setParam('category', v)}
          placeholder={t('ui.all_categories')}
          options={[
            ...(myCategories.length > 0
              ? [
                  { value: '', label: t('ui.my_categories', { v: myCategories.map(categoryLabel).join(', ') }) },
                  { value: 'all', label: t('ui.all_categories') },
                ]
              : []),
            ...categories.map((c) => ({ value: c.id, label: categoryLabel(c.name) })),
          ]}
        />
        <SelectMenu
          value={country}
          onChange={(v) => setParam('country', v)}
          placeholder={t('ui.any_country')}
          options={Object.entries(COUNTRY_NAMES).map(([code, name]) => ({ value: code, label: name }))}
        />
        <SelectMenu
          value={projectType}
          onChange={(v) => setParam('type', v)}
          placeholder={t('ui.any_project_type')}
          options={PROJECT_TYPES.map((p) => ({ value: p.value, label: p.label }))}
        />
        <SelectMenu
          value={minBudget ? String(minBudget) : ''}
          onChange={(v) => setParam('budget', v)}
          placeholder={t('ui.any_budget')}
          options={[1000, 3000, 5000, 10000, 25000].map((n) => ({
            value: String(n),
            label: t('ui.budget_from', { v: n.toLocaleString() }),
          }))}
        />
      </div>

      {!session && (
        <Notice tone="brand">
          <Link to="/create-account" className="font-medium underline">{t('ui.create_your_expert_profile')}</Link>{t('ui.to_apply_businesses_see_up_to')}</Notice>
      )}

      {session && candidate && missingProfile.length > 0 && (
        <Notice tone="warning" title={t('ui.complete_your_profile_to_apply')}>{t('ui.you_can_t_apply_until_you', { v: missingProfile.join(t('ui.and')) })}<Link to="/dashboard/expert-profile" className="font-medium underline">{t('ui.finish_your_profile')}</Link>
        </Notice>
      )}

      <div className="mt-6 flex flex-col gap-4">
        {loading ? (
          <EmptyState>{t('ui.loading_2')}</EmptyState>
        ) : rows.length === 0 ? (
          <EmptyState>{t('ui.no_open_needs_match_these_filters')}</EmptyState>
        ) : (
          rows.map((row) => (
            <Card key={row.id} className="flex flex-col gap-3 md:flex-row md:items-start">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-ink">
                    <Link to={`/job/${row.slug}`} className="hover:text-brand">
                      {row.title}
                    </Link>
                  </h2>
                  <VerifiedChips identity={row.business_basic_verified} badge={row.business_badge_verified} />
                  {row.matching_status === 'matched' && <Pill tone="warning">{t('ui.shortlist_drawn')}</Pill>}
                </div>
                <p className="mt-1 text-sm text-muted">
                  {row.category ? categoryLabel(row.category) : t('ui.uncategorised')} · {postingCountry(row)} · {projectTypeLabel(row.project_type, row.job_type)}
                  {row.project_duration ? ` · ${row.project_duration}` : ''} · {budgetLabel(row)}
                </p>
                {row.description && (
                  <p className="mt-2 line-clamp-3 text-sm text-ink-600">{row.description.replace(/<[^>]+>/g, ' ')}</p>
                )}
                {(row.subcategories.length > 0 || (row.tags?.length ?? 0) > 0) && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {row.subcategories.map((s) => (
                      <Pill key={s.id}>{categoryLabel(s.name)}</Pill>
                    ))}
                    {row.subcategories.length === 0 && row.tags?.map((t) => <Pill key={t}>{t}</Pill>)}
                  </div>
                )}
                <p className="mt-2 text-xs text-muted">{t('ui.posted_expert', { posted_at: formatDate(row.posted_at), people_required: row.people_required, s: row.people_required === 1 ? '' : t('ui.plural_s') })}</p>
              </div>
              <div className="shrink-0">
                {row.applied ? (
                  <SecondaryButton disabled>{t('ui.applied')}</SecondaryButton>
                ) : candidate && isOutsideExpertise(row.category, candidate.expertise_field) ? (
                  <div className="flex flex-col items-start gap-1 md:items-end">
                    <SecondaryButton disabled title={t('ui.you_serve', { v: (candidate.expertise_field ?? []).map(categoryLabel).join(', ') || t('bn.no_cats') })}>{t('ui.not_your_expertise')}</SecondaryButton>
                    <Link to="/dashboard/expert-profile" className="text-xs text-muted underline hover:text-ink">{t('ui.edit_the_categories_you_serve')}</Link>
                  </div>
                ) : (
                  <PrimaryButton
                    onClick={() => handleApply(row)}
                    disabled={applying === row.id || (!!candidate && missingProfile.length > 0)}
                    title={missingProfile.length > 0 ? t('ui.add_your_first', { v: missingProfile.join(t('ui.and')) }) : undefined}
                  >
                    {applying === row.id ? t('ui.applying') : t('ui.apply')}
                  </PrimaryButton>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
