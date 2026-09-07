import { useEffect, useState, type ReactNode } from 'react'
import { Button } from './ui'
import { SelectMenu } from './SelectMenu'
import { IconChevronLeft, IconChevronRight, IconSearch } from './Icons'

export const PAGE_SIZES = [10, 25, 50]

export const lc = (v: string | null | undefined) => (v ?? '').toLowerCase()

/** Client-side search + pagination for a list table. */
export function useTableView<T>(rows: T[], matches: (row: T, q: string) => boolean) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const q = query.trim().toLowerCase()
  const filtered = q ? rows.filter((r) => matches(r, q)) : rows
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))

  useEffect(() => setPage(1), [query, pageSize])
  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])

  return {
    query,
    setQuery,
    page,
    setPage,
    pageSize,
    setPageSize,
    filtered,
    paged: filtered.slice((page - 1) * pageSize, page * pageSize),
  }
}

export const ListTopBar = ({
  title,
  searchPlaceholder,
  action,
}: {
  title: string
  searchPlaceholder: string
  action: string
}) => (
  <div className="flex flex-wrap items-center gap-4">
    <h1 className="text-[24px] font-semibold text-ink">{title}</h1>
    <label className="flex min-w-[280px] flex-1 items-center gap-2.5 rounded-xl border border-line bg-surface px-4 py-3">
      <IconSearch width={18} height={18} className="text-muted" />
      <input
        placeholder={searchPlaceholder}
        className="w-full bg-transparent text-[14px] text-ink-200 placeholder:text-muted focus:outline-none"
      />
    </label>
    <Button className="px-5 py-3">{action}</Button>
  </div>
)

export const Checkbox = ({
  checked,
  indeterminate,
}: {
  checked?: boolean
  indeterminate?: boolean
}) => (
  <span
    className={`grid size-4 place-items-center rounded-[5px] border ${
      checked || indeterminate ? 'border-brand bg-brand text-white' : 'border-line'
    }`}
  >
    {indeterminate ? (
      <span className="h-[2px] w-2 rounded bg-white" />
    ) : checked ? (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m5 13 4 4L19 7" />
      </svg>
    ) : null}
  </span>
)

export const SortHead = ({ icon, label }: { icon: ReactNode; label: string }) => (
  <span className="inline-flex items-center gap-1.5">
    <span className="text-muted">{icon}</span>
    {label}
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
      <path d="m8 9 4-4 4 4M8 15l4 4 4-4" />
    </svg>
  </span>
)

export const ListCard = ({
  title,
  range,
  toolbar,
  children,
}: {
  title: string
  range: string
  toolbar?: ReactNode
  children: ReactNode
}) => (
  <div className="rounded-[12px] border border-line bg-surface shadow-card">
    <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
      <h2 className="text-[17px] font-semibold text-ink">{title}</h2>
      <div className="flex items-center gap-3">
        {toolbar}
        <span className="text-[13px] font-medium text-muted">
          <span className="gradient-brand-text font-semibold">{range}</span>
        </span>
      </div>
    </div>
    <div className="overflow-x-auto">{children}</div>
  </div>
)

/** Compact search box for list toolbars. */
export const TableSearch = ({
  value,
  onChange,
  placeholder = 'Search…',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) => (
  <label className="flex w-[220px] items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-1.5">
    <IconSearch width={15} height={15} className="text-muted" />
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-transparent text-[13px] text-ink-200 placeholder:text-muted focus:outline-none"
    />
  </label>
)

export const ListFooter = ({ total }: { total: string }) => (
  <div className="px-1 pt-2 text-[13px] text-muted">{total}</div>
)

const DEFAULT_PAGE_SIZES = [10, 20, 50]

export const Pagination = ({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
}: {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  pageSizeOptions?: number[]
}) => {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-1 pt-3 text-[13px] text-muted">
      <span>
        {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-2">
          Rows per page:
          <SelectMenu
            className="w-[76px]"
            value={String(pageSize)}
            onChange={(v) => onPageSizeChange(Number(v))}
            options={pageSizeOptions.map((n) => ({ value: String(n), label: String(n) }))}
          />
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous page"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="grid size-8 place-items-center rounded-md border border-line hover:text-ink-200 disabled:opacity-40"
          >
            <IconChevronLeft width={15} height={15} />
          </button>
          <span className="tabular-nums text-ink-200">
            {page} / {pageCount}
          </span>
          <button
            type="button"
            aria-label="Next page"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
            className="grid size-8 place-items-center rounded-md border border-line hover:text-ink-200 disabled:opacity-40"
          >
            <IconChevronRight width={15} height={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

export const RowActions = () => (
  <span className="flex items-center justify-end gap-3 text-muted">
    <button aria-label="Edit" className="hover:text-ink-200">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 20h4L18.5 9.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16v4Z" />
      </svg>
    </button>
    <button aria-label="Delete" className="hover:text-danger">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7h16M10 4h4M6 7l1 13h10l1-13M10 11v6M14 11v6" />
      </svg>
    </button>
  </span>
)
