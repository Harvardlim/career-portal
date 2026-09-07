import { NavLink } from 'react-router-dom'

/** The primary site navigation, rendered by the shared SiteHeader on every page. */
const siteNavItems = [
  { label: 'Home', to: '/' },
  { label: 'Find Job', to: '/find-job' },
  { label: 'Employers', to: '/browse-employer' },
  { label: 'Pricing Plans', to: '/pricing' },
]

export function SiteNav() {
  return (
    <nav className="hidden flex-1 items-center justify-center gap-8 lg:flex">
      {siteNavItems.map((item) => (
        <NavLink
          key={item.label}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            isActive
              ? 'text-sm font-medium text-brand'
              : 'text-sm text-ink-600 transition-colors hover:text-ink'
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
