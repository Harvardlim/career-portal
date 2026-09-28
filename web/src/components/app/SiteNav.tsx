import { NavLink } from 'react-router-dom'
import { useNavItems } from '@/components/app/useNavItems'
import { useDisplayUser } from '@/lib/useDisplayUser'

/** The primary site navigation, rendered by the shared SiteHeader on every page. */
export function SiteNav() {
  const { user } = useDisplayUser()
  const items = useNavItems()
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
