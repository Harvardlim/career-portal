import { CtaButton, Eyebrow, FeeTable, Headline, Section, Steps } from '@/components/marketing/blocks'
import { CategoryTiles } from '@/components/marketing/CategoryTiles'
import { useT } from '@/lib/i18n'
import { usePricing } from '@/lib/partly'

export function ForExpertsPage() {
  const t = useT()
  const { pricing } = usePricing()
  return (
    <>
      <Section tone="alt">
        <div className="flex max-w-3xl flex-col gap-6">
          <Eyebrow>{t('nav.experts')}</Eyebrow>
          <Headline>{t('exp.headline')}</Headline>
          <p className="text-lg leading-7 text-ink-600">{t('exp.sub')}</p>
          <div className="flex flex-wrap gap-3">
            <CtaButton to="/create-account">{t('exp.cta')}</CtaButton>
            <CtaButton to="/needs" variant="outline">
              {t('exp.browse')}
            </CtaButton>
          </div>
        </div>
      </Section>

      <Section>
        <h2 className="mb-8 text-2xl font-semibold text-navy">{t('how.title')}</h2>
        <Steps
          steps={[
            { title: t('exp.step1.title'), body: t('exp.step1.body') },
            { title: t('exp.step2.title'), body: t('exp.step2.body') },
            { title: t('exp.step3.title'), body: t('exp.step3.body') },
            { title: t('exp.step4.title'), body: t('exp.step4.body') },
          ]}
        />
        <div className="mt-10 rounded-xl border border-gold/40 bg-gold-50 p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-gold">Trust</p>
          <p className="mt-2 text-navy">{t('exp.trust')}</p>
        </div>
      </Section>

      <Section tone="alt">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="text-2xl font-semibold text-navy">{t('pay.table.title')}</h2>
            <p className="mt-3 text-ink-600">{t('pay.table.note')}</p>
            <p className="mt-3 text-sm text-muted">{t('pay.badge.note')}</p>
          </div>
          <FeeTable pricing={pricing} />
        </div>
      </Section>

      <Section>
        <h2 className="mb-8 text-2xl font-semibold text-navy">{t('home.verticals')}</h2>
        <CategoryTiles audience="expert" />
      </Section>

      <Section tone="navy">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <Headline light>{t('exp.headline')}</Headline>
          <CtaButton to="/create-account">{t('exp.cta')}</CtaButton>
        </div>
      </Section>
    </>
  )
}
