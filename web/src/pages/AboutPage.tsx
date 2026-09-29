import { Breadcrumb } from '@/components/app/Breadcrumb'
import { CtaSection } from '@/components/home/CtaSection'
import {
  ArrowRightIcon,
  BriefcaseIcon,
  BuildingIcon,
  QuoteIcon,
  StarIcon,
  UsersIcon,
} from '@/components/icons'
import { useT } from '@/lib/i18n'

const stats = [
  { value: '1,75,324', label: 'Live Job', Icon: BriefcaseIcon },
  { value: '97,354', label: 'Companies', Icon: BuildingIcon },
  { value: '38,47,154', label: 'Candidates', Icon: UsersIcon },
]

const brands = ['amazon', 'Google', 'ENSIGMA', 'NIO', 'IEE', 'WISE']

const lorem =
  'Praesent non sem facilisis, hendrerit nisi vitae, volutpat quam. Aliquam metus mauris, semper eu eros vitae, blandit tristique metus. Vestibulum maximus nec justo sed maximus.'

export function AboutPage() {
  const t = useT()
  return (
    <>
      <Breadcrumb title={t('ui.about_us')} trail={[{ label: t('ui.home'), to: '/' }, { label: t('ui.about_us') }]} />

      <section className="mx-auto grid w-full max-w-[1320px] gap-12 px-6 py-16 lg:grid-cols-2 lg:px-10">
        <div className="flex flex-col gap-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">{t('ui.who_we_are')}</p>
          <h1 className="text-3xl font-medium leading-tight text-ink lg:text-[40px] lg:leading-[48px]">{t('ui.we_re_highly_skilled_and_professionals')}</h1>
          <p className="max-w-md text-muted-600">{lorem}</p>
        </div>
        <div className="flex flex-col gap-6">
          {stats.map(({ value, label, Icon }) => (
            <div key={label} className="flex items-center gap-4">
              <span className="grid size-14 place-items-center rounded bg-brand-50 text-brand">
                <Icon className="size-7" />
              </span>
              <span className="flex flex-col">
                <span className="text-2xl font-medium text-ink">{value}</span>
                <span className="text-sm text-muted">{label}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-[1320px] flex-wrap items-center justify-between gap-8 px-6 py-8 lg:px-10">
        {brands.map((b) => (
          <span key={b} className="text-xl font-semibold text-muted-slate">
            {b}
          </span>
        ))}
      </div>

      <div className="mx-auto w-full max-w-[1320px] px-6 lg:px-10">
        <div className="h-80 w-full rounded-xl bg-muted-slate/40" />
      </div>

      <section className="mx-auto grid w-full max-w-[1320px] items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:px-10">
        <div className="flex flex-col gap-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">{t('ui.our_mission')}</p>
          <h2 className="text-3xl font-medium leading-tight text-ink lg:text-[40px] lg:leading-[48px]">{t('ui.our_mission_is_help_people_to')}</h2>
          <p className="max-w-md text-muted-600">{lorem}</p>
        </div>
        <div className="h-72 rounded-xl bg-brand-50" />
      </section>

      <section className="bg-surface-alt/60">
        <div className="mx-auto grid w-full max-w-[1320px] items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:px-10">
          <div className="h-72 rounded-xl bg-muted-slate/40" />
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand">{t('ui.testimonial')}</p>
            <h2 className="text-3xl font-medium text-ink lg:text-[40px]">{t('ui.what_our_poeple_says')}</h2>
            <div className="flex gap-0.5 text-star">
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon key={i} className="size-6" />
              ))}
            </div>
            <p className="text-base leading-7 text-muted-600">{t('ui.curabitur_vitae_aliquam_risus_mauris_quis')}</p>
            <div className="flex items-center justify-between">
              <span className="border-l-2 border-brand pl-3">
                <span className="block font-medium text-ink">{t('ui.john_wick')}</span>
                <span className="block text-sm text-muted">{t('ui.creative_director')}</span>
              </span>
              <QuoteIcon className="size-10 text-muted-slate" />
            </div>
            <div className="flex gap-3">
              <button type="button" aria-label={t('ui.previous')} className="rounded bg-brand-50 p-3 text-brand">
                <ArrowRightIcon className="size-5 -scale-x-100" />
              </button>
              <button type="button" aria-label={t('ui.next')} className="rounded bg-brand-50 p-3 text-brand">
                <ArrowRightIcon className="size-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <CtaSection />
    </>
  )
}
