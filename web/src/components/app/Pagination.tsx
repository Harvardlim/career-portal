import { ArrowRightIcon } from '@/components/icons'

export function Pagination({
  pages = 5,
  current = 1,
  onChange,
}: {
  pages?: number
  current?: number
  onChange?: (page: number) => void
}) {
  const go = (n: number) => {
    if (onChange && n >= 1 && n <= pages && n !== current) onChange(n)
  }
  return (
    <nav className="flex items-center justify-center gap-2 py-4">
      <button
        type="button"
        aria-label="Previous page"
        disabled={!!onChange && current <= 1}
        onClick={() => go(current - 1)}
        className="grid size-12 place-items-center rounded-full text-ink-600 transition-colors hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ArrowRightIcon className="size-6 -scale-x-100" />
      </button>
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => go(n)}
          aria-current={n === current ? 'page' : undefined}
          className={`size-12 rounded-full text-sm font-medium transition-colors ${
            n === current
              ? 'bg-brand text-white'
              : 'text-ink-600 hover:bg-surface-alt'
          }`}
        >
          {String(n).padStart(2, '0')}
        </button>
      ))}
      <button
        type="button"
        aria-label="Next page"
        disabled={!!onChange && current >= pages}
        onClick={() => go(current + 1)}
        className="grid size-12 place-items-center rounded-full bg-brand-50 text-brand transition-colors hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ArrowRightIcon className="size-6" />
      </button>
    </nav>
  )
}
