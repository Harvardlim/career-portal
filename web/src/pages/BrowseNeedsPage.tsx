import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Card, EmptyState, Notice, Pill, PrimaryButton, SecondaryButton } from '@/components/partly/ui'
import { useCategories } from '@/lib/categories'
import { useCandidate } from '@/lib/dashboard'
import {
  COUNTRY_NAMES,
  PROJECT_TYPES,
  applyToNeed,
  budgetLabel,
  countryName,
  fetchOpenNeeds,
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
  const q = params.get('q') ?? ''

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  useEffect(() => {
    let alive = true
    setLoading(true)
    fetchOpenNeeds({ categoryId, country, projectType, q }, candidate?.id)
      .then((d) => alive && setRows(d))
      .catch((err) => console.error('open needs', err))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [categoryId, country, projectType, q, candidate?.id])

  async function handleApply(row: OpenNeedRow) {
    if (!session) {
      navigate(`/sign-in?next=${encodeURIComponent('/needs')}`)
      return
    }
    if (user?.role === 'employer' || !candidate) {
      toast.error('Create an expert profile to apply to open needs.')
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

      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <input
          value={q}
          onChange={(e) => setParam('q', e.target.value)}
          placeholder="Search titles…"
          className={selectCls}
        />
        <select value={categoryId} onChange={(e) => setParam('category', e.target.value)} className={selectCls}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={country} onChange={(e) => setParam('country', e.target.value)} className={selectCls}>
          <option value="">Any country</option>
          {Object.entries(COUNTRY_NAMES).map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
        <select value={projectType} onChange={(e) => setParam('type', e.target.value)} className={selectCls}>
          <option value="">Any project type</option>
          {PROJECT_TYPES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {!session && (
        <Notice tone="brand">
          <Link to="/create-account" className="font-medium underline">
            Create your expert profile
          </Link>{' '}
          to apply. Businesses see up to 10 matched experts per need and choose who to contact.
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
                  <h2 className="font-semibold text-ink">{row.title}</h2>
                  {row.matching_status === 'matched' && <Pill tone="warning">Shortlist drawn</Pill>}
                </div>
                <p className="mt-1 text-sm text-muted">
                  {row.category ?? 'Uncategorised'} · {countryName(row.country)} · {projectTypeLabel(row.project_type)}
                  {row.project_duration ? ` · ${row.project_duration}` : ''} · {budgetLabel(row)}
                </p>
                {row.description && <p className="mt-2 line-clamp-3 text-sm text-ink-600">{row.description}</p>}
                {row.subcategories.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {row.subcategories.map((s) => (
                      <Pill key={s.id}>{s.name}</Pill>
                    ))}
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
                  <PrimaryButton onClick={() => handleApply(row)} disabled={applying === row.id}>
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
