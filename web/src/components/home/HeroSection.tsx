import { MapPinIcon, SearchIcon } from '@/components/icons'

const suggestions = [
  { label: 'Designer,', highlight: false },
  { label: 'Programing,', highlight: false },
  { label: 'Digital Marketing,', highlight: true },
  { label: 'Video,', highlight: false },
  { label: 'Animation.', highlight: false },
]

export function HeroSection() {
  return (
    <section className="bg-surface-alt/60">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col items-center gap-12 px-6 py-16 lg:flex-row lg:justify-between lg:gap-8 lg:py-[109px] lg:px-10">
        <div className="flex w-full flex-col gap-8 lg:max-w-[652px]">
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl font-medium leading-tight text-ink sm:text-5xl lg:text-[56px] lg:leading-[64px]">
              Find a job that suits your interest &amp; skills.
            </h1>
            <p className="max-w-[536px] text-lg leading-7 text-ink-600">
              Aliquam vitae turpis in diam convallis finibus in at risus. Nullam
              in scelerisque leo, eget sollicitudin velit bestibulum.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-3 shadow-[0px_12px_20px_rgba(0,44,109,0.04)] sm:flex-row sm:items-center"
            >
              <div className="flex h-14 flex-1 items-center gap-3 px-3">
                <SearchIcon className="size-6 shrink-0 text-brand" />
                <input
                  type="text"
                  placeholder="Job tittle, Keyword..."
                  className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted-400"
                />
              </div>
              <span className="hidden h-8 w-px shrink-0 bg-line sm:block" />
              <div className="flex h-14 items-center gap-3 px-3 sm:w-[224px]">
                <MapPinIcon className="size-6 shrink-0 text-brand" />
                <input
                  type="text"
                  placeholder="Your Location"
                  className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted-400"
                />
              </div>
              <button
                type="submit"
                className="shrink-0 rounded bg-brand px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-brand-600"
              >
                Find Job
              </button>
            </form>

            <p className="text-sm text-muted-400">
              Suggestion:{' '}
              {suggestions.map((s, i) => (
                <span
                  key={s.label}
                  className={s.highlight ? 'font-medium text-brand' : 'text-ink-700'}
                >
                  {s.label}
                  {i < suggestions.length - 1 ? ' ' : ''}
                </span>
              ))}
            </p>
          </div>
        </div>

        <div className="w-full max-w-[492px] shrink-0">
          <img
            src="/figma/hero-illustration.png"
            alt="Illustration of a person searching for a job on a laptop"
            className="h-auto w-full"
            width={492}
            height={382}
          />
        </div>
      </div>
    </section>
  )
}
