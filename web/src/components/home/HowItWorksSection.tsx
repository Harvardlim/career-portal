import { Fragment } from 'react'
import type { ComponentType, SVGProps } from 'react'
import {
  CircleCheckIcon,
  CloudUploadIcon,
  SearchPlusIcon,
  UserPlusIcon,
} from '@/components/icons'

type Step = {
  title: string
  description: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
  active?: boolean
}

const steps: Step[] = [
  {
    title: 'Create account',
    description:
      'Aliquam facilisis egestas sapien, nec tempor leo tristique at.',
    Icon: UserPlusIcon,
  },
  {
    title: 'Upload CV/Resume',
    description:
      'Curabitur sit amet maximus ligula. Nam a nulla ante. Nam sodales',
    Icon: CloudUploadIcon,
    active: true,
  },
  {
    title: 'Find suitable job',
    description: 'Phasellus quis eleifend ex. Morbi nec fringilla nibh.',
    Icon: SearchPlusIcon,
  },
  {
    title: 'Apply job',
    description:
      'Curabitur sit amet maximus ligula. Nam a nulla ante, Nam sodales purus.',
    Icon: CircleCheckIcon,
  },
]

function Connector({ flip }: { flip?: boolean }) {
  return (
    <svg
      className={`mt-9 hidden h-12 w-[120px] shrink-0 text-muted-slate xl:block ${
        flip ? '-scale-y-100' : ''
      }`}
      viewBox="0 0 120 48"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 6C30 6 40 42 60 42s30-36 58-36"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="6 8"
        strokeLinecap="round"
      />
      <path
        d="M112 2l8 4-7 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function HowItWorksSection() {
  return (
    <section className="bg-surface-alt">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col items-center gap-12 px-6 py-20 lg:gap-[50px] lg:px-10 lg:py-25">
        <h2 className="text-center text-3xl font-medium text-ink lg:text-[40px] lg:leading-[48px]">
          How jobpilot work
        </h2>
        <div className="flex flex-col items-center gap-10 sm:grid sm:grid-cols-2 xl:flex xl:flex-row xl:items-start xl:justify-center xl:gap-0">
          {steps.map((step, i) => (
            <Fragment key={step.title}>
              <div
                className={`flex w-full max-w-[312px] flex-col items-center gap-6 rounded-xl p-6 text-center ${
                  step.active ? 'bg-surface' : ''
                }`}
              >
                <span
                  className={`flex size-[72px] items-center justify-center rounded-full ${
                    step.active
                      ? 'bg-brand text-white'
                      : 'bg-surface text-brand'
                  }`}
                >
                  <step.Icon className="size-8" />
                </span>
                <div className="flex flex-col gap-3">
                  <h3 className="text-lg font-medium text-ink">{step.title}</h3>
                  <p className="text-sm leading-5 text-muted">
                    {step.description}
                  </p>
                </div>
              </div>
              {i < steps.length - 1 && <Connector flip={i % 2 === 1} />}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  )
}
