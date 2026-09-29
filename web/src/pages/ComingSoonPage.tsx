import { Link } from 'react-router-dom'
import {
  ArrowRightIcon,
  BriefcaseIcon,
  FacebookIcon,
  InstagramIcon,
  MailIcon,
  TwitterIcon,
  YoutubeIcon,
} from '@/components/icons'
import { useT } from '@/lib/i18n'

const socials = [FacebookIcon, TwitterIcon, InstagramIcon, YoutubeIcon]

export function ComingSoonPage() {
  const t = useT()
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="mx-auto w-full max-w-[1320px] px-6 py-8 lg:px-10">
        <Link to="/" className="flex items-center gap-2">
          <BriefcaseIcon className="size-9 text-brand" />
          <span className="text-2xl font-semibold text-ink">{t('ui.partly_asia')}</span>
        </Link>
      </header>

      <main className="mx-auto grid w-full max-w-[1320px] flex-1 items-center gap-12 px-6 py-12 lg:grid-cols-2 lg:px-10">
        <div className="flex min-w-0 flex-col gap-6">
          <h1 className="text-4xl font-medium leading-tight text-ink lg:text-5xl">{t('ui.our_website_is_under_construction')}</h1>
          <p className="max-w-sm text-muted-600">{t('ui.in_ac_turpis_mi_donec_quis')}</p>
          <form onSubmit={(e) => e.preventDefault()} className="flex max-w-md gap-3">
            <span className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-md border border-line px-3">
              <MailIcon className="size-5 text-muted" />
              <input
                placeholder={t('ui.email_address_2')}
                className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted-400"
              />
            </span>
            <button
              type="submit"
              className="flex shrink-0 items-center gap-2 rounded-[4px] bg-brand px-6 py-3 text-sm font-semibold text-white"
            >{t('ui.subscribe')}<ArrowRightIcon className="size-4" />
            </button>
          </form>
        </div>
        <div className="h-72 rounded-xl bg-brand-50" />
      </main>

      <footer className="mx-auto flex w-full max-w-[1320px] flex-col gap-4 px-6 py-10 lg:flex-row lg:items-end lg:justify-between lg:px-10">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink">{t('ui.follow_us')}</p>
          <div className="flex gap-2">
            {socials.map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label={t('ui.social_link')}
                className={`grid size-9 place-items-center rounded ${
                  i === 1 ? 'bg-brand text-white' : 'bg-brand-50 text-brand'
                }`}
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
        <p className="text-sm text-muted">{t('ui.partly_asia_all_rights_reserved', { v: new Date().getFullYear() })}</p>
      </footer>
    </div>
  )
}
