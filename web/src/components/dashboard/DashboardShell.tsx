import type { ComponentType, ReactNode, SVGProps } from 'react'
import { NavLink } from 'react-router-dom'
import { AppHeader } from '@/components/app/AppHeader'
import { LogOutIcon } from '@/components/icons'

export type DashboardNavItem = {
  label: string
  to: string
  end?: boolean
  Icon: ComponentType<SVGProps<SVGSVGElement>>
  badge?: string
}

export function DashboardShell({
  heading,
  nav,
  variant = 'candidate',
  children,
}: {
  heading: string
  nav: DashboardNavItem[]
  variant?: 'candidate' | 'employer'
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <AppHeader variant={variant} />
      <div className="mx-auto flex w-full max-w-[1320px] flex-1 flex-col px-6 lg:flex-row lg:px-10">
        <aside className="flex flex-col gap-1 py-8 lg:w-[260px] lg:shrink-0 lg:border-r lg:border-line lg:pr-8">
          <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wide text-muted-400">
            {heading}
          </p>
          {nav.map(({ label, to, end, Icon, badge }) => (
            <NavLink
              key={label}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-3 text-sm ${
                  isActive
                    ? 'border-l-2 border-brand bg-brand-50/60 font-medium text-brand'
                    : 'text-ink-600 transition-colors hover:bg-surface-alt'
                }`
              }
            >
              <Icon className="size-5" />
              <span className="flex-1">{label}</span>
              {badge && (
                <span className="rounded bg-surface-alt px-1.5 py-0.5 text-xs text-ink">
                  {badge}
                </span>
              )}
            </NavLink>
          ))}
          <button
            type="button"
            className="mt-8 flex items-center gap-3 px-3 py-3 text-sm text-ink-600 transition-colors hover:text-ink"
          >
            <LogOutIcon className="size-5" />
            Log-out
          </button>
        </aside>
        <main className="flex-1 py-8 lg:pl-10">{children}</main>
      </div>
      <div className="border-t border-line py-6 text-center text-sm text-muted">
        @ 2024 MyJob - Job Portal. All rights Rserved
      </div>
    </div>
  )
}
