import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AdvanceFilterPanel } from '@/components/jobs/AdvanceFilterPanel'
import {
  ChevronDownIcon,
  GridIcon,
  LayersIcon,
  ListIcon,
  MapPinIcon,
  SearchIcon,
  XCircleIcon,
} from '@/components/icons'
import { useT } from '@/lib/i18n'

const activeFilters = ['Design', 'New York']

export function FindJobToolbar({
  view,
  defaultFilterOpen = false,
}: {
  view: 'grid' | 'list'
  defaultFilterOpen?: boolean
}) {
  const t = useT()
  const [filterOpen, setFilterOpen] = useState(defaultFilterOpen)
  return (
    <>
      {/* Advance filter */}
      <div className="bg-surface-alt">
        <div className="mx-auto w-full max-w-[1320px] px-6 pb-8 lg:px-10">
          <div className="flex flex-col gap-3 rounded-lg border border-line-soft bg-surface p-3 shadow-[0px_12px_40px_rgba(0,44,109,0.04)] xl:flex-row xl:items-center">
            <div className="flex flex-1 flex-col divide-y divide-line xl:flex-row xl:items-center xl:divide-x xl:divide-y-0">
              <label className="flex h-14 flex-1 items-center gap-3 px-4">
                <SearchIcon className="size-6 shrink-0 text-brand" />
                <input
                  type="text"
                  placeholder={t('ui.job_tittle_keyword')}
                  className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted-400"
                />
              </label>
              <label className="flex h-14 flex-1 items-center gap-3 px-4">
                <MapPinIcon className="size-6 shrink-0 text-brand" />
                <input
                  type="text"
                  placeholder={t('ui.location')}
                  className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted-400"
                />
              </label>
              <button
                type="button"
                className="flex h-14 flex-1 items-center gap-3 px-4 text-muted-400"
              >
                <LayersIcon className="size-6 shrink-0 text-brand" />
                <span className="flex-1 text-left text-base">{t('ui.select_category')}</span>
                <ChevronDownIcon className="size-6" />
              </button>
              <button
                type="button"
                onClick={() => setFilterOpen((v) => !v)}
                aria-expanded={filterOpen}
                className="flex h-14 items-center gap-2 px-4 text-base font-medium text-[#767e94]"
              >{t('ui.advance_filter')}<ChevronDownIcon
                  className={`size-6 transition-transform ${filterOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-[4px] bg-brand px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-brand-600"
            >{t('ui.find_job')}</button>
          </div>
          {filterOpen && <AdvanceFilterPanel />}
        </div>
      </div>

      {/* Sort / view bar */}
      <div className="bg-surface">
        <div className="mx-auto flex w-full max-w-[1320px] flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-10">
          <div className="flex flex-wrap gap-3">
            {activeFilters.map((f) => (
              <span
                key={f}
                className="flex items-center gap-3 rounded-full bg-surface-alt py-1.5 pl-4 pr-1.5 text-sm text-ink-700"
              >
                {f}
                <XCircleIcon className="size-5 text-muted" />
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <SelectPill label={t('ui.latest')} />
            <SelectPill label={t('ui.12_per_page')} />
            <div className="flex items-center gap-2 rounded-md border border-line p-2">
              <Link
                to="/find-job"
                aria-label={t('ui.grid_view')}
                className={`grid size-8 place-items-center rounded-[3px] ${
                  view === 'grid' ? 'bg-surface-alt text-ink' : 'text-muted'
                }`}
              >
                <GridIcon className="size-5" />
              </Link>
              <Link
                to="/find-job-list"
                aria-label={t('ui.list_view')}
                className={`grid size-8 place-items-center rounded-[3px] ${
                  view === 'list' ? 'bg-surface-alt text-ink' : 'text-muted'
                }`}
              >
                <ListIcon className="size-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function SelectPill({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="flex h-12 w-[180px] items-center justify-between rounded-md border border-line px-4 text-sm text-muted-600"
    >
      {label}
      <ChevronDownIcon className="size-5" />
    </button>
  )
}
