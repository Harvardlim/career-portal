import { useEffect, useState, type ComponentType, type SVGProps } from 'react'
import {
  ArrowRightIcon,
  ChartBarIcon,
  CodeIcon,
  DatabaseIcon,
  FirstAidIcon,
  LayersIcon,
  MegaphoneIcon,
  MonitorPlayIcon,
  MusicIcon,
  PenNibIcon,
} from '@/components/icons'
import { fetchCategories, type Category } from '@/lib/categories'

const categoryIcons: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  'Graphics & Design': PenNibIcon,
  'Code & Programing': CodeIcon,
  'Digital Marketing': MegaphoneIcon,
  'Video & Animation': MonitorPlayIcon,
  'Music & Audio': MusicIcon,
  'Account & Finance': ChartBarIcon,
  'Health & Care': FirstAidIcon,
  'Data & Science': DatabaseIcon,
}

export function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    fetchCategories()
      .then((rows) => {
        if (alive) setCategories(rows)
      })
      .catch((err: unknown) => {
        console.error('Failed to load categories', err)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  if (!loading && categories.length === 0) return null

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
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex animate-pulse items-center gap-4 rounded-xl bg-surface p-6 shadow-feature"
                >
                  <span className="size-[68px] shrink-0 rounded-lg bg-surface-alt" />
                  <span className="flex flex-col gap-2">
                    <span className="h-5 w-28 rounded bg-surface-alt" />
                    <span className="h-4 w-20 rounded bg-surface-alt" />
                  </span>
                </div>
              ))
            : categories.map(({ id, name, subcategories }) => {
                const Icon = categoryIcons[name] ?? LayersIcon
                return (
                  <a
                    key={id}
                    href="#"
                    className="flex items-center gap-4 rounded-xl bg-surface p-6 transition-shadow hover:shadow-feature"
                  >
                    <span className="flex size-[68px] shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand">
                      <Icon className="size-8" />
                    </span>
                    <span className="flex flex-col gap-2">
                      <span className="text-lg font-medium leading-7 text-ink">
                        {name}
                      </span>
                      <span className="text-sm text-ink-600">
                        {subcategories.length}{' '}
                        {subcategories.length === 1 ? 'Sub-category' : 'Sub-categories'}
                      </span>
                    </span>
                  </a>
                )
              })}
        </div>
      </div>
    </section>
  )
}
