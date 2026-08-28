import { ChevronDownIcon } from '@/components/icons'

export type FilterGroup = {
  title: string
  type: 'radio' | 'checkbox'
  name: string
  options: string[]
  selected?: string[]
}

export function SidebarFilter({ groups }: { groups: FilterGroup[] }) {
  return (
    <aside className="flex w-full flex-col gap-6 lg:w-[280px] lg:shrink-0">
      <section className="flex flex-col gap-4 border-b border-line pb-6">
        <div className="flex items-center justify-between">
          <p className="text-base text-ink">
            Location Radius: <span className="font-medium text-brand">32 miles</span>
          </p>
          <ChevronDownIcon className="size-5 -rotate-180 text-muted" />
        </div>
        <input
          type="range"
          min={0}
          max={100}
          defaultValue={50}
          className="w-full accent-brand"
          aria-label="Location radius"
        />
      </section>

      {groups.map((group) => (
        <section key={group.title} className="flex flex-col gap-4 border-b border-line pb-6 last:border-0">
          <div className="flex items-center justify-between">
            <p className="text-lg font-medium text-ink">{group.title}</p>
            <ChevronDownIcon className="size-5 -rotate-180 text-muted" />
          </div>
          <div className="flex flex-col gap-3">
            {group.options.map((opt) => {
              const checked = group.selected?.includes(opt)
              return (
                <label key={opt} className="flex items-center gap-2.5 text-sm text-ink-600">
                  <input
                    type={group.type}
                    name={group.type === 'radio' ? group.name : `${group.name}-${opt}`}
                    defaultChecked={checked}
                    className={`size-5 shrink-0 border border-brand-200 text-brand accent-brand ${
                      group.type === 'radio' ? 'rounded-full' : 'rounded-[3px]'
                    }`}
                  />
                  {opt}
                </label>
              )
            })}
          </div>
        </section>
      ))}
    </aside>
  )
}
