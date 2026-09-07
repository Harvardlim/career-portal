import type { ComponentType, ReactNode, SVGProps } from 'react'
import { NavLink, Navigate, useNavigate } from 'react-router-dom'
import { SiteHeader } from '@/components/SiteHeader'
import { ArrowRightIcon, LogOutIcon } from '@/components/icons'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/lib/useSession'
import {
  clearDisplayUserCache,
  setActiveRole,
  useDisplayUser,
} from '@/lib/useDisplayUser'

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
  children,
}: {
  heading: string
  nav: DashboardNavItem[]
  children: ReactNode
}) {
  const { session, loading } = useSession()
  const { user } = useDisplayUser()
  const navigate = useNavigate()

  function switchRole() {
    const next = user?.role === 'employer' ? 'candidate' : 'employer'
    setActiveRole(next)
    clearDisplayUserCache()
    navigate(next === 'employer' ? '/employer/dashboard' : '/dashboard')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-sm text-muted">Loading...</p>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/sign-in" replace />
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/sign-in')
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <SiteHeader />
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
          {user?.hasBothRoles && (
            <button
              type="button"
              onClick={switchRole}
              className="mt-8 flex items-center gap-3 rounded-md bg-brand-50 px-3 py-3 text-sm font-medium text-brand transition-colors hover:bg-brand-100"
            >
              <ArrowRightIcon className="size-5" />
              Switch to{' '}
              {user.role === 'employer' ? 'Candidate' : 'Employer'} view
            </button>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className={`${user?.hasBothRoles ? 'mt-2' : 'mt-8'} flex items-center gap-3 px-3 py-3 text-sm text-ink-600 transition-colors hover:text-ink`}
          >
            <LogOutIcon className="size-5" />
            Log-out
          </button>
        </aside>
        <main className="flex-1 py-8 lg:pl-10">{children}</main>
      </div>
      <div className="border-t border-line py-6 text-center text-sm text-muted">
        © 2024 Partly Asia. All rights reserved
      </div>
    </div>
  )
}
