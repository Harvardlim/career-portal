import type { ComponentType, SVGProps } from 'react'
import { BriefcaseIcon, BuildingIcon } from '@/components/icons'

type Feature = {
  value: string
  label: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
}

const features: Feature[] = [
  { value: '1,75,324', label: 'Live Job', Icon: BriefcaseIcon },
  { value: '97,354', label: 'Companies', Icon: BuildingIcon },
  { value: '7,532', label: 'New Jobs', Icon: BriefcaseIcon },
]

/**
 * The dark marketing panel shown on the right of the split auth screens.
 * The Figma comp uses a photograph here; it is rendered as a deep-navy
 * gradient so the page stays self-contained.
 */
export function AuthPanel() {
  return (
    <div className="relative flex h-full min-h-[560px] flex-col justify-end overflow-hidden bg-brand-800 lg:min-h-screen lg:[clip-path:polygon(9%_0,100%_0,100%_100%,0_100%)]">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(120%_120%_at_80%_0%,#0a3a75_0%,#042852_45%,#03203f_100%)]"
      />
      <div className="relative flex flex-col gap-12 p-10 pb-16 text-white lg:p-[60px] lg:pb-24 lg:pl-24">
        <p className="max-w-[560px] text-3xl font-medium leading-tight lg:text-[40px] lg:leading-[48px]">
          Over 1,75,324 candidates waiting for good employees.
        </p>
        <div className="flex max-w-[560px] flex-wrap gap-x-6 gap-y-8 sm:justify-between">
          {features.map(({ value, label, Icon }) => (
            <div key={label} className="flex flex-col gap-6">
              <span className="flex size-16 items-center justify-center rounded-lg bg-white/10">
                <Icon className="size-8" />
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-xl font-medium">{value}</span>
                <span className="text-sm text-white/70">{label}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
