import { NavLink } from 'react-router-dom'
import {
  BriefcaseIcon,
  ChevronDownIcon,
  PhoneIcon,
  SearchIcon,
} from '@/components/icons'

const topNav = [
  { label: 'Home', to: '/' },
  { label: 'Find Job', to: '/find-job' },
  { label: 'Employers', to: '/browse-employer' },
  { label: 'Candidates', to: '/browse-candidate' },
  { label: 'Pricing Plans', to: '/employer/pricing' },
  { label: 'Customer Supports', to: '/faq' },
]

export function SiteHeader() {
  return (
    <header>
      {/* Utility bar */}
      <div className="hidden bg-surface-alt md:block">
        <div className="mx-auto flex h-12 w-full max-w-[1320px] items-center justify-between px-6 lg:px-10">
          <nav className="flex items-center gap-6">
            {topNav.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  isActive
                    ? 'relative py-3.5 text-sm font-medium text-brand after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-brand'
                    : 'py-3.5 text-sm text-ink-600 transition-colors hover:text-ink'
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <PhoneIcon className="size-6 text-ink" />
              <span className="text-sm font-medium text-ink">+1-202-555-0178</span>
            </span>
            <button
              type="button"
              className="flex items-center gap-1 text-sm text-ink-600"
            >
              <span aria-hidden className="text-base leading-none">🇺🇸</span>
              English
              <ChevronDownIcon className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="border-b border-line bg-surface">
        <div className="mx-auto flex h-[90px] w-full max-w-[1320px] items-center gap-8 px-6 lg:px-10">
          <NavLink to="/" className="flex shrink-0 items-center gap-2">
            <BriefcaseIcon className="size-10 text-brand" />
            <span className="text-2xl font-semibold text-ink">MyJob</span>
          </NavLink>

          <form
            className="hidden h-[50px] flex-1 items-center gap-3 rounded-[5px] border border-line px-5 lg:flex"
            onSubmit={(e) => e.preventDefault()}
          >
            <button
              type="button"
              className="flex shrink-0 items-center gap-2 text-sm font-medium text-ink"
            >
              <span aria-hidden className="text-base leading-none">🇮🇳</span>
              India
              <ChevronDownIcon className="size-4 text-muted" />
            </button>
            <span className="h-8 w-px shrink-0 bg-line" />
            <SearchIcon className="size-6 shrink-0 text-muted" />
            <input
              type="text"
              placeholder="Job tittle, keyword, company"
              className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted-400"
            />
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-3">
            <NavLink
              to="/sign-in"
              className="rounded-[3px] border border-brand-100 px-6 py-3 text-base font-semibold text-brand transition-colors hover:bg-brand-50"
            >
              Sign in
            </NavLink>
            <NavLink
              to="/create-account"
              className="rounded-[3px] bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-600"
            >
              Post A Jobs
            </NavLink>
          </div>
        </div>
      </div>
    </header>
  )
}
