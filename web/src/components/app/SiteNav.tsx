import { NavLink } from 'react-router-dom'
import { useT } from '@/lib/i18n'

/** The primary site navigation, rendered by the shared SiteHeader on every page. */
export function SiteNav() {
  const t = useT()
  const items = [
    { label: t('nav.home'), to: '/' },
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
          end={item.to === '/'}
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
