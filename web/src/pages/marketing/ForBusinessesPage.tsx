import { CtaButton, Eyebrow, Headline, Section, Steps } from '@/components/marketing/blocks'
import { CategoryTiles } from '@/components/marketing/CategoryTiles'
import { useT } from '@/lib/i18n'

export function ForBusinessesPage() {
  const t = useT()
  return (
    <>
      <Section tone="alt">
        <div className="flex max-w-3xl flex-col gap-6">
          <Eyebrow>{t('nav.businesses')}</Eyebrow>
          <Headline>{t('biz.headline')}</Headline>
          <p className="text-lg leading-7 text-ink-600">{t('biz.sub')}</p>
          <div>
            <CtaButton to="/employer/post-need">{t('biz.cta')}</CtaButton>
          </div>
        </div>
      </Section>

      <Section>
        <h2 className="mb-8 text-2xl font-semibold text-navy">{t('how.title')}</h2>
        <Steps
          steps={[
            { title: t('biz.step1.title'), body: t('biz.step1.body') },
            { title: t('biz.step2.title'), body: t('biz.step2.body') },
            { title: t('biz.step3.title'), body: t('biz.step3.body') },
            { title: t('biz.step4.title'), body: t('biz.step4.body') },
          ]}
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-gold/40 bg-gold-50 p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-gold">Trust</p>
            <p className="mt-2 text-navy">{t('biz.trust')}</p>
          </div>
          <div className="rounded-xl border border-line bg-cream p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted">Your matches</p>
            <p className="mt-2 text-navy">
              You see up to 10 matched experts per posting — a fixed shortlist, not a rolling feed.{' '}
              <em>{t('biz.scarcity')}</em>
            </p>
          </div>
        </div>
      </Section>

      <Section tone="alt">
        <h2 className="mb-8 text-2xl font-semibold text-navy">{t('home.verticals')}</h2>
        <CategoryTiles audience="business" />
      </Section>

      <Section tone="navy">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <Headline light>{t('biz.headline')}</Headline>
          <CtaButton to="/employer/post-need">{t('biz.cta')}</CtaButton>
        </div>
      </Section>
    </>
  )
}
