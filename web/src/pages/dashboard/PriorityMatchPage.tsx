import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { SavedJobRow } from '@/components/dashboard/JobRows'
import { SelectMenu, type Option } from '@/components/app/SelectMenu'
import { StarIcon } from '@/components/icons'
import { errMessage } from '@/lib/errors'
import {
  fetchMembership,
  fetchPriorityJobs,
  membershipEndDate,
  useCandidate,
  type PriorityJobRow,
} from '@/lib/dashboard'
import { updateMyCandidate } from '@/lib/candidateProfile'
import { fetchCategories, type Category } from '@/lib/categories'

export function PriorityMatchPage() {
  const { candidate, loading: candidateLoading, session, reload } = useCandidate()
  const userId = session?.user.id ?? null

  const [isMember, setIsMember] = useState<boolean | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [category, setCategory] = useState('')
  const [subcategory, setSubcategory] = useState('')
  const [jobs, setJobs] = useState<PriorityJobRow[]>([])
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [saving, setSaving] = useState(false)

  // Membership gate.
  useEffect(() => {
    if (!candidate) return
    let alive = true
    fetchMembership(candidate.id)
      .then((m) => {
        if (!alive) return
        const end = membershipEndDate(m)
        setIsMember(!!m && (!end || end.getTime() > Date.now()))
      })
      .catch(() => alive && setIsMember(false))
    return () => {
      alive = false
    }
  }, [candidate])

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch((err) => console.error('categories', err))
  }, [])

  // Seed the pickers from the saved preference.
  useEffect(() => {
    if (!candidate) return
    setCategory(candidate.preferred_category ?? '')
    setSubcategory(candidate.preferred_subcategory ?? '')
  }, [candidate])

  const subOptions: Option[] = useMemo(() => {
    const cat = categories.find((c) => c.name === category)
    return [
      { value: '', label: 'Any subcategory' },
      ...(cat?.subcategories ?? []).map((s) => ({ value: s.name, label: s.name })),
    ]
  }, [categories, category])

  const catOptions: Option[] = useMemo(
    () => [
      { value: '', label: 'Select a category…' },
      ...categories.map((c) => ({ value: c.name, label: c.name })),
    ],
    [categories],
  )

  // Load matches whenever a saved category exists.
  useEffect(() => {
    const savedCat = candidate?.preferred_category
    if (!isMember || !savedCat) {
      setJobs([])
      return
    }
    let alive = true
    setLoadingJobs(true)
    fetchPriorityJobs(savedCat, candidate?.preferred_subcategory ?? null)
      .then((rows) => alive && setJobs(rows))
      .catch((err) => console.error('priority jobs', err))
      .finally(() => alive && setLoadingJobs(false))
    return () => {
      alive = false
    }
  }, [isMember, candidate?.preferred_category, candidate?.preferred_subcategory])

  async function savePrefs() {
    if (!userId || !category) return
    setSaving(true)
    try {
      await updateMyCandidate(userId, {
        preferred_category: category,
        preferred_subcategory: subcategory || null,
      })
      await reload()
      toast.success('Priority Match updated')
    } catch (err) {
      toast.error(errMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-lg font-medium text-ink">Priority Match</h1>
          <p className="mt-1 text-sm text-muted">
            Members get jobs matched to their preferred category and subcategory.
          </p>
        </div>

        {candidateLoading || isMember === null ? (
          <p className="rounded-lg bg-surface-alt px-4 py-12 text-center text-sm text-muted">
            Loading…
          </p>
        ) : !isMember ? (
          <div className="flex flex-col items-start gap-4 rounded-xl border border-brand bg-brand-50/40 p-6">
            <span className="flex items-center gap-2 font-medium text-brand">
              <StarIcon className="size-5" />
              Priority Match is a member feature
            </span>
            <p className="text-sm text-muted-600">
              Subscribe to a membership to set your preferred category and see
              matched jobs first.
            </p>
            <Link
              to="/dashboard/membership"
              className="rounded-[4px] bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600"
            >
              View membership plans
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 rounded-xl border border-line p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-600">
                    Category
                  </label>
                  <SelectMenu
                    value={category}
                    onChange={(v) => {
                      setCategory(v)
                      setSubcategory('')
                    }}
                    options={catOptions}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-600">
                    Subcategory
                  </label>
                  <SelectMenu
                    value={subcategory}
                    onChange={setSubcategory}
                    options={subOptions}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={savePrefs}
                disabled={saving || !category}
                className="w-fit rounded-[4px] bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Priority Match'}
              </button>
            </div>

            {!candidate?.preferred_category ? (
              <p className="rounded-lg bg-surface-alt px-4 py-12 text-center text-sm text-muted">
                Pick a category above to see your matched jobs.
              </p>
            ) : loadingJobs ? (
              <p className="rounded-lg bg-surface-alt px-4 py-12 text-center text-sm text-muted">
                Finding matches…
              </p>
            ) : jobs.length === 0 ? (
              <p className="rounded-lg bg-surface-alt px-4 py-12 text-center text-sm text-muted">
                No active jobs in {candidate.preferred_category} right now. Check
                back soon.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {jobs.map((j) => (
                  <div key={j.id} className="flex flex-col gap-1">
                    {j.matchesSub && (
                      <span className="w-fit rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand">
                        Best match · {candidate.preferred_subcategory}
                      </span>
                    )}
                    <SavedJobRow job={j} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
