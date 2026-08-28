import type { ComponentType, ReactNode, SVGProps } from 'react'

export function InfoCard({
  title,
  children,
  className = '',
}: {
  title?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-lg border border-line p-6 ${className}`}>
      {title && (
        <h3 className="mb-6 text-lg font-medium text-ink">{title}</h3>
      )}
      {children}
    </div>
  )
}

export type OverviewItem = {
  Icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
  value: ReactNode
}

export function OverviewGrid({
  items,
  columns = 3,
}: {
  items: OverviewItem[]
  columns?: 2 | 3
}) {
  return (
    <div
      className={`grid gap-6 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}
    >
      {items.map(({ Icon, label, value }) => (
        <div key={label} className="flex flex-col gap-2">
          <Icon className="size-6 text-brand" />
          <span className="text-xs uppercase tracking-wide text-muted-400">
            {label}
          </span>
          <span className="text-sm font-medium text-ink">{value}</span>
        </div>
      ))}
    </div>
  )
}

export function ContactRow({
  Icon,
  label,
  value,
}: {
  Icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
  value: ReactNode
}) {
  return (
    <div className="flex gap-3 border-b border-line py-4 last:border-0 last:pb-0 first:pt-0">
      <Icon className="mt-0.5 size-5 shrink-0 text-brand" />
      <div className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-muted-400">
          {label}
        </span>
        <span className="text-sm font-medium text-ink">{value}</span>
      </div>
    </div>
  )
}
