import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { CloseIcon, MenuIcon } from '@/components/icons'
import { LanguageSwitcher } from '@/components/app/LanguageSwitcher'
import { useNavItems } from '@/components/app/useNavItems'
import { useDisplayUser } from '@/lib/useDisplayUser'
import { useT } from '@/lib/i18n'

/** Below lg the primary nav is hidden; this hamburger opens the same links in a drawer. */
export function MobileMenu() {
  const t = useT()
  const items = useNavItems()
  const { user } = useDisplayUser()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  // Close on navigation (adjusting state during render, not in an effect).
  const [openedAt, setOpenedAt] = useState(pathname)
  if (openedAt !== pathname) {
    setOpenedAt(pathname)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const link = 'block rounded-md px-3 py-3 text-base'
  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('ui.open_menu')}
        aria-expanded={open}
        className="grid size-11 place-items-center rounded-[3px] border border-line text-ink"
      >
        <MenuIcon className="size-5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} aria-hidden="true" />
          <nav
            aria-label={t('ui.menu')}
            className="absolute inset-y-0 right-0 flex w-[min(320px,88vw)] flex-col overflow-y-auto bg-surface p-4 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('ui.close_menu')}
              className="ml-auto grid size-11 place-items-center rounded-full text-muted hover:bg-surface-alt"
            >
              <CloseIcon className="size-5" />
            </button>
            {!user && (
              <div className="mt-2 grid grid-cols-2 gap-2 sm:hidden">
                <NavLink
                  to="/sign-in"
                  className="rounded-[3px] border border-brand-100 px-4 py-3 text-center text-sm font-semibold text-brand"
                >
                  {t('nav.login')}
                </NavLink>
                <NavLink
                  to="/create-account"
                  className="rounded-[3px] bg-brand px-4 py-3 text-center text-sm font-semibold text-white"
                >
                  {t('nav.signup')}
                </NavLink>
              </div>
            )}
            {user && (
              <NavLink
                to={user.role === 'employer' ? '/employer/post-need' : '/needs'}
                className="mt-2 rounded-[3px] border border-brand-100 px-4 py-3 text-center text-sm font-semibold text-brand sm:hidden"
              >
                {user.role === 'employer' ? t('nav.postFree') : t('exp.browse')}
              </NavLink>
            )}
            <div className="mt-2 flex flex-col">
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/' || item.to === user?.dashboardPath}
                  className={({ isActive }) =>
                    `${link} ${isActive ? 'bg-brand-50 font-medium text-brand' : 'text-ink hover:bg-surface-alt'}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
            <div className="mt-4 flex flex-col border-t border-line pt-4">
              <NavLink to="/trust" className={`${link} text-ink-600 hover:bg-surface-alt`}>
                {t('footer.trust')}
              </NavLink>
              <NavLink to="/affiliate" className={`${link} text-ink-600 hover:bg-surface-alt`}>
                {t('footer.affiliate')}
              </NavLink>
              <div className="px-3 py-3 [&_ul]:left-0 [&_ul]:right-auto">
                <LanguageSwitcher />
              </div>
            </div>
          </nav>
        </div>
      )}
    </div>
  )
}
