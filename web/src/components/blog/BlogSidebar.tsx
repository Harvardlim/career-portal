import { SearchIcon, ChevronDownIcon } from '@/components/icons'
import { useT } from '@/lib/i18n'

const categories = [
  'Graphics & Design',
  'Code & Programing',
  'Digital Marketig',
  'Video & Animation',
  'Musica & Audio',
  'Finance & Accounting',
  'Health & Care',
  'Data Science',
]

const tags = [
  'Design',
  'Programming',
  'Health & Care',
  'Motion Design',
  'Photography',
  'Politics',
]

export function BlogSidebar() {
  const t = useT()
  return (
    <aside className="flex w-full flex-col gap-6 lg:w-[320px] lg:shrink-0">
      <section className="rounded-lg border border-line p-6">
        <h3 className="mb-4 text-base font-medium text-ink">{t('ui.search')}</h3>
        <label className="flex h-11 items-center gap-2 rounded-md border border-line px-3">
          <SearchIcon className="size-5 text-muted" />
          <input
            placeholder={t('ui.search')}
            className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted-400"
          />
        </label>
      </section>

      <section className="rounded-lg border border-line p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-medium text-ink">{t('ui.category')}</h3>
          <ChevronDownIcon className="size-4 -rotate-180 text-muted" />
        </div>
        <div className="flex flex-col gap-3">
          {categories.map((c, i) => (
            <label key={c} className="flex items-center gap-2.5 text-sm text-ink-600">
              <input
                type="checkbox"
                defaultChecked={i === 1}
                className="size-4 rounded-[3px] border border-brand-200 accent-brand"
              />
              {c}
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-line p-6">
        <h3 className="mb-4 text-base font-medium text-ink">{t('ui.recent_post')}</h3>
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <a key={i} href="#" className="flex gap-3">
              <span className="size-16 shrink-0 rounded bg-surface-alt" />
              <span className="flex flex-col gap-1">
                <span className="text-xs text-muted">{t('ui.nov_12_2021_25_comments')}</span>
                <span className="text-sm font-medium text-ink">{t('ui.integer_volutpat_fringilla_ipsum_nec_tempor')}</span>
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-line p-6">
        <h3 className="mb-4 text-base font-medium text-ink">{t('ui.gallery')}</h3>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="aspect-square rounded bg-surface-alt" />
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-line p-6">
        <h3 className="mb-4 text-base font-medium text-ink">{t('ui.popular_tag')}</h3>
        <div className="flex flex-wrap gap-2">
          {tags.map((t, i) => (
            <a
              key={t}
              href="#"
              className={`rounded px-3 py-1.5 text-xs ${
                i === 1
                  ? 'bg-brand text-white'
                  : 'bg-surface-alt text-ink-600 hover:bg-brand-50'
              }`}
            >
              {t}
            </a>
          ))}
        </div>
      </section>
    </aside>
  )
}
