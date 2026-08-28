import { ArrowRightIcon, BriefcaseIcon, MapPinIcon } from '@/components/icons'

type Company = {
  name: string
  location: string
  logoBg: string
  featured?: boolean
  lightLogo?: boolean
  active?: boolean
}

const base: Company[] = [
  { name: 'Dribbble', location: 'United States', logoBg: '#ea4c89', featured: true },
  { name: 'Upwork', location: 'United States', logoBg: '#6fda44' },
  { name: 'Slack', location: 'China', logoBg: '#edeff5', lightLogo: true },
  { name: 'Freepik', location: 'United States', logoBg: '#1e60c6' },
]

const companies: Company[] = [
  ...base.map((c, i) => ({ ...c, active: i === 2 })),
  ...base,
]

export function TopCompaniesSection() {
  return (
    <section className="bg-surface">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-12 px-6 pb-20 lg:gap-[50px] lg:px-10 lg:pb-25">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-3xl font-medium text-ink lg:text-[40px] lg:leading-[48px]">
            Top companies
          </h2>
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Previous"
              className="rounded-[5px] bg-brand-50 p-3 text-brand"
            >
              <ArrowRightIcon className="size-6 -scale-x-100" />
            </button>
            <button
              type="button"
              aria-label="Next"
              className="rounded-[5px] bg-brand-50 p-3 text-brand"
            >
              <ArrowRightIcon className="size-6" />
            </button>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {companies.map((c, i) => (
            <article
              key={`${c.name}-${i}`}
              className={`flex flex-col items-start gap-8 rounded-xl border p-8 ${
                c.active ? 'border-brand shadow-feature' : 'border-line-soft'
              }`}
            >
              <div className="flex items-start gap-4">
                <span
                  className="flex size-14 shrink-0 items-center justify-center rounded"
                  style={{ backgroundColor: c.logoBg }}
                >
                  <BriefcaseIcon
                    className={`size-6 ${c.lightLogo ? 'text-ink' : 'text-white'}`}
                  />
                </span>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium text-ink-heading">
                      {c.name}
                    </h3>
                    {c.featured && (
                      <span className="rounded-full bg-danger-50 px-3 py-0.5 text-sm text-danger">
                        Featured
                      </span>
                    )}
                  </div>
                  <span className="flex items-center gap-1.5 text-sm text-muted-slate">
                    <MapPinIcon className="size-[18px]" />
                    {c.location}
                  </span>
                </div>
              </div>
              <a
                href="#"
                className={`w-full rounded-[3px] px-6 py-3 text-center text-base font-semibold transition-colors ${
                  c.active
                    ? 'bg-brand text-white hover:bg-brand-600'
                    : 'bg-brand-50 text-brand hover:bg-brand-100'
                }`}
              >
                Open Position
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
