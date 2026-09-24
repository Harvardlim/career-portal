import { NavLink } from 'react-router-dom'
import { useT } from '@/lib/i18n'
import { useDisplayUser } from '@/lib/useDisplayUser'

/** The primary site navigation, rendered by the shared SiteHeader on every page. */
export function SiteNav() {
  const t = useT()
  const { user } = useDisplayUser()
  const items = [
    // Signed in, "Home" is the dashboard — the marketing page is for visitors.
    user ? { label: t('nav.dashboard'), to: user.dashboardPath } : { label: t('nav.home'), to: '/' },
    { label: t('nav.businesses'), to: '/for-businesses' },
    { label: t('nav.experts'), to: '/for-experts' },
    { label: t('nav.categories'), to: '/categories' },
    { label: t('nav.how'), to: '/how-it-works' },
  ]
  return (
    <nav className="hidden flex-1 items-center justify-center gap-8 lg:flex">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/' || item.to === user?.dashboardPath}
          className={({ isActive }) =>
            isActive ? 'text-sm font-medium text-brand' : 'text-sm text-ink-600 transition-colors hover:text-ink'
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
