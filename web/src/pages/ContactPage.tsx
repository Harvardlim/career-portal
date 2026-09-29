import { Breadcrumb } from '@/components/app/Breadcrumb'
import { ArrowRightIcon, MailIcon } from '@/components/icons'
import { useT } from '@/lib/i18n'

export function ContactPage() {
  const t = useT()
  return (
    <>
      <Breadcrumb title={t('ui.contact')} trail={[{ label: t('ui.home'), to: '/' }, { label: t('ui.contact') }]} />

      <section className="mx-auto grid w-full max-w-[1320px] items-start gap-12 px-6 py-16 lg:grid-cols-2 lg:px-10">
        <div className="flex flex-col gap-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">{t('ui.who_we_are')}</p>
          <h1 className="text-3xl font-medium leading-tight text-ink lg:text-[40px] lg:leading-[48px]">{t('ui.we_care_about_customer_services')}</h1>
          <p className="max-w-md text-muted-600">{t('ui.want_to_chat_we_d_love')}</p>
          <button
            type="button"
            className="w-fit rounded-[4px] bg-brand px-6 py-3 text-base font-semibold text-white"
          >{t('ui.email_support')}</button>
        </div>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col gap-4 rounded-xl border border-line p-8 shadow-feature"
        >
          <h2 className="text-xl font-medium text-ink">{t('ui.get_in_touch')}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              placeholder={t('ui.name')}
              className="h-12 rounded-md border border-line px-4 text-base text-ink outline-none focus:border-brand placeholder:text-muted-400"
            />
            <input
              placeholder={t('ui.email')}
              className="h-12 rounded-md border border-line px-4 text-base text-ink outline-none focus:border-brand placeholder:text-muted-400"
            />
          </div>
          <input
            placeholder={t('ui.subjects')}
            className="h-12 rounded-md border border-line px-4 text-base text-ink outline-none focus:border-brand placeholder:text-muted-400"
          />
          <textarea
            rows={5}
            placeholder={t('ui.message')}
            className="resize-none rounded-md border border-line p-4 text-base text-ink outline-none focus:border-brand placeholder:text-muted-400"
          />
          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-[4px] bg-brand px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-brand-600"
          >{t('ui.send_message')}<ArrowRightIcon className="size-5" />
          </button>
        </form>
      </section>

      <div className="h-[360px] w-full bg-brand-50" aria-hidden />

      <section className="bg-brand-800 text-white">
        <div className="mx-auto flex w-full max-w-[1320px] flex-col items-center justify-between gap-8 px-6 py-12 lg:flex-row lg:px-10">
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex w-full max-w-md gap-3"
          >
            <span className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-md bg-white/10 px-3">
              <MailIcon className="size-5 text-white/70" />
              <input
                placeholder={t('ui.email_address')}
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/60"
              />
            </span>
            <button
              type="submit"
              className="shrink-0 rounded-[4px] bg-brand px-6 py-3 text-sm font-semibold text-white"
            >{t('ui.subscribe')}</button>
          </form>
          <div className="flex gap-6 sm:gap-10">
            {[
              ['1,75,324', t('ct.jobs')],
              ['97,354', t('ct.companies')],
              ['38,47,154', t('ct.candidates')],
            ].map(([v, l]) => (
              <span key={l} className="flex flex-col">
                <span className="text-xl font-medium">{v}</span>
                <span className="text-sm text-white/70">{l}</span>
              </span>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
