import { useRef, useState, type UIEvent } from 'react'
import { Link } from 'react-router-dom'
import { tr, useT } from '@/lib/i18n'

const getSections = () => [
  {
    title: tr('consent.t1'),
    to: null as string | null,
    paragraphs: [tr('consent.p1a'), tr('consent.p1b')],
  },
  {
    title: tr('consent.t2'),
    to: '/terms',
    paragraphs: [tr('consent.p2a'), tr('consent.p2b')],
  },
  {
    title: tr('consent.t3'),
    to: '/privacy',
    paragraphs: [tr('consent.p3a'), tr('consent.p3b')],
  },
]

export function ConsentStep({
  checked,
  onChange,
  referralOptIn,
  onReferralOptInChange,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  referralOptIn: boolean
  onReferralOptInChange: (optedIn: boolean) => void
}) {
  const t = useT()
  const sections = getSections()
  const [hasRead, setHasRead] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  function handleScroll(e: UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 16) {
      setHasRead(true)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex h-72 flex-col gap-6 overflow-y-auto rounded-md border border-line p-5 text-sm leading-6 text-muted-600"
      >
        {sections.map(({ title, to, paragraphs }) => (
          <div key={title} className="flex flex-col gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
              {title}
              {to && (
                <Link to={to} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-brand hover:underline">{t('ui.read_full_policy')}</Link>
              )}
            </h3>
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        ))}
      </div>

      <label
        className={`flex items-start gap-2.5 text-sm ${
          hasRead ? 'text-ink-600' : 'text-muted-400'
        }`}
      >
        <input
          type="checkbox"
          required
          disabled={!hasRead}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 size-5 shrink-0 rounded-[3px] border border-brand-200 text-brand accent-brand disabled:cursor-not-allowed disabled:opacity-50"
        />
        <span>{t('ui.i_have_read_and_agree_to')}</span>
      </label>
      {!hasRead && (
        <p className="text-xs text-muted">{t('ui.scroll_to_the_end_of_the')}</p>
      )}

      <label className="flex items-start gap-2.5 rounded-md border border-line bg-surface-alt/40 p-4 text-sm text-ink-600">
        <input
          type="checkbox"
          checked={referralOptIn}
          onChange={(e) => onReferralOptInChange(e.target.checked)}
          className="mt-0.5 size-5 shrink-0 rounded-[3px] border border-brand-200 text-brand accent-brand"
        />
        <span>
          <span className="font-medium text-ink">{t('ui.join_our_referral_program')}</span>
          <span className="block text-muted-600">{t('ui.optional_opt_in_to_earn_rewards')}</span>
        </span>
      </label>
    </div>
  )
}
