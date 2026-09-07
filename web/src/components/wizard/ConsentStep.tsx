import { useRef, useState, type UIEvent } from 'react'

const sections = [
  {
    title: 'Consent',
    paragraphs: [
      'By continuing, you consent to Partly Asia collecting the information you submit in this form and using it to process your registration, match you with relevant opportunities, and contact you about your submission.',
      'You may withdraw this consent at any time by contacting our support team, after which we will stop using your data for new matches.',
    ],
  },
  {
    title: 'Terms & Conditions',
    paragraphs: [
      'Use of Partly Asia is subject to these terms. You agree to provide accurate information and to keep your account details up to date.',
      'Partly Asia acts as a marketplace connecting candidates and employers and is not a party to any employment agreement formed between them. We may suspend or remove a listing or registration that violates these terms.',
    ],
  },
  {
    title: 'Privacy Policy',
    paragraphs: [
      'We store the information you provide securely and only share it with the counterpart relevant to your registration (employers for candidate profiles, and vice versa).',
      'We do not sell your personal data. You can request a copy of your data or ask us to delete it at any time by contacting our support team.',
    ],
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
        {sections.map(({ title, paragraphs }) => (
          <div key={title} className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-ink">{title}</h3>
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
        <span>
          I have read and agree to the Consent, Terms &amp; Conditions, and Privacy
          Policy above.
        </span>
      </label>
      {!hasRead && (
        <p className="text-xs text-muted">
          Scroll to the end of the panel above to enable this checkbox.
        </p>
      )}

      <label className="flex items-start gap-2.5 rounded-md border border-line bg-surface-alt/40 p-4 text-sm text-ink-600">
        <input
          type="checkbox"
          checked={referralOptIn}
          onChange={(e) => onReferralOptInChange(e.target.checked)}
          className="mt-0.5 size-5 shrink-0 rounded-[3px] border border-brand-200 text-brand accent-brand"
        />
        <span>
          <span className="font-medium text-ink">Join our Referral Program</span>
          <span className="block text-muted-600">
            Optional — opt in to earn rewards when people you refer are placed
            through Partly Asia. You can opt out at any time.
          </span>
        </span>
      </label>
    </div>
  )
}
