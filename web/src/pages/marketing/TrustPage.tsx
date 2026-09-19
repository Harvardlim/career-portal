import { CheckIcon } from '@/components/icons'
import { Eyebrow, Faq, GoldCircle, Headline, Section } from '@/components/marketing/blocks'
import { useT } from '@/lib/i18n'

/** Replaces the generic "About us" page with the trust & verification explainer. */
export function TrustPage() {
  const t = useT()
  const panels = [
    {
      title: t('trust.business.title'),
      body: t('trust.business.body'),
      points: [t('trust.business.point1'), t('trust.business.point2'), t('trust.business.point3')],
    },
    {
      title: t('trust.expert.title'),
      body: t('trust.expert.body'),
      points: [t('trust.expert.point1'), t('trust.expert.point2'), t('trust.expert.point3')],
    },
  ]
  const faq = [1, 2, 3, 4, 5, 6].map((i) => ({
    q: t(`faq.q${i}` as 'faq.q1'),
    a: t(`faq.a${i}` as 'faq.a1'),
  }))

  return (
    <>
      <Section tone="alt">
        <div className="flex max-w-3xl flex-col gap-6">
          <Eyebrow>{t('footer.trust')}</Eyebrow>
          <Headline>{t('trust.headline')}</Headline>
        </div>
      </Section>

      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          {panels.map((p) => (
            <div key={p.title} className="rounded-2xl border border-line bg-cream p-8">
              <h2 className="text-xl font-semibold text-navy">{p.title}</h2>
              <p className="mt-3 text-ink-600">{p.body}</p>
              <ul className="mt-5 flex flex-col gap-3">
                {p.points.map((pt) => (
                  <li key={pt} className="flex items-center gap-3 text-sm text-navy">
                    <GoldCircle size={28}>
                      <CheckIcon className="size-4" />
                    </GoldCircle>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="alt">
        <h2 className="mb-6 text-2xl font-semibold text-navy">{t('faq.title')}</h2>
        <div className="max-w-3xl">
          <Faq items={faq} />
        </div>
      </Section>
    </>
  )
}
