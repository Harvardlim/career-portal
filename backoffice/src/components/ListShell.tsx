import type { ReactNode } from 'react'
import { Button } from './ui'
import { IconChevronDown, IconChevronLeft, IconChevronRight, IconSearch } from './Icons'

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
  children,
}: {
  title: string
  range: string
  children: ReactNode
}) => (
  <div className="rounded-[12px] border border-line bg-surface shadow-card">
    <div className="flex items-center justify-between px-6 py-5">
      <h2 className="text-[17px] font-semibold text-ink">{title}</h2>
      <span className="text-[13px] font-medium text-muted">
        <span className="gradient-brand-text font-semibold">{range}</span>
      </span>
    </div>
    <div className="overflow-x-auto">{children}</div>
  </div>
)

export const ListFooter = ({ total }: { total: string }) => (
  <div className="flex flex-wrap items-center justify-between gap-4 px-1 pt-2 text-[13px] text-muted">
    <span>{total}</span>
    <div className="flex items-center gap-4">
      <span className="flex items-center gap-2">
        Rows per page:
        <button className="flex items-center gap-1.5 rounded-md border border-line px-2 py-1 text-ink-200">
          10 <IconChevronDown width={12} height={12} />
        </button>
      </span>
      <div className="flex items-center gap-2">
        <button className="grid size-8 place-items-center rounded-md border border-line hover:text-ink-200">
          <IconChevronLeft width={15} height={15} />
        </button>
        <button className="grid size-8 place-items-center rounded-md border border-line hover:text-ink-200">
          <IconChevronRight width={15} height={15} />
        </button>
      </div>
    </div>
  </div>
)

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
