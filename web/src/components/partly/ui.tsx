import type { ReactNode } from 'react'
import { CheckIcon, CircleCheckIcon, ClockIcon, StarIcon } from '@/components/icons'
import { useCountdown } from '@/lib/partly'

/** Read-only star display — avg out of 5, with an optional review count. */
export function StarRating({
  value,
  count,
  size = 16,
  showEmpty = true,
}: {
  value: number | null | undefined
  count?: number
  size?: number
  showEmpty?: boolean
}) {
  if (!value && (!count || count === 0)) {
    return showEmpty ? <span className="text-xs text-muted">No ratings yet</span> : null
  }
  const rounded = Math.round((value ?? 0) * 2) / 2
  return (
    <span className="inline-flex items-center gap-1">
      <span className="flex items-center" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <StarIcon
            key={i}
            style={{ width: size, height: size }}
            className={i <= rounded ? 'text-amber-400' : 'text-line'}
          />
        ))}
      </span>
      <span className="text-xs font-medium text-ink-600">
        {(value ?? 0).toFixed(1)}
        {typeof count === 'number' && <span className="text-muted"> ({count})</span>}
      </span>
    </span>
  )
}

export function Pill({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger'
  children: ReactNode
}) {
  const cls = {
    neutral: 'bg-surface-alt text-ink-600',
    brand: 'bg-brand-50 text-brand',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-danger-50 text-danger',
  }[tone]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {children}
    </span>
  )
}

/**
 * The two verification tiers, for Experts and Businesses alike:
 *   Basic verified  -- free (an Expert's ID digits / a Business's registration number)
 *   Fully verified  -- the paid annual badge, backed by a reviewed document
 * The higher tier replaces the lower one rather than stacking beside it.
 */
export function VerifiedChips({ identity, badge }: { identity?: boolean; badge?: boolean }) {
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {badge ? (
        <Pill tone="brand">
          <CircleCheckIcon className="size-3.5" /> Fully verified
        </Pill>
      ) : identity ? (
        <Pill tone="success">
          <CheckIcon className="size-3.5" /> Basic verified
        </Pill>
      ) : null}
    </span>
  )
}

/**
 * The speech-bubble nudge toward the paid tier. `audience` says who is being
 * nudged: businesses hear about better experts, experts about more interested leads.
 */
export function FullyVerifiedBubble({
  audience,
  action,
}: {
  audience: 'business' | 'expert'
  action?: ReactNode
}) {
  return (
    <div className="relative w-fit max-w-xl">
      <div className="flex items-start gap-3 rounded-2xl border border-gold/50 bg-gold-50 px-4 py-3 text-sm text-navy">
        <CircleCheckIcon className="mt-0.5 size-5 shrink-0 text-gold" />
        <p>
          <strong>
            {audience === 'business'
              ? 'A Fully verified mark attracts better experts.'
              : 'A Fully verified mark attracts more interested leads.'}
          </strong>{' '}
          {audience === 'business'
            ? 'Experts apply first to businesses they can trust.'
            : 'Businesses release contact to verified experts first.'}
          {action && <span className="ml-1">{action}</span>}
        </p>
      </div>
      {/* the bubble's tail */}
      <span className="absolute -bottom-1.5 left-8 size-3 rotate-45 border-b border-r border-gold/50 bg-gold-50" aria-hidden />
    </div>
  )
}

export function Countdown({ until, prefix = 'Time left:' }: { until: string | null; prefix?: string }) {
  const { label, expired } = useCountdown(until)
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${expired ? 'text-danger' : 'text-amber-700'}`}>
      <ClockIcon className="size-4" />
      {expired ? 'Window closed' : `${prefix} ${label}`}
    </span>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-surface p-5 ${className}`}>{children}</div>
}

export function Notice({
  tone = 'brand',
  title,
  children,
}: {
  tone?: 'brand' | 'warning' | 'danger' | 'success'
  title?: string
  children: ReactNode
}) {
  const cls = {
    brand: 'border-brand-100 bg-brand-50 text-brand-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    danger: 'border-red-200 bg-danger-50 text-danger',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  }[tone]
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${cls}`}>
      {title && <p className="font-medium">{title}</p>}
      <div className={title ? 'mt-1' : ''}>{children}</div>
    </div>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg bg-surface-alt px-4 py-10 text-center text-sm text-muted">{children}</p>
  )
}

export function PrimaryButton({
  children,
  className = '',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-md bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function SecondaryButton({
  children,
  className = '',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-md border border-line bg-surface px-5 text-sm font-medium text-ink transition-colors hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('')
}

export function Avatar({ name, src, size = 56 }: { name: string; src?: string | null; size?: number }) {
  return src ? (
    <img
      src={src}
      alt=""
      style={{ width: size, height: size }}
      className="shrink-0 rounded-full object-cover"
    />
  ) : (
    <span
      style={{ width: size, height: size, fontSize: size / 2.6 }}
      className="flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-800"
    >
      {initials(name)}
    </span>
  )
}
