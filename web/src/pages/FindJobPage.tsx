import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '@/layouts/AppShell'
import { Breadcrumb } from '@/components/app/Breadcrumb'
import { Pagination } from '@/components/app/Pagination'
import { Dropdown } from '@/components/app/Dropdown'
import { SelectMenu, type Option } from '@/components/app/SelectMenu'
import { JobCard } from '@/components/jobs/JobCard'
import {
  ChevronDownIcon,
  LayersIcon,
  MapPinIcon,
  SearchIcon,
  XCircleIcon,
} from '@/components/icons'
import { errMessage } from '@/lib/errors'
import { useCategoryNames } from '@/lib/categories'
import { fetchJobs, toCardJob, type JobRow } from '@/lib/jobs'

const PAGE_SIZE = 12

// Match the values the (backoffice / employer) job editor writes.
const JOB_TYPES = ['Monthly', 'Weekly', 'Hours', 'Project Basis']
const WORKPLACE_TYPES = ['On-site', 'Hybrid', 'Remote']
const RATE_PERIODS = ['Hourly', 'Weekly', 'Monthly', 'Yearly', 'Project']

const withAny = (label: string, values: string[]): Option[] => [
  { value: '', label },
  ...values.map((v) => ({ value: v, label: v })),
]

type Filters = {
  keyword: string
  location: string
  category: string
  jobType: string
  workplaceType: string
  ratePeriod: string
}

const emptyFilters: Filters = {
  keyword: '',
  location: '',
  category: '',
  jobType: '',
  workplaceType: '',
  ratePeriod: '',
}

function matches(job: JobRow, f: Filters): boolean {
  if (f.keyword) {
    const k = f.keyword.toLowerCase()
    const hay = [job.title, job.company_name, job.role, ...(job.tags ?? [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    if (!hay.includes(k)) return false
  }
  if (
    f.location &&
    !(job.location ?? '').toLowerCase().includes(f.location.toLowerCase())
  ) {
    return false
  }
  if (f.category && job.category !== f.category) return false
  if (f.jobType && job.job_type !== f.jobType) return false
  if (f.workplaceType && job.workplace_type !== f.workplaceType) return false
  if (f.ratePeriod && job.salary_type !== f.ratePeriod) return false
  return true
}

export function FindJobPage({ filterOpen = false }: { filterOpen?: boolean }) {
  const categories = useCategoryNames()
  const [allJobs, setAllJobs] = useState<JobRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [sort, setSort] = useState<'latest' | 'oldest'>('latest')
  const [advOpen, setAdvOpen] = useState(filterOpen)
  const [page, setPage] = useState(1)

  useEffect(() => {
    let alive = true
    fetchJobs()
      .then((rows) => alive && setAllJobs(rows))
      .catch((err) => alive && setError(errMessage(err)))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => setPage(1), [filters, sort])

  const setField = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }))

  const filtered = useMemo(() => {
    const list = allJobs.filter((j) => matches(j, filters))
    list.sort((a, b) =>
      sort === 'latest'
        ? b.posted_at.localeCompare(a.posted_at)
        : a.posted_at.localeCompare(b.posted_at),
    )
    return list
  }, [allJobs, filters, sort])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const chips: { label: string; clear: () => void }[] = [
    filters.keyword && { label: filters.keyword, clear: () => setField('keyword', '') },
    filters.location && { label: filters.location, clear: () => setField('location', '') },
    filters.category && { label: filters.category, clear: () => setField('category', '') },
    filters.jobType && { label: filters.jobType, clear: () => setField('jobType', '') },
    filters.workplaceType && {
      label: filters.workplaceType,
      clear: () => setField('workplaceType', ''),
    },
    filters.ratePeriod && {
      label: `Rate: ${filters.ratePeriod}`,
      clear: () => setField('ratePeriod', ''),
    },
  ].filter(Boolean) as { label: string; clear: () => void }[]

  return (
    <AppShell>
      <Breadcrumb title="Find Job" trail={[{ label: 'Home', to: '/' }, { label: 'Find job' }]} />

      {/* Search + advanced filter */}
      <div className="bg-surface-alt">
        <div className="mx-auto w-full max-w-[1320px] px-6 pb-8 lg:px-10">
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex flex-col gap-3 rounded-lg border border-line-soft bg-surface p-3 shadow-[0px_12px_40px_rgba(0,44,109,0.04)] lg:flex-row lg:items-center"
          >
            <div className="flex flex-1 flex-col divide-y divide-line lg:flex-row lg:items-center lg:divide-x lg:divide-y-0">
              <label className="flex h-14 flex-1 items-center gap-3 px-4">
                <SearchIcon className="size-6 shrink-0 text-brand" />
                <input
                  type="text"
                  placeholder="Job title, keyword, company..."
                  value={filters.keyword}
                  onChange={(e) => setField('keyword', e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted-400"
                />
              </label>
              <label className="flex h-14 flex-1 items-center gap-3 px-4">
                <MapPinIcon className="size-6 shrink-0 text-brand" />
                <input
                  type="text"
                  placeholder="Location"
                  value={filters.location}
                  onChange={(e) => setField('location', e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted-400"
                />
              </label>
              <div className="flex h-14 flex-1 items-center px-4">
                <Dropdown
                  className="flex-1 text-base"
                  icon={<LayersIcon className="size-6 shrink-0 text-brand" />}
                  placeholder="All categories"
                  value={filters.category}
                  onChange={(v) => setField('category', v)}
                  options={[
                    { value: '', label: 'All categories' },
                    ...categories.map((c) => ({ value: c, label: c })),
                  ]}
                />
              </div>
              <button
                type="button"
                onClick={() => setAdvOpen((v) => !v)}
                aria-expanded={advOpen}
                className="flex h-14 items-center gap-2 px-4 text-base font-medium text-[#767e94]"
              >
                Advance Filter
                <ChevronDownIcon
                  className={`size-6 transition-transform ${advOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
            <button
              type="submit"
              className="shrink-0 rounded-[4px] bg-brand px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-brand-600"
            >
              Find Job
            </button>
          </form>

          {advOpen && (
            <div className="mt-3 rounded-lg border border-line-soft bg-surface p-6 shadow-[0px_12px_40px_rgba(0,44,109,0.04)]">
              <div className="grid gap-6 sm:grid-cols-3">
                <label className="flex flex-col gap-2 text-sm font-medium text-ink">
                  Job Type
                  <SelectMenu
                    value={filters.jobType}
                    onChange={(v) => setField('jobType', v)}
                    options={withAny('Any job type', JOB_TYPES)}
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-ink">
                  Workplace Type
                  <SelectMenu
                    value={filters.workplaceType}
                    onChange={(v) => setField('workplaceType', v)}
                    options={withAny('Any workplace', WORKPLACE_TYPES)}
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-ink">
                  Rate Period
                  <SelectMenu
                    value={filters.ratePeriod}
                    onChange={(v) => setField('ratePeriod', v)}
                    options={withAny('Any rate period', RATE_PERIODS)}
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Result bar */}
      <div className="bg-surface">
        <div className="mx-auto flex w-full max-w-[1320px] flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-10">
          <div className="flex flex-wrap items-center gap-3">
            {chips.length > 0 ? (
              chips.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={c.clear}
                  className="flex items-center gap-2 rounded-full bg-surface-alt py-1.5 pl-4 pr-2 text-sm text-ink-700"
                >
                  {c.label}
                  <XCircleIcon className="size-5 text-muted" />
                </button>
              ))
            ) : (
              <span className="text-sm text-muted">
                {loading ? 'Loading jobs…' : `${filtered.length} jobs`}
              </span>
            )}
            {chips.length > 0 && (
              <button
                type="button"
                onClick={() => setFilters(emptyFilters)}
                className="text-sm font-medium text-brand"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="flex h-11 items-center gap-2 rounded-md border border-line px-4 text-sm text-muted-600">
            <span className="shrink-0">Sort</span>
            <Dropdown
              className="w-[110px] font-medium"
              value={sort}
              onChange={(v) => setSort(v as 'latest' | 'oldest')}
              options={[
                { value: 'latest', label: 'Latest' },
                { value: 'oldest', label: 'Oldest' },
              ]}
              align="right"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1320px] px-6 py-12 lg:px-10">
        {error ? (
          <p className="rounded-lg bg-red-50 px-4 py-8 text-center text-sm text-red-600">
            {error}
          </p>
        ) : loading ? (
          <p className="py-10 text-center text-sm text-muted">Loading jobs…</p>
        ) : visible.length === 0 ? (
          <p className="rounded-lg bg-surface-alt px-4 py-12 text-center text-sm text-muted">
            No jobs match your filters.
          </p>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((job) => (
                <JobCard key={job.id} job={toCardJob(job)} />
              ))}
            </div>
            {pageCount > 1 && (
              <div className="pt-10">
                <Pagination pages={pageCount} current={page} onChange={setPage} />
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
