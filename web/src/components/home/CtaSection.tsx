import { Link } from 'react-router-dom'
import { ArrowRightIcon } from '@/components/icons'
import { useT } from '@/lib/i18n'

export function CtaSection() {
  const t = useT()
  return (
    <section className="bg-surface">
      <div className="mx-auto grid w-full max-w-[1320px] gap-6 px-6 py-20 md:grid-cols-2 lg:px-10 lg:py-25">
        <div className="flex flex-col gap-6 rounded-xl bg-line p-8 lg:p-[50px]">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-medium leading-10 text-ink-heading">{t('ui.become_a_candidate')}</h2>
            <p className="max-w-[312px] text-sm leading-5 text-muted-600/80">{t('ui.lorem_ipsum_dolor_sit_amet_consectetur')}</p>
          </div>
          <Link
            to="/candidate/register"
            className="flex w-fit items-center gap-3 rounded-[3px] bg-surface px-6 py-3 text-base font-semibold text-brand"
          >{t('ui.register_now')}<ArrowRightIcon className="size-6" />
          </Link>
        </div>

        <div className="flex flex-col gap-6 rounded-xl bg-brand-600 p-8 text-white lg:p-[50px]">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-medium leading-10">{t('ui.become_a_employers')}</h2>
            <p className="max-w-[312px] text-sm leading-5 text-white/80">{t('ui.cras_in_massa_pellentesque_mollis_ligula')}</p>
          </div>
          <Link
            to="/employer/register"
            className="flex w-fit items-center gap-3 rounded-[3px] bg-surface px-6 py-3 text-base font-semibold text-brand"
          >{t('ui.register_now')}<ArrowRightIcon className="size-6" />
          </Link>
        </div>
      </div>
    </section>
  )
}
