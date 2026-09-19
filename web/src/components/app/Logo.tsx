import { Link } from 'react-router-dom'

/** partly.asia wordmark — navy with the gold ".asia" the deck uses everywhere. */
export function Logo({ className = '', light = false }: { className?: string; light?: boolean }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 ${className}`} aria-label="partly.asia home">
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
