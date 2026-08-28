import { NavLink } from 'react-router-dom'
import {
  IconArrowRight,
  IconChevronDown,
  IconChevronRight,
  IconDollar,
  IconGear,
  IconGrid,
  IconPlug,
  IconSearch,
  IconStar,
  IconUsers,
} from './Icons'

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
    <span className="text-[19px] font-semibold tracking-tight text-ink">Dashdark X</span>
  </div>
)

type LeafProps = { label: string; to?: string }

const Leaf = ({ label, to }: LeafProps) => {
  const cls = ({ isActive }: { isActive: boolean }) =>
    [
      'relative block rounded-md py-2 pl-3 pr-2 text-[14px] transition-colors',
      isActive
        ? 'bg-white/[0.04] font-medium text-ink before:absolute before:-left-3 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-brand'
        : 'text-muted hover:text-ink-200',
    ].join(' ')
  if (!to) {
    return (
      <span className="block cursor-default rounded-md py-2 pl-3 pr-2 text-[14px] text-muted hover:text-ink-200">
        {label}
      </span>
    )
  }
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

const Group = ({ icon, label, open, children }: GroupProps) => (
  <div>
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-[15px] font-medium text-ink-200 hover:text-ink"
    >
      <span className={open ? 'text-brand' : 'text-ink-400'}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {open ? (
        <IconChevronDown width={16} height={16} className="text-muted" />
      ) : (
        <IconChevronRight width={16} height={16} className="text-muted" />
      )}
    </button>
    {open && children ? (
      <div className="mt-1 space-y-0.5 border-l border-line-soft pl-4">{children}</div>
    ) : null}
  </div>
)

export const Sidebar = () => (
  <aside className="flex h-full w-[300px] shrink-0 flex-col gap-6 border-r border-line bg-bg-sidebar px-6 py-7">
    <div className="flex items-center justify-between">
      <Logo />
      <button
        type="button"
        aria-label="Collapse sidebar"
        className="grid size-7 place-items-center rounded-md border border-line text-muted hover:text-ink-200"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m11 7-5 5 5 5M18 7l-5 5 5 5" />
        </svg>
      </button>
    </div>

    <label className="flex items-center gap-2.5 rounded-lg border border-line bg-surface/60 px-3.5 py-2.5">
      <IconSearch width={18} height={18} className="text-muted" />
      <input
        placeholder="Search for..."
        className="w-full bg-transparent text-[14px] text-ink-200 placeholder:text-muted focus:outline-none"
      />
    </label>

    <nav className="flex-1 space-y-1 overflow-y-auto">
      <Group icon={<IconGrid width={19} height={19} />} label="Dashboard" open>
        <Leaf label="All pages" to="/pages" />
        <Leaf label="Reports" to="/" />
        <Leaf label="Products" to="/jobs" />
        <Leaf label="Task" to="/task" />
      </Group>
      <Group icon={<IconStar width={19} height={19} />} label="Features" />
      <Group icon={<IconUsers width={19} height={19} />} label="Users" />
      <Group icon={<IconDollar width={19} height={19} />} label="Pricing" />
      <Group icon={<IconPlug width={19} height={19} />} label="Integrations" />

      <div className="my-3 border-t border-line" />

      <Group icon={<IconGear width={19} height={19} />} label="Settings" />
      <Group
        icon={<span className="text-[15px] font-bold italic text-ink-400">w</span>}
        label="Template pages"
      />

      <NavLink
        to="/users"
        className="mt-1 flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-white/[0.03]"
      >
        <img
          src="https://i.pravatar.cc/72?img=12"
          alt=""
          className="size-9 rounded-full object-cover"
        />
        <span className="flex-1">
          <span className="block text-[14px] font-semibold text-ink">John Carter</span>
          <span className="block text-[12px] text-muted">Account settings</span>
        </span>
        <IconChevronRight width={16} height={16} className="text-muted" />
      </NavLink>
    </nav>

    <button
      type="button"
      className="gradient-brand flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[14px] font-semibold text-white shadow-pop"
    >
      Get template <IconArrowRight width={17} height={17} />
    </button>
  </aside>
)
