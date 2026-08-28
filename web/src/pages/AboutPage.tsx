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

const stats = [
  { value: '1,75,324', label: 'Live Job', Icon: BriefcaseIcon },
  { value: '97,354', label: 'Companies', Icon: BuildingIcon },
  { value: '38,47,154', label: 'Candidates', Icon: UsersIcon },
]

const brands = ['amazon', 'Google', 'ENSIGMA', 'NIO', 'IEE', 'WISE']

const lorem =
  'Praesent non sem facilisis, hendrerit nisi vitae, volutpat quam. Aliquam metus mauris, semper eu eros vitae, blandit tristique metus. Vestibulum maximus nec justo sed maximus.'

export function AboutPage() {
  return (
    <>
      <Breadcrumb title="About us" trail={[{ label: 'Home', to: '/' }, { label: 'About us' }]} />

      <section className="mx-auto grid w-full max-w-[1320px] gap-12 px-6 py-16 lg:grid-cols-2 lg:px-10">
        <div className="flex flex-col gap-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            Who we are
          </p>
          <h1 className="text-3xl font-medium leading-tight text-ink lg:text-[40px] lg:leading-[48px]">
            We&rsquo;re highly skilled and professionals team.
          </h1>
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
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            Our Mission
          </p>
          <h2 className="text-3xl font-medium leading-tight text-ink lg:text-[40px] lg:leading-[48px]">
            Our mission is help people to find the perfect job.
          </h2>
          <p className="max-w-md text-muted-600">{lorem}</p>
        </div>
        <div className="h-72 rounded-xl bg-brand-50" />
      </section>

      <section className="bg-surface-alt/60">
        <div className="mx-auto grid w-full max-w-[1320px] items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:px-10">
          <div className="h-72 rounded-xl bg-muted-slate/40" />
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand">
              Testimonial
            </p>
            <h2 className="text-3xl font-medium text-ink lg:text-[40px]">
              What our poeple says
            </h2>
            <div className="flex gap-0.5 text-star">
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon key={i} className="size-6" />
              ))}
            </div>
            <p className="text-base leading-7 text-muted-600">
              &ldquo;Curabitur vitae aliquam risus. Mauris quis vehicula nisl, sed
              commodo ipsum. Praesent semper diam ut diam elementum, ut
              scelerisque nibh ultrices ultrices. Integer faucibus porttitor
              vehicula. Maecenas venenatis dictum ligula.&rdquo;
            </p>
            <div className="flex items-center justify-between">
              <span className="border-l-2 border-brand pl-3">
                <span className="block font-medium text-ink">John Wick</span>
                <span className="block text-sm text-muted">Creative Director</span>
              </span>
              <QuoteIcon className="size-10 text-muted-slate" />
            </div>
            <div className="flex gap-3">
              <button type="button" aria-label="Previous" className="rounded bg-brand-50 p-3 text-brand">
                <ArrowRightIcon className="size-5 -scale-x-100" />
              </button>
              <button type="button" aria-label="Next" className="rounded bg-brand-50 p-3 text-brand">
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
