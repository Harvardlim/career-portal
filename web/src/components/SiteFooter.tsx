import { Link } from 'react-router-dom'
import {
  ArrowRightIcon,
  BriefcaseIcon,
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  TwitterIcon,
  YoutubeIcon,
} from '@/components/icons'

type FooterLink = { label: string; active?: boolean; to?: string }

const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Quick Link',
    links: [
      { label: 'About' },
      { label: 'Contact', active: true },
      { label: 'Affiliate Program', to: '/affiliate' },
      { label: 'Blog' },
    ],
  },
  {
    title: 'Candidate',
    links: [
      { label: 'Browse Jobs' },
      { label: 'Browse Employers' },
      { label: 'Candidate Dashboard' },
      { label: 'Saved Jobs' },
    ],
  },
  {
    title: 'Employers',
    links: [
      { label: 'Post a Job' },
      { label: 'Browse Candidates' },
      { label: 'Employers Dashboard' },
      { label: 'Applications' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Faqs' },
      { label: 'Privacy Policy' },
      { label: 'Terms & Conditions' },
    ],
  },
]

const socials = [FacebookIcon, YoutubeIcon, InstagramIcon, TwitterIcon, LinkedinIcon]

export function SiteFooter() {
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto w-full max-w-[1320px] px-6 lg:px-10">
        <div className="grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)] lg:py-25">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <BriefcaseIcon className="size-10 text-white" />
              <span className="text-2xl font-semibold">Partly Asia</span>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-lg">
                <span className="text-ink-600">Call now: </span>
                <span className="font-medium">(319) 555-0115</span>
              </p>
              <p className="max-w-[312px] text-sm text-muted">
                6391 Elgin St. Celina, Delaware 10299, New York, United States of
                America
              </p>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title} className="flex flex-col gap-4">
              <h3 className="text-xl font-medium">{col.title}</h3>
              <ul className="flex flex-col gap-1">
                {col.links.map((link) => {
                  const className = link.active
                    ? 'flex items-center gap-1.5 py-1.5 text-base font-medium text-white'
                    : 'flex items-center gap-1 py-1.5 text-base text-muted-400 transition-colors hover:text-white'
                  const content = (
                    <>
                      {link.active && <ArrowRightIcon className="size-5" />}
                      {link.label}
                    </>
                  )
                  return (
                    <li key={link.label}>
                      {link.to ? (
                        <Link to={link.to} className={className}>
                          {content}
                        </Link>
                      ) : (
                        <a href="#" className={className}>
                          {content}
                        </a>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-[1320px] flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row lg:px-10">
          <p className="text-sm text-muted">
            © 2024 Partly Asia. All rights reserved
          </p>
          <div className="flex items-center gap-3">
            {socials.map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="text-muted transition-colors hover:text-white"
                aria-label="Social media link"
              >
                <Icon className="size-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
