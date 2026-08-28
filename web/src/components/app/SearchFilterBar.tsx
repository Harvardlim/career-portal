import {
  ChevronDownIcon,
  FilterIcon,
  GridIcon,
  LayersIcon,
  ListIcon,
  MapPinIcon,
  SearchIcon,
} from '@/components/icons'

/** Compact search bar used on the browse Employer / Candidate pages. */
export function SearchFilterBar() {
  return (
    <div className="bg-surface-alt">
      <div className="mx-auto w-full max-w-[1320px] px-6 pb-8 lg:px-10">
        <div className="flex flex-col gap-3 rounded-lg border border-line-soft bg-surface p-3 shadow-[0px_12px_40px_rgba(0,44,109,0.04)] lg:flex-row lg:items-center">
          <div className="flex flex-1 flex-col divide-y divide-line lg:flex-row lg:items-center lg:divide-x lg:divide-y-0">
            <label className="flex h-14 flex-1 items-center gap-3 px-4">
              <SearchIcon className="size-6 shrink-0 text-brand" />
              <input
                type="text"
                placeholder="Job tittle, Keyword..."
                className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted-400"
              />
            </label>
            <label className="flex h-14 flex-1 items-center gap-3 px-4">
              <MapPinIcon className="size-6 shrink-0 text-brand" />
              <input
                type="text"
                placeholder="Location"
                className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted-400"
              />
            </label>
            <button
              type="button"
              className="flex h-14 flex-1 items-center gap-3 px-4 text-muted-400"
            >
              <LayersIcon className="size-6 shrink-0 text-brand" />
              <span className="flex-1 text-left text-base">Select Category</span>
              <ChevronDownIcon className="size-6" />
            </button>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-[4px] bg-brand px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-brand-600"
          >
            Find Job
          </button>
        </div>
      </div>
    </div>
  )
}

export function ResultsToolbar({ view = 'list' }: { view?: 'grid' | 'list' }) {
  return (
    <div className="bg-surface">
      <div className="mx-auto flex w-full max-w-[1320px] flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-10">
        <button
          type="button"
          className="flex items-center gap-2 rounded-[4px] bg-brand px-6 py-3 text-sm font-semibold text-white"
        >
          <FilterIcon className="size-5" />
          Filter
        </button>
        <div className="flex items-center gap-4">
          <SelectPill label="Latest" />
          <SelectPill label="12 per page" />
          <div className="flex items-center gap-2 rounded-md border border-line p-2">
            <span
              className={`grid size-8 place-items-center rounded-[3px] ${
                view === 'grid' ? 'bg-surface-alt text-ink' : 'text-muted'
              }`}
            >
              <GridIcon className="size-5" />
            </span>
            <span
              className={`grid size-8 place-items-center rounded-[3px] ${
                view === 'list' ? 'bg-surface-alt text-ink' : 'text-muted'
              }`}
            >
              <ListIcon className="size-5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function SelectPill({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="flex h-12 w-[160px] items-center justify-between rounded-md border border-line px-4 text-sm text-muted-600"
    >
      {label}
      <ChevronDownIcon className="size-5" />
    </button>
  )
}
