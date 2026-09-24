import { Link } from 'react-router-dom'
import { useDisplayUser } from '@/lib/useDisplayUser'

/** The partly.asia logo (mark + wordmark). The artwork is on white, so it belongs on light surfaces. */
export function Logo({ className = '' }: { className?: string }) {
  // Signed in, the logo takes you home to your dashboard rather than the marketing page.
  const { user } = useDisplayUser()
  return (
    <Link to={user?.dashboardPath ?? '/'} className={`inline-flex items-center ${className}`} aria-label="partly.asia home">
      <img src="/logo.png" alt="partly.asia" width={1362} height={291} className="h-10 w-auto sm:h-11" />
    </Link>
  )
}
