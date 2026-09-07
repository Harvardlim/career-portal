import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  IconChevronDown,
  IconChevronRight,
  IconDollar,
  IconGrid,
  IconLock,
  IconUsers,
} from './Icons'
import { signOut, useAdminSession } from '../lib/admin'

const Logo = () => (
  <div className="flex items-center gap-2.5">
    <span className="grid size-8 place-items-center rounded-lg bg-bg">
      <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
        <defs>
          <linearGradient id="logoGrad" x1="0" y1="0" x2="32" y2="32">
            <stop stopColor="#CB3CFF" />
            <stop offset="1" stopColor="#00C2FF" />
          </linearGradient>
        </defs>
        <path
          d="M9 22V10a1 1 0 0 1 1-1h6a7 7 0 0 1 0 14h-6a1 1 0 0 1-1-1Z"
          fill="url(#logoGrad)"
        />
        <circle cx="21" cy="11" r="3" fill="#CB3CFF" />
      </svg>
    </span>
    <span className="text-[19px] font-semibold tracking-tight text-ink">Career Portal</span>
  </div>
)

type LeafProps = { label: string; to: string }

const Leaf = ({ label, to }: LeafProps) => {
  const cls = ({ isActive }: { isActive: boolean }) =>
    [
      'relative block rounded-md py-2 pl-3 pr-2 text-[14px] transition-colors',
      isActive
        ? 'bg-white/[0.04] font-medium text-ink before:absolute before:-left-3 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-brand'
        : 'text-muted hover:text-ink-200',
    ].join(' ')
  return (
    <NavLink to={to} end className={cls}>
      {label}
    </NavLink>
  )
}

type GroupProps = {
  icon: React.ReactNode
  label: string
  open?: boolean
  children?: React.ReactNode
}

const Group = ({ icon, label, open = false, children }: GroupProps) => {
  const [isOpen, setIsOpen] = useState(open)
  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-[15px] font-medium text-ink-200 hover:text-ink"
      >
        <span className={isOpen ? 'text-brand' : 'text-ink-400'}>{icon}</span>
        <span className="flex-1 text-left">{label}</span>
        {isOpen ? (
          <IconChevronDown width={16} height={16} className="text-muted" />
        ) : (
          <IconChevronRight width={16} height={16} className="text-muted" />
        )}
      </button>
      {isOpen && children ? (
        <div className="mt-1 space-y-0.5 border-l border-line-soft pl-4">{children}</div>
      ) : null}
    </div>
  )
}

export const Sidebar = () => {
  const session = useAdminSession()
  const navigate = useNavigate()

  const handleSignOut = () => {
    signOut()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col gap-6 border-r border-line bg-bg-sidebar px-6 py-7">
      <Logo />

      <nav className="flex-1 space-y-1 overflow-y-auto">
        <Group icon={<IconGrid width={19} height={19} />} label="Dashboard" open>
          <Leaf label="Reports" to="/" />
          <Leaf label="Jobs" to="/jobs" />
          <Leaf label="Categories" to="/categories" />
        </Group>
        <Group icon={<IconUsers width={19} height={19} />} label="Users" open>
          <Leaf label="Candidates" to="/users/candidates" />
          <Leaf label="Employers" to="/users/employers" />
        </Group>
        <Group icon={<IconDollar width={19} height={19} />} label="Finance" open>
          <Leaf label="Purchases & Credits" to="/finance" />
          <Leaf label="Affiliate payouts" to="/affiliates" />
        </Group>
        <Group icon={<IconLock width={19} height={19} />} label="Admins" open>
          <Leaf label="Admin list" to="/admins" />
          <Leaf label="Account settings" to="/account" />
        </Group>
      </nav>

      <div className="border-t border-line pt-3">
        <NavLink
          to="/account"
          className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-white/[0.03]"
        >
          <span className="grid size-9 place-items-center rounded-full bg-white/[0.06] text-[13px] font-semibold text-ink">
            {(session?.name ?? 'A').charAt(0).toUpperCase()}
          </span>
          <span className="flex-1 overflow-hidden">
            <span className="block truncate text-[14px] font-semibold text-ink">
              {session?.name ?? 'Admin'}
            </span>
            <span className="block truncate text-[12px] text-muted">
              {session?.email ?? 'Account settings'}
            </span>
          </span>
          <IconChevronRight width={16} height={16} className="text-muted" />
        </NavLink>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-1 w-full rounded-lg px-2 py-2 text-left text-[13px] font-medium text-muted hover:text-ink-200"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
