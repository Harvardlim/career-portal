import { Link } from 'react-router-dom'
import { Eyebrow, GoldCircle, Headline, Section } from '@/components/marketing/blocks'
import { CategoryTiles } from '@/components/marketing/CategoryTiles'
import { CircleCheckIcon, UsersIcon } from '@/components/icons'
import { useT } from '@/lib/i18n'

export function CategoriesPage() {
  const t = useT()
  return (
    <>
      <Section tone="alt">
        <div className="flex max-w-3xl flex-col gap-6">
          <Eyebrow>{t('nav.categories')}</Eyebrow>
          <Headline>{t('cat.headline')}</Headline>
          <p className="text-lg leading-7 text-ink-600">{t('cat.sub')}</p>
        </div>
        {/* Dual entry point: categories serve both audiences differently */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Link
            to="/employer/post-need"
            className="flex items-center gap-4 rounded-xl border border-line bg-surface p-5 transition-shadow hover:shadow-card"
          >
            <GoldCircle>
              <UsersIcon className="size-5" />
            </GoldCircle>
            <span className="font-medium text-navy">{t('cat.entry.business')} →</span>
          </Link>
          <Link
            to="/needs"
            className="flex items-center gap-4 rounded-xl border border-line bg-surface p-5 transition-shadow hover:shadow-card"
          >
            <GoldCircle>
              <CircleCheckIcon className="size-5" />
            </GoldCircle>
            <span className="font-medium text-navy">{t('cat.entry.expert')} →</span>
          </Link>
        </div>
      </Section>
      <Section>
        <CategoryTiles audience="both" />
      </Section>
    </>
  )
}
