import type { ComponentType, SVGProps } from 'react'
import {
  ArrowRightIcon,
  ChartBarIcon,
  CodeIcon,
  DatabaseIcon,
  FirstAidIcon,
  MegaphoneIcon,
  MonitorPlayIcon,
  MusicIcon,
  PenNibIcon,
} from '@/components/icons'

type Category = {
  title: string
  positions: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
  active?: boolean
}

const categories: Category[] = [
  { title: 'Graphics & Design', positions: '357 Open position', Icon: PenNibIcon },
  { title: 'Code & Programing', positions: '312 Open position', Icon: CodeIcon },
  { title: 'Digital Marketing', positions: '297 Open position', Icon: MegaphoneIcon },
  { title: 'Video & Animation', positions: '247 Open position', Icon: MonitorPlayIcon },
  { title: 'Music & Audio', positions: '204 Open position', Icon: MusicIcon },
  { title: 'Account & Finance', positions: '167 Open position', Icon: ChartBarIcon },
  { title: 'Health & Care', positions: '125 Open position', Icon: FirstAidIcon },
  { title: 'Data & Science', positions: '57 Open position', Icon: DatabaseIcon, active: true },
]

export function CategoriesSection() {
  return (
    <section className="border-b border-line bg-surface">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-12 px-6 py-20 lg:gap-[50px] lg:px-10 lg:py-25">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-3xl font-medium text-ink lg:text-[40px] lg:leading-[48px]">
            Popular category
          </h2>
          <a
            href="#"
            className="flex items-center gap-3 rounded-[3px] border border-brand-50 px-6 py-3 text-base font-semibold text-brand transition-colors hover:bg-brand-50"
          >
            View All
            <ArrowRightIcon className="size-6" />
          </a>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map(({ title, positions, Icon, active }) => (
            <a
              key={title}
              href="#"
              className={`flex items-center gap-4 rounded-xl bg-surface p-6 transition-shadow ${
                active ? 'shadow-feature' : 'hover:shadow-feature'
              }`}
            >
              <span
                className={`flex size-[68px] shrink-0 items-center justify-center rounded-lg ${
                  active ? 'bg-brand text-white' : 'bg-brand-50 text-brand'
                }`}
              >
                <Icon className="size-8" />
              </span>
              <span className="flex flex-col gap-2">
                <span
                  className={`text-lg font-medium leading-7 ${
                    active ? 'text-brand' : 'text-ink'
                  }`}
                >
                  {title}
                </span>
                <span className="text-sm text-ink-600">{positions}</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
