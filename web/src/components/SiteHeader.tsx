import { NavLink } from 'react-router-dom'
import { BriefcaseIcon, ChevronDownIcon, PhoneIcon } from '@/components/icons'
import { SiteNav } from '@/components/app/SiteNav'
import { initialsFromName } from '@/lib/name'
import { useDisplayUser } from '@/lib/useDisplayUser'

export function SiteHeader() {
  const { user } = useDisplayUser()

  return (
    <header>
      {/* Utility bar */}
      <div className="hidden bg-surface-alt md:block">
        <div className="mx-auto flex h-12 w-full max-w-[1320px] items-center justify-end gap-6 px-6 lg:px-10">
          <span className="flex items-center gap-2">
            <PhoneIcon className="size-6 text-ink" />
            <span className="text-sm font-medium text-ink">+1-202-555-0178</span>
          </span>
          <button
            type="button"
            className="flex items-center gap-1 text-sm text-ink-600"
          >
            <span aria-hidden className="text-base leading-none">🇺🇸</span>
            English
            <ChevronDownIcon className="size-4" />
          </button>
        </div>
      </div>

      {/* Main navigation */}
      <div className="border-b border-line bg-surface">
        <div className="mx-auto flex h-[90px] w-full max-w-[1320px] items-center justify-between gap-8 px-6 lg:px-10">
          <NavLink to="/" className="flex shrink-0 items-center gap-2">
            <BriefcaseIcon className="size-10 text-brand" />
            <span className="text-2xl font-semibold text-ink">Partly Asia</span>
          </NavLink>

          <SiteNav />

          <div className="flex shrink-0 items-center gap-3">
            {user ? (
              <>
                {user.role === 'employer' && (
                  <NavLink
                    to="/employer/post-job"
                    className="hidden rounded-[3px] border border-brand-100 px-5 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-brand-50 sm:block"
                  >
                    Post A Job
                  </NavLink>
                )}
                <NavLink
                  to={user.dashboardPath}
                  className="flex items-center gap-2"
                  aria-label="Go to your dashboard"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="size-11 rounded-full border border-line object-cover"
                    />
                  ) : (
                    <span className="grid size-11 place-items-center rounded-full bg-brand-50 text-sm font-semibold text-brand">
                      {initialsFromName(user.name) ||
                        user.email.charAt(0).toUpperCase()}
                    </span>
                  )}
                </NavLink>
              </>
            ) : (
              <>
                <NavLink
                  to="/sign-in"
                  className="rounded-[3px] border border-brand-100 px-6 py-3 text-base font-semibold text-brand transition-colors hover:bg-brand-50"
                >
                  Sign in
                </NavLink>
                <NavLink
                  to="/create-account"
                  className="rounded-[3px] bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-600"
                >
                  Post A Jobs
                </NavLink>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
