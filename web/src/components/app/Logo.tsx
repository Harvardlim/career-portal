import { Link } from 'react-router-dom'
import { useDisplayUser } from '@/lib/useDisplayUser'

/** partly.asia wordmark — navy with the gold ".asia" the deck uses everywhere. */
export function Logo({ className = '', light = false }: { className?: string; light?: boolean }) {
  // Signed in, the logo takes you home to your dashboard rather than the marketing page.
  const { user } = useDisplayUser()
  return (
    <Link to={user?.dashboardPath ?? '/'} className={`inline-flex items-center gap-2 ${className}`} aria-label="partly.asia home">
      <span className="grid size-9 place-items-center rounded-full bg-gold text-navy">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M5 12.5l4.5 4.5L19 8" />
        </svg>
      </span>
      <span
        className={`text-2xl font-semibold tracking-tight ${light ? 'text-white' : 'text-navy'}`}
        style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
      >
        partly<span className="text-gold">.asia</span>
      </span>
    </Link>
  )
}
