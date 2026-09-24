import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  AudienceToggle,
  CtaButton,
  GoldCircle,
  Headline,
  Section,
  Steps,
  TrustStrip,
} from '@/components/marketing/blocks'
import { CategoryTiles } from '@/components/marketing/CategoryTiles'
import {
  ChartBarIcon,
  CodeIcon,
  DollarIcon,
  FileIcon,
  GearIcon,
  MegaphoneIcon,
  SearchPlusIcon,
  UsersIcon,
} from '@/components/icons'
import { useT } from '@/lib/i18n'
import { useDisplayUser } from '@/lib/useDisplayUser'

// Mirrors the 8 live DB categories — Training rolled into HR, Design rolled into Marketing.
const VERTICALS = [
  { Icon: UsersIcon, label: 'HR' },
  { Icon: CodeIcon, label: 'IT' },
  { Icon: DollarIcon, label: 'Finance' },
  { Icon: MegaphoneIcon, label: 'Marketing' },
  { Icon: FileIcon, label: 'Legal' },
  { Icon: ChartBarIcon, label: 'Sales' },
  { Icon: SearchPlusIcon, label: 'Strategy' },
  { Icon: GearIcon, label: 'Operations' },
]

export function HomePage() {
  const t = useT()
  const { user, loading } = useDisplayUser()
  const [audience, setAudience] = useState<'business' | 'expert'>('business')

  // Signed in: home is the dashboard, not the marketing page.
  if (user) return <Navigate to={user.dashboardPath} replace />
  if (loading) return null

  return (
    <>
      {/* Split hero: copy + CTA left, vertical icon grid right */}
      <Section tone="alt">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
          <div className="flex flex-col gap-6">
            <Headline>{t('hero.headline')}</Headline>
            <p className="max-w-[560px] text-lg leading-7 text-ink-600">{t('hero.sub')}</p>
            <div className="flex flex-wrap gap-3">
              <CtaButton to="/employer/post-need">{t('hero.ctaPrimary')}</CtaButton>
              <CtaButton to="/needs" variant="outline">
                {t('hero.ctaSecondary')}
              </CtaButton>
            </div>
            <div className="pt-2">
              <AudienceToggle value={audience} onChange={setAudience} />
              <p className="mt-3 max-w-[520px] text-sm text-ink-600">
                {audience === 'business' ? t('biz.sub') : t('exp.sub')}
              </p>
              <Link
                to={audience === 'business' ? '/for-businesses' : '/for-experts'}
                className="mt-2 inline-block text-sm font-medium text-brand hover:underline"
              >
                {audience === 'business' ? t('nav.businesses') : t('nav.experts')} →
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-3 sm:gap-4">
            {VERTICALS.map(({ Icon, label }) => (
              <Link
                to="/categories"
                key={label}
                className="flex flex-col items-center gap-2 rounded-xl border border-line bg-surface p-3 text-center transition-shadow hover:shadow-card"
              >
                <GoldCircle size={44}>
                  <Icon className="size-5" />
                </GoldCircle>
                <span className="text-xs font-medium text-navy">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </Section>

      {/* Trust strip in place of client logos */}
      <Section className="!py-0">
        <div className="-mt-8 pb-12">
          <TrustStrip />
        </div>
      </Section>

      {/* How it works, in place of a featured-jobs grid */}
      <Section>
        <h2 className="mb-8 text-2xl font-semibold text-navy">{t('how.title')}</h2>
        <Steps
          compact
          steps={[
            { title: t('how.step1'), body: t('biz.step1.body') },
            { title: t('how.step2'), body: t('biz.step2.body') },
            { title: t('how.step3'), body: t('biz.step3.body') },
            { title: t('how.step4'), body: t('biz.step4.body') },
          ]}
        />
      </Section>

      <Section tone="alt">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold text-navy">{t('home.verticals')}</h2>
          <Link to="/categories" className="text-sm font-medium text-brand hover:underline">
            {t('nav.categories')} →
          </Link>
        </div>
        <CategoryTiles audience="both" />
      </Section>

      <Section tone="navy">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <Headline light>{t('pay.headline')}</Headline>
            <p className="mt-4 max-w-[520px] text-white/80">{t('pay.sub')}</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <CtaButton to="/employer/post-need">{t('biz.cta')}</CtaButton>
            <CtaButton to="/how-it-works" variant="outline" className="border-white/30 text-white hover:bg-white/10">
              {t('footer.pricing')}
            </CtaButton>
          </div>
        </div>
      </Section>
    </>
  )
}
