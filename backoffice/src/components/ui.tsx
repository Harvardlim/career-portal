import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { IconArrowDownRight, IconArrowUpRight } from './Icons'

export const Card = ({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) => (
  <div
    className={`rounded-[12px] border border-line bg-surface shadow-card ${className}`}
  >
    {children}
  </div>
)

export const Delta = ({ value, dir }: { value: string; dir: 'up' | 'down' }) => {
  const up = dir === 'up'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
        up ? 'bg-success/12 text-success' : 'bg-danger/12 text-danger'
      }`}
    >
      {value}
      {up ? (
        <IconArrowUpRight width={12} height={12} />
      ) : (
        <IconArrowDownRight width={12} height={12} />
      )}
    </span>
  )
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost'
}

export const Button = ({
  variant = 'primary',
  className = '',
  children,
  ...rest
}: BtnProps) => {
  const styles =
    variant === 'primary'
      ? 'gradient-brand text-white shadow-pop hover:brightness-110'
      : 'border border-line bg-surface/50 text-ink-200 hover:text-ink'
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition ${styles} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h2 className="text-[22px] font-semibold text-ink">{children}</h2>
)

export const StatusPill = ({
  tone,
  children,
}: {
  tone: 'online' | 'offline' | 'in' | 'out'
  children: ReactNode
}) => {
  const map = {
    online: 'bg-success/12 text-success',
    in: 'bg-success/12 text-success',
    offline: 'bg-white/[0.05] text-muted',
    out: 'bg-white/[0.05] text-muted',
  } as const
  const dot = tone === 'online' || tone === 'in' ? 'bg-success' : 'bg-muted'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium ${map[tone]}`}
    >
      <span className={`size-1.5 rounded-full ${dot}`} />
      {children}
    </span>
  )
}
