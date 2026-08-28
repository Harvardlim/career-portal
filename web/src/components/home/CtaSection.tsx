import { ArrowRightIcon } from '@/components/icons'

export function CtaSection() {
  return (
    <section className="bg-surface">
      <div className="mx-auto grid w-full max-w-[1320px] gap-6 px-6 py-20 md:grid-cols-2 lg:px-10 lg:py-25">
        <div className="flex flex-col gap-6 rounded-xl bg-line p-8 lg:p-[50px]">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-medium leading-10 text-ink-heading">
              Become a Candidate
            </h2>
            <p className="max-w-[312px] text-sm leading-5 text-muted-600/80">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras
              cursus a dolor convallis efficitur.
            </p>
          </div>
          <a
            href="#"
            className="flex w-fit items-center gap-3 rounded-[3px] bg-surface px-6 py-3 text-base font-semibold text-brand"
          >
            Register now
            <ArrowRightIcon className="size-6" />
          </a>
        </div>

        <div className="flex flex-col gap-6 rounded-xl bg-brand-600 p-8 text-white lg:p-[50px]">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-medium leading-10">
              Become a Employers
            </h2>
            <p className="max-w-[312px] text-sm leading-5 text-white/80">
              Cras in massa pellentesque, mollis ligula non, luctus dui. Morbi
              sed efficitur dolor. Pelque augue risus, aliqu.
            </p>
          </div>
          <a
            href="#"
            className="flex w-fit items-center gap-3 rounded-[3px] bg-surface px-6 py-3 text-base font-semibold text-brand"
          >
            Register now
            <ArrowRightIcon className="size-6" />
          </a>
        </div>
      </div>
    </section>
  )
}
