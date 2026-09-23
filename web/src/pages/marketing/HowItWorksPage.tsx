import { useEffect, useState } from 'react'
import { CtaButton, Eyebrow, FeeTable, Headline, Section, Steps } from '@/components/marketing/blocks'
import { SelectMenu } from '@/components/app/SelectMenu'
import { useT } from '@/lib/i18n'
import { COUNTRY_NAMES, EXPERT_COUNTRIES, formatLocal, formatUsd, usePricing } from '@/lib/partly'

const TZ_TO_COUNTRY: Record<string, string> = {
  'Asia/Singapore': 'SG',
  'Asia/Kuala_Lumpur': 'MY',
  'Asia/Kuching': 'MY',
  'Asia/Jakarta': 'ID',
  'Asia/Makassar': 'ID',
  'Asia/Jayapura': 'ID',
  'Asia/Bangkok': 'TH',
  'Asia/Ho_Chi_Minh': 'VN',
  'Asia/Saigon': 'VN',
}

function guessCountry(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (TZ_TO_COUNTRY[tz]) return TZ_TO_COUNTRY[tz]
    const lang = navigator.language.toUpperCase()
    const hit = EXPERT_COUNTRIES.find((c) => lang.endsWith(`-${c}`))
    if (hit) return hit
  } catch {
    /* fall through */
  }
  return 'SG'
}

/** "How Payment Works" — replaces the template's subscription pricing table. */
export function HowItWorksPage() {
  const t = useT()
  const { pricing } = usePricing()
  const [country, setCountry] = useState('SG')
  useEffect(() => setCountry(guessCountry()), [])
  const current = pricing.find((p) => p.code === country)

  return (
    <>
      <Section tone="alt">
        <div className="flex max-w-3xl flex-col gap-6">
          <Eyebrow>{t('footer.pricing')}</Eyebrow>
          <Headline>{t('pay.headline')}</Headline>
          <p className="text-lg leading-7 text-ink-600">{t('pay.sub')}</p>
        </div>
      </Section>

      <Section>
        <Steps
          steps={[
            { title: t('pay.step1.title'), body: t('pay.step1.body') },
            { title: t('pay.step2.title'), body: t('pay.step2.body') },
            { title: t('pay.step3.title'), body: t('pay.step3.body') },
          ]}
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {[t('pay.compare1'), t('pay.compare2')].map((c) => (
            <div key={c} className="rounded-xl border border-line bg-cream p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-gold">vs. the alternative</p>
              <p className="mt-2 text-lg font-medium text-navy">“{c}”</p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="alt">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-semibold text-navy">{t('pay.table.title')}</h2>
            {current && (
              <div className="rounded-xl border border-gold/40 bg-surface p-5">
                <p className="text-sm text-muted">
                  {t('pay.detect', { country: COUNTRY_NAMES[current.code] ?? current.name })}
                  <SelectMenu
                    value={country}
                    onChange={setCountry}
                    options={pricing.map((p) => ({ value: p.code, label: COUNTRY_NAMES[p.code] ?? p.name }))}
                    className="ml-1 mt-2 inline-flex w-56 align-middle"
                  />
                </p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted">{t('pay.table.lead')}</p>
                    <p className="text-2xl font-semibold text-navy">{formatLocal(current, current.lead_fee_local)}</p>
                    <p className="text-xs text-muted">or {formatUsd(current.lead_fee_usd)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted">{t('pay.table.badge')}</p>
                    <p className="text-2xl font-semibold text-navy">{formatLocal(current, current.badge_fee_local)}</p>
                    <p className="text-xs text-muted">or {formatUsd(current.badge_fee_usd)}</p>
                  </div>
                </div>
              </div>
            )}
            <p className="text-sm text-ink-600">{t('pay.table.note')}</p>
            <p className="text-sm text-muted">{t('pay.badge.note')}</p>
          </div>
          <FeeTable pricing={pricing} selected={country} onSelect={setCountry} />
        </div>
      </Section>

      <Section tone="navy">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <Headline light>{t('trust.pay')}</Headline>
          <div className="flex flex-wrap gap-3">
            <CtaButton to="/employer/post-need">{t('biz.cta')}</CtaButton>
            <CtaButton to="/create-account" variant="outline" className="border-white/30 text-white hover:bg-white/10">
              {t('exp.cta')}
            </CtaButton>
          </div>
        </div>
      </Section>
    </>
  )
}
