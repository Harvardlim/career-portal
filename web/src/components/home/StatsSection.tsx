import type { ComponentType, SVGProps } from 'react'
import { BriefcaseIcon, BuildingIcon, UsersIcon } from '@/components/icons'

type Stat = {
  value: string
  label: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
  active?: boolean
}

const stats: Stat[] = [
  { value: '1,75,324', label: 'Live Job', Icon: BriefcaseIcon },
  { value: '97,354', label: 'Companies', Icon: BuildingIcon, active: true },
  { value: '38,47,154', label: 'Candidates', Icon: UsersIcon },
  { value: '7,532', label: 'New Jobs', Icon: BriefcaseIcon },
]

export function StatsSection() {
  return (
    <section className="bg-surface">
      <div className="mx-auto grid w-full max-w-[1320px] gap-6 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-10">
        {stats.map(({ value, label, Icon, active }) => (
          <div
            key={label}
            className={`flex items-center gap-5 rounded-lg bg-surface p-5 ${
              active ? 'shadow-feature' : ''
            }`}
          >
            <span
              className={`flex size-[72px] shrink-0 items-center justify-center rounded ${
                active ? 'bg-brand text-white' : 'bg-brand-50 text-brand'
              }`}
            >
              <Icon className="size-10" />
            </span>
            <span className="flex flex-col gap-1.5">
              <span className="text-2xl font-medium text-ink">{value}</span>
              <span className="text-base text-muted">{label}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
