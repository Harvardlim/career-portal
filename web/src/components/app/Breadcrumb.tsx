import { Fragment } from 'react'
import { Link } from 'react-router-dom'

type Crumb = { label: string; to?: string }

export function Breadcrumb({ title, trail }: { title: string; trail: Crumb[] }) {
  return (
    <div className="bg-surface-alt">
      <div className="mx-auto flex w-full max-w-[1320px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 sm:px-6 sm:py-6 lg:px-10">
        <p className="text-lg font-medium text-ink">{title}</p>
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          {trail.map((c, i) => (
            <Fragment key={c.label}>
              {i > 0 && <span className="text-muted">/</span>}
              {c.to ? (
                <Link to={c.to} className="text-muted transition-colors hover:text-ink">
                  {c.label}
                </Link>
              ) : (
                <span className="text-ink">{c.label}</span>
              )}
            </Fragment>
          ))}
        </nav>
      </div>
    </div>
  )
}
