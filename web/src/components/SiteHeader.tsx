import { NavLink } from 'react-router-dom'
import { Logo } from '@/components/app/Logo'
import { NotificationBell } from '@/components/app/NotificationBell'
import { useSession } from '@/lib/useSession'
import { LanguageSwitcher } from '@/components/app/LanguageSwitcher'
import { SiteNav } from '@/components/app/SiteNav'
import { useT } from '@/lib/i18n'
import { initialsFromName } from '@/lib/name'
import { useDisplayUser } from '@/lib/useDisplayUser'

export function SiteHeader() {
  const { user } = useDisplayUser()
  const { session } = useSession()
  const t = useT()

  return (
    <header>
      {/* Utility bar */}
      <div className="hidden bg-surface-alt md:block">
        <div className="mx-auto flex h-12 w-full max-w-[1320px] items-center justify-end gap-6 px-6 lg:px-10">
          <NavLink to="/trust" className="text-sm text-ink-600 hover:text-ink">
            {t('footer.trust')}
          </NavLink>
          <NavLink to="/affiliate" className="text-sm text-ink-600 hover:text-ink">
            {t('footer.affiliate')}
          </NavLink>
          <LanguageSwitcher />
        </div>
      </div>

      {/* Main navigation */}
      <div className="border-b border-line bg-surface">
        <div className="mx-auto flex h-[90px] w-full max-w-[1320px] items-center justify-between gap-8 px-6 lg:px-10">
          <Logo className="shrink-0" />

          <SiteNav />

          <div className="flex shrink-0 items-center gap-3">
            {user ? (
              <>
                {user.role === 'employer' ? (
                  <NavLink
                    to="/employer/post-need"
                    className="hidden rounded-[3px] border border-brand-100 px-5 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-brand-50 sm:block"
                  >
                    {t('nav.postFree')}
                  </NavLink>
                ) : (
                  <NavLink
                    to="/needs"
                    className="hidden rounded-[3px] border border-brand-100 px-5 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-brand-50 sm:block"
                  >
                    {t('exp.browse')}
                  </NavLink>
                )}
                {session && <NotificationBell userId={session.user.id} />}
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
                  {t('nav.login')}
                </NavLink>
                <NavLink
                  to="/create-account"
                  className="rounded-[3px] bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-600"
                >
                  {t('nav.signup')}
                </NavLink>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
