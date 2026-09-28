import { Link } from 'react-router-dom'
import { useDisplayUser } from '@/lib/useDisplayUser'

/** The partly.asia logo (mark + wordmark). The default artwork is on white; `onDark` swaps in the transparent light-on-dark variant for dark surfaces such as the footer. */
export function Logo({ className = '', onDark = false }: { className?: string; onDark?: boolean }) {
  // Signed in, the logo takes you home to your dashboard rather than the marketing page.
  const { user } = useDisplayUser()
  return (
    <Link to={user?.dashboardPath ?? '/'} className={`inline-flex items-center ${className}`} aria-label="partly.asia home">
      <img src={onDark ? '/logo-dark.png' : '/logo.png'} alt="partly.asia" width={1362} height={291} className="h-8 w-auto sm:h-11" />
    </Link>
  )
}
