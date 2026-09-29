import { Link } from 'react-router-dom'
import { useDisplayUser } from '@/lib/useDisplayUser'
import { useT } from '@/lib/i18n'

/** The partly.asia logo (mark + wordmark). The default artwork is on white; `onDark` swaps in the transparent light-on-dark variant for dark surfaces such as the footer. */
export function Logo({ className = '', onDark = false }: { className?: string; onDark?: boolean }) {
  const t = useT()
  // Signed in, the logo takes you home to your dashboard rather than the marketing page.
  const { user } = useDisplayUser()
  return (
    <Link to={user?.dashboardPath ?? '/'} className={`inline-flex items-center ${className}`} aria-label={t('ui.partly_asia_home')}>
      <img src={onDark ? '/logo-dark.png' : '/logo.png'} alt="partly.asia" width={1362} height={291} className="h-8 w-auto sm:h-11" />
    </Link>
  )
}
