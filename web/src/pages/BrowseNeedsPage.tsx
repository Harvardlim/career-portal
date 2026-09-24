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
  budgetLabel,
  fetchOpenNeeds,
  missingApplyProfile,
  postingCountry,
  projectTypeLabel,
  type OpenNeedRow,
  type ProjectType,
} from '@/lib/partly'
import { useDisplayUser } from '@/lib/useDisplayUser'

const selectCls =
  'h-11 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-brand'

export function BrowseNeedsPage() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { categories } = useCategories()
  const { candidate, session } = useCandidate()
  const { user } = useDisplayUser()
  const [rows, setRows] = useState<OpenNeedRow[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState<string | null>(null)

  const categoryId = params.get('category') ?? ''
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
    fetchOpenNeeds({ categoryId, categoryName, country, projectType, minBudget, q }, candidate?.id)
      .then((d) => alive && setRows(d))
      .catch((err) => console.error('open needs', err))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [categoryId, categoryName, country, projectType, minBudget, q, candidate?.id])

  async function handleApply(row: OpenNeedRow) {
    if (!session) {
      navigate(`/sign-in?next=${encodeURIComponent('/needs')}`)
      return
    }
    if (user?.role === 'employer' || !candidate) {
      toast.error('Create an expert profile to apply to open needs.')
      return
    }
    const missing = missingApplyProfile(candidate)
    if (missing.length > 0) {
      toast.error(`Complete your profile before applying: add your ${missing.join(' and ')}.`)
      navigate('/dashboard/expert-profile')
      return
    }
    if (!candidate.identity_verified) {
      toast.error('Verify your identity before applying — it takes a minute.')
      navigate('/dashboard/verification')
      return
    }
    setApplying(row.id)
    try {
      await applyToNeed(row.id, candidate.id, session.user.id)
      setRows((r) => r.map((x) => (x.id === row.id ? { ...x, applied: true } : x)))
      toast.success('Applied. You’ll be notified here if the business releases contact.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not apply')
    } finally {
      setApplying(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1320px] px-6 py-10 lg:px-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink">Open needs</h1>
        <p className="mt-1 text-sm text-muted">
          Real projects from verified businesses. Apply to the ones that fit — matching is private, and you only pay
          if a business releases contact and you choose to unlock it.
        </p>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-5">
        <input
          value={q}
          onChange={(e) => setParam('q', e.target.value)}
          placeholder="Search titles…"
          className={selectCls}
        />
        <SelectMenu
          value={categoryId}
          onChange={(v) => setParam('category', v)}
          placeholder="All categories"
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
        />
        <SelectMenu
          value={country}
          onChange={(v) => setParam('country', v)}
          placeholder="Any country"
          options={Object.entries(COUNTRY_NAMES).map(([code, name]) => ({ value: code, label: name }))}
        />
        <SelectMenu
          value={projectType}
          onChange={(v) => setParam('type', v)}
          placeholder="Any project type"
          options={PROJECT_TYPES.map((p) => ({ value: p.value, label: p.label }))}
        />
        <SelectMenu
          value={minBudget ? String(minBudget) : ''}
          onChange={(v) => setParam('budget', v)}
          placeholder="Any budget"
          options={[1000, 3000, 5000, 10000, 25000].map((n) => ({
            value: String(n),
            label: `Budget from ${n.toLocaleString()}`,
          }))}
        />
      </div>

      {!session && (
        <Notice tone="brand">
          <Link to="/create-account" className="font-medium underline">
            Create your expert profile
          </Link>{' '}
          to apply. Businesses see up to 10 matched experts per need and choose who to contact.
        </Notice>
      )}

      {session && candidate && missingProfile.length > 0 && (
        <Notice tone="warning" title="Complete your profile to apply">
          You can&apos;t apply until you&apos;ve added your {missingProfile.join(' and ')}.{' '}
          <Link to="/dashboard/expert-profile" className="font-medium underline">
            Finish your profile
          </Link>
        </Notice>
      )}

      <div className="mt-6 flex flex-col gap-4">
        {loading ? (
          <EmptyState>Loading…</EmptyState>
        ) : rows.length === 0 ? (
          <EmptyState>No open needs match these filters yet.</EmptyState>
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
                  {row.matching_status === 'matched' && <Pill tone="warning">Shortlist drawn</Pill>}
                </div>
                <p className="mt-1 text-sm text-muted">
                  {row.category ?? 'Uncategorised'} · {postingCountry(row)} · {projectTypeLabel(row.project_type, row.job_type)}
                  {row.project_duration ? ` · ${row.project_duration}` : ''} · {budgetLabel(row)}
                </p>
                {row.description && (
                  <p className="mt-2 line-clamp-3 text-sm text-ink-600">{row.description.replace(/<[^>]+>/g, ' ')}</p>
                )}
                {(row.subcategories.length > 0 || (row.tags?.length ?? 0) > 0) && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {row.subcategories.map((s) => (
                      <Pill key={s.id}>{s.name}</Pill>
                    ))}
                    {row.subcategories.length === 0 && row.tags?.map((t) => <Pill key={t}>{t}</Pill>)}
                  </div>
                )}
                <p className="mt-2 text-xs text-muted">
                  Posted {new Date(row.posted_at).toLocaleDateString()} · {row.people_required} expert
                  {row.people_required === 1 ? '' : 's'} needed
                </p>
              </div>
              <div className="shrink-0">
                {row.applied ? (
                  <SecondaryButton disabled>Applied</SecondaryButton>
                ) : (
                  <PrimaryButton
                    onClick={() => handleApply(row)}
                    disabled={applying === row.id || (!!candidate && missingProfile.length > 0)}
                    title={missingProfile.length > 0 ? `Add your ${missingProfile.join(' and ')} first` : undefined}
                  >
                    {applying === row.id ? 'Applying…' : 'Apply'}
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
