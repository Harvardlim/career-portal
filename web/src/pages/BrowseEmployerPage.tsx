import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '@/layouts/AppShell'
import { Breadcrumb } from '@/components/app/Breadcrumb'
import { Pagination } from '@/components/app/Pagination'
import { Dropdown } from '@/components/app/Dropdown'
import { CompanyLogo } from '@/components/jobs/CompanyLogo'
import {
  ArrowRightIcon,
  BriefcaseIcon,
  MapPinIcon,
  SearchIcon,
} from '@/components/icons'
import { errMessage } from '@/lib/errors'
import { fetchEmployers, logoColor, type EmployerListRow } from '@/lib/employers'

const PAGE_SIZE = 8

export function BrowseEmployerPage() {
  const [rows, setRows] = useState<EmployerListRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const [industry, setIndustry] = useState('')
  const [onlyHiring, setOnlyHiring] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    let alive = true
    fetchEmployers()
      .then((data) => alive && setRows(data))
      .catch((err) => alive && setError(errMessage(err)))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => setPage(1), [keyword, location, industry, onlyHiring])

  const industries = useMemo(
    () =>
      [...new Set(rows.flatMap((r) => r.field))].filter(Boolean).sort(),
    [rows],
  )

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (keyword && !r.company_name.toLowerCase().includes(keyword.toLowerCase()))
          return false
        if (
          location &&
          !(r.location ?? '').toLowerCase().includes(location.toLowerCase())
        )
          return false
        if (industry && !r.field.includes(industry)) return false
        if (onlyHiring && r.open_jobs === 0) return false
        return true
      }),
    [rows, keyword, location, industry, onlyHiring],
  )

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <AppShell>
      <Breadcrumb
        title="Find Employers"
        trail={[{ label: 'Home', to: '/' }, { label: 'Find Employers' }]}
      />

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
                  placeholder="Company name..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted-400"
                />
              </label>
              <label className="flex h-14 flex-1 items-center gap-3 px-4">
                <MapPinIcon className="size-6 shrink-0 text-brand" />
                <input
                  type="text"
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted-400"
                />
              </label>
              <div className="flex h-14 flex-1 items-center px-4">
                <Dropdown
                  className="flex-1 text-base"
                  icon={<BriefcaseIcon className="size-6 shrink-0 text-brand" />}
                  placeholder="All industries"
                  value={industry}
                  onChange={setIndustry}
                  options={[
                    { value: '', label: 'All industries' },
                    ...industries.map((i) => ({ value: i, label: i })),
                  ]}
                />
              </div>
            </div>
            <button
              type="submit"
              className="shrink-0 rounded-[4px] bg-brand px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-brand-600"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-4 px-6 py-4 lg:px-10">
        <span className="text-sm text-muted">
          {loading ? 'Loading employers…' : `${filtered.length} employers`}
        </span>
        <label className="flex items-center gap-2 text-sm text-ink-600">
          <input
            type="checkbox"
            checked={onlyHiring}
            onChange={(e) => setOnlyHiring(e.target.checked)}
            className="size-4 accent-brand"
          />
          Only currently hiring
        </label>
      </div>

      <div className="mx-auto w-full max-w-[1320px] px-6 pb-12 lg:px-10">
        {error ? (
          <p className="rounded-lg bg-red-50 px-4 py-8 text-center text-sm text-red-600">
            {error}
          </p>
        ) : loading ? (
          <p className="py-10 text-center text-sm text-muted">Loading employers…</p>
        ) : visible.length === 0 ? (
          <p className="rounded-lg bg-surface-alt px-4 py-12 text-center text-sm text-muted">
            No employers match your search.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-4">
              {visible.map((e) => (
                <article
                  key={e.id}
                  className="flex flex-col gap-4 rounded-xl border border-line p-6 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    {e.logo_url ? (
                      <img
                        src={e.logo_url}
                        alt={e.company_name}
                        className="size-14 shrink-0 rounded-md border border-line object-cover"
                      />
                    ) : (
                      <CompanyLogo bg={logoColor(e.company_name)} size={56} />
                    )}
                    <div className="flex flex-col gap-1.5">
                      <p className="text-base font-medium text-ink">
                        {e.company_name}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
                        {e.location && (
                          <span className="flex items-center gap-1.5">
                            <MapPinIcon className="size-[18px]" />
                            {e.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <BriefcaseIcon className="size-[18px]" />
                          {e.open_jobs} open {e.open_jobs === 1 ? 'job' : 'jobs'}
                        </span>
                        {e.field[0] && (
                          <span className="rounded-full bg-surface-alt px-3 py-0.5 text-xs text-ink-600">
                            {e.field[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link
                    to="/employer-detail"
                    className="flex shrink-0 items-center gap-3 rounded-[3px] bg-brand-50 px-6 py-3 text-base font-semibold text-brand transition-colors hover:bg-brand-100"
                  >
                    Open Position
                    <ArrowRightIcon className="size-5" />
                  </Link>
                </article>
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
