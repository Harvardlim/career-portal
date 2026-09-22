import { Link } from 'react-router-dom'
import { BriefcaseIcon, LinkedinIcon } from '@/components/icons'
import { LanguageSwitcher } from '@/components/app/LanguageSwitcher'
import { useT } from '@/lib/i18n'

export function SiteFooter() {
  const t = useT()

  const columns = [
    {
      title: t('footer.business'),
      links: [
        { label: t('nav.businesses'), to: '/for-businesses' },
        { label: t('nav.postFree'), to: '/employer/post-need' },
        { label: t('nav.categories'), to: '/categories' },
        { label: t('footer.pricing'), to: '/how-it-works' },
      ],
    },
    {
      title: t('footer.expert'),
      links: [
        { label: t('nav.experts'), to: '/for-experts' },
        { label: t('exp.browse'), to: '/needs' },
        { label: t('exp.cta'), to: '/create-account' },
        { label: t('share.badge.text'), to: '/dashboard/hire-me' },
      ],
    },
    {
      title: t('footer.company'),
      links: [
        { label: t('footer.trust'), to: '/trust' },
        { label: t('footer.affiliate'), to: '/affiliate' },
        { label: t('footer.contact'), to: '/contact' },
        { label: t('footer.terms'), to: '/terms' },
        { label: t('footer.privacy'), to: '/privacy' },
      ],
    },
  ]

  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto w-full max-w-[1320px] px-6 lg:px-10">
        <div className="grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <BriefcaseIcon className="size-10 text-white" />
              <span className="text-2xl font-semibold">
                partly<span className="text-amber-400">.asia</span>
              </span>
            </div>
            <p className="max-w-[312px] text-sm text-muted">{t('footer.tagline')}</p>
            <div className="text-muted">
              <LanguageSwitcher />
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title} className="flex flex-col gap-4">
              <h3 className="text-lg font-medium">{col.title}</h3>
              <ul className="flex flex-col gap-1">
                {col.links.map((link) => (
                  <li key={link.to + link.label}>
                    <Link to={link.to} className="block py-1.5 text-sm text-muted-400 transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-[1320px] flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row lg:px-10">
          <p className="text-sm text-muted">{t('footer.rights', { year: new Date().getFullYear() })}</p>
          <a href="https://www.linkedin.com/" className="text-muted transition-colors hover:text-white" aria-label="LinkedIn">
            <LinkedinIcon className="size-5" />
          </a>
        </div>
      </div>
    </footer>
  )
}
