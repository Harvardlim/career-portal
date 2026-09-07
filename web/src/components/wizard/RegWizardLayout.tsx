import type { ComponentType, ReactNode, SVGProps } from 'react'
import { NavLink } from 'react-router-dom'
import { BriefcaseIcon } from '@/components/icons'

export type WizardStep = {
  label: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
}

export function RegWizardLayout({
  steps,
  activeStep,
  progress,
  children,
}: {
  steps: WizardStep[]
  activeStep: number
  progress: number
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="mx-auto flex w-full max-w-[1320px] items-center justify-between px-6 py-8 lg:px-10">
        <NavLink to="/" className="flex items-center gap-2">
          <BriefcaseIcon className="size-9 text-brand" />
          <span className="text-2xl font-semibold text-ink">Partly Asia</span>
        </NavLink>
        <div className="flex w-[280px] flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-600">Setup Progress</span>
            <span className="font-medium text-brand">{progress}% Completed</span>
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
        <div className="mb-8 flex flex-wrap gap-6 border-b border-line">
          {steps.map(({ label, Icon }, i) => (
            <span
              key={label}
              className={`-mb-px flex items-center gap-2 border-b-2 pb-3 text-sm ${
                i === activeStep
                  ? 'border-brand font-medium text-brand'
                  : 'border-transparent text-muted-600'
              }`}
            >
              <Icon className="size-4" />
              {label}
            </span>
          ))}
        </div>
        {children}
      </main>

      <div className="border-t border-line py-6 text-center text-sm text-muted">
        © 2024 Partly Asia. All rights reserved
      </div>
    </div>
  )
}

export function WizardButtons({
  nextLabel = 'Save & Next',
  onPrev,
  nextDisabled,
}: {
  nextLabel?: string
  onPrev?: () => void
  nextDisabled?: boolean
}) {
  return (
    <div className="flex gap-3 pt-2">
      {onPrev && (
        <button
          type="button"
          onClick={onPrev}
          className="rounded-[4px] bg-surface-alt px-6 py-3 text-base font-semibold text-ink"
        >
          Previous
        </button>
      )}
      <button
        type="submit"
        disabled={nextDisabled}
        className="flex items-center gap-2 rounded-[4px] bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {nextLabel}
        <span aria-hidden>→</span>
      </button>
    </div>
  )
}
