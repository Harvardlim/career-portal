import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { BriefcaseIcon, GearIcon, GlobeIcon, UserCircleIcon, UserIcon } from '@/components/icons'
import { useT, tr } from '@/lib/i18n'

const steps = [
  { get label() { return tr('wiz.company_info') }, to: '/company/register', end: true, Icon: UserIcon },
  { get label() { return tr('wiz.founding_info') }, to: '/company/register/founding', Icon: UserCircleIcon },
  { get label() { return tr('wiz.social') }, to: '/company/register/social', Icon: GlobeIcon },
  { get label() { return tr('wiz.contact') }, to: '/company/register/contact', Icon: GearIcon },
]

export function CompanyRegLayout({
  progress,
  tabs = true,
  children,
}: {
  progress: number
  tabs?: boolean
  children: ReactNode
}) {
  const t = useT()
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="mx-auto flex w-full max-w-[1320px] items-center justify-between px-6 py-8 lg:px-10">
        <NavLink to="/" className="flex items-center gap-2">
          <BriefcaseIcon className="size-9 text-brand" />
          <span className="text-2xl font-semibold text-ink">{t('ui.partly_asia')}</span>
        </NavLink>
        <div className="flex w-[280px] flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-600">{t('ui.setup_progress')}</span>
            <span className="font-medium text-brand">{t('ui.completed', { progress })}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-alt">
            <div
              className="h-full rounded-full bg-brand transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[720px] flex-1 px-6 py-8">
        {tabs && (
          <div className="mb-8 flex flex-wrap gap-6 border-b border-line">
            {steps.map(({ label, to, end, Icon }) => (
              <NavLink
                key={label}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `-mb-px flex items-center gap-2 border-b-2 pb-3 text-sm ${
                    isActive
                      ? 'border-brand font-medium text-brand'
                      : 'border-transparent text-muted-600'
                  }`
                }
              >
                <Icon className="size-4" />
                {label}
              </NavLink>
            ))}
          </div>
        )}
        {children}
      </main>

      <div className="border-t border-line py-6 text-center text-sm text-muted">{t('ui.partly_asia_all_rights_reserved', { v: new Date().getFullYear() })}</div>
    </div>
  )
}

export function WizardButtons({
  next,
  nextLabel = tr('wiz.save_next'),
  prev,
}: {
  next: string
  nextLabel?: string
  prev?: string
}) {
  const t = useT()
  return (
    <div className="flex gap-3 pt-2">
      {prev && (
        <NavLink
          to={prev}
          className="rounded-[4px] bg-surface-alt px-6 py-3 text-base font-semibold text-ink"
        >{t('ui.previous')}</NavLink>
      )}
      <NavLink
        to={next}
        className="flex items-center gap-2 rounded-[4px] bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-600"
      >
        {nextLabel}
        <span aria-hidden>→</span>
      </NavLink>
    </div>
  )
}
