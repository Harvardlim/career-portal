import { useRef, useState, type UIEvent } from 'react'
import { Link } from 'react-router-dom'

const sections = [
  {
    title: 'Consent',
    to: null as string | null,
    paragraphs: [
      'By continuing, you consent to partly.asia collecting the information you submit in this form and using it to process your registration, match you with relevant projects or experts, and contact you about your submission.',
      'You may withdraw this consent at any time by contacting our support team, after which we will stop using your data for new matches.',
    ],
  },
  {
    title: 'Terms & Conditions',
    to: '/terms',
    paragraphs: [
      'Use of partly.asia is subject to these terms. You agree to provide accurate information and to keep your account details up to date.',
      'partly.asia acts as a marketplace connecting businesses and independent experts and is not a party to any engagement agreed between them. Experts pay a fixed fee only to unlock a contact a business has released; nothing is ever charged for a lead that goes cold. We may suspend or remove a listing or registration that violates these terms.',
    ],
  },
  {
    title: 'Privacy Policy',
    to: '/privacy',
    paragraphs: [
      'We store the information you provide securely and only exchange contact details between a business and an expert after the business has released contact and the expert has unlocked it. Identity-document digits are encrypted and never displayed to anyone.',
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
        {sections.map(({ title, to, paragraphs }) => (
          <div key={title} className="flex flex-col gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
              {title}
              {to && (
                <Link to={to} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-brand hover:underline">
                  Read full policy
                </Link>
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
            through partly.asia. You can opt out at any time.
          </span>
        </span>
      </label>
    </div>
  )
}
