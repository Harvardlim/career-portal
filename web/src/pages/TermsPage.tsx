import { Link } from 'react-router-dom'
import { Breadcrumb } from '@/components/app/Breadcrumb'

const LAST_UPDATED = 'September 22, 2026'

type Section = {
  id: string
  num: string
  title: string
  intro?: string
  body: string[]
  bullets?: string[]
}

// Modelled on how JobStreet (SEEK), Fiverr and fractional-talent marketplaces
// (Toptal, Upwork) structure their marketplace terms: definitions up front,
// a clear "we are the matchmaker, not the employer" disclaimer, the fee
// mechanic spelled out in plain language, a circumvention clause, and
// standard disclaimers/liability/termination sections at the end.
const sections: Section[] = [
  {
    id: 'acceptance',
    num: '1.',
    title: 'Acceptance of these Terms',
    body: [
      'These Terms & Conditions ("Terms") govern access to and use of partly.asia (the "Platform"), operated by partly.asia ("we", "us", "our"). By creating an account, posting a project, applying to a project, or otherwise using the Platform, you agree to be bound by these Terms and our Privacy Policy.',
      'If you are registering on behalf of a company, you confirm you have the authority to bind that company to these Terms, and "you" refers to that company as well as to you personally.',
      'If you do not agree to these Terms, do not use the Platform.',
    ],
  },
  {
    id: 'definitions',
    num: '2.',
    title: 'Definitions',
    body: [
      'To keep the rest of these Terms readable, a few platform-specific words are used throughout:',
    ],
    bullets: [
      '"Business" — a company or individual registered to post projects ("Postings") and hire Experts.',
      '"Expert" — an individual registered to apply to Postings and be matched to Businesses.',
      '"Posting" — a project, role, or need a Business publishes on the Platform.',
      '"Match" — one of up to 10 Experts the matching algorithm shortlists for a given Posting.',
      '"Release" — a Business’s decision to release its contact details to one or more Matches.',
      '"Unlock" — an Expert’s payment of the fixed fee that reveals a Business’s contact details after a Release, and shares the Expert’s own contact details with that Business in return.',
      '"Verified Badge" — an optional, paid, annually-renewed credential badge available to Experts and Businesses.',
    ],
  },
  {
    id: 'eligibility',
    num: '3.',
    title: 'Eligibility & Accounts',
    body: [
      'You must be at least 18 years old and capable of forming a binding contract to use the Platform.',
      'Experts must be based in Singapore, Malaysia, Indonesia, Thailand, Vietnam, or the Philippines, and must provide accurate identity information as part of registration (see Section 6). Businesses may be based anywhere in the world.',
      'You agree to provide accurate, current, and complete information when registering and to keep it up to date. You are responsible for all activity under your account and for keeping your login credentials confidential. Notify us immediately if you suspect unauthorised use of your account.',
      'One account per individual or company. Creating duplicate accounts to evade a suspension, re-apply after removal, or manipulate matching is a violation of these Terms.',
    ],
  },
  {
    id: 'marketplace-model',
    num: '4.',
    title: 'The Platform Is a Matching Marketplace',
    body: [
      'partly.asia is a technology platform that helps Businesses and Experts find each other. We are not an employer, staffing agency, or recruiter, and we are not a party to any engagement, contract, or agreement a Business and an Expert enter into. Any work arrangement — scope, deliverables, rate, payment terms, and legal relationship (including whether it is an independent contractor or any other arrangement) — is agreed directly between the Business and the Expert, off-platform, and is solely their responsibility.',
      'We do not guarantee that a Posting will receive applicants, that a Business will release contact to any Expert, that a released Expert will unlock the contact, or that any engagement will result from a Match. Matching is based on the information both sides provide us and is not a verification of skill, character, or fit for a specific role.',
      'partly.asia is a matching service only. We do not sell, ship, handle, warehouse, or take title to any physical goods, and we are not a party to the sale, delivery, or exchange of any physical product. If a Posting or engagement happens to involve physical goods (for example, materials an Expert needs to complete a project), that exchange is arranged and fulfilled entirely between the Business and the Expert, off-platform, and partly.asia has no responsibility for it.',
    ],
  },
  {
    id: 'postings-matching',
    num: '5.',
    title: 'Posting & Matching',
    body: [
      'Posting a project and browsing open needs is free for Businesses. Applying to a Posting is free for Experts and is always the Expert’s own opt-in — we do not perform cold outreach to Experts on a Business’s behalf.',
      'For each Posting, our matching algorithm shortlists a maximum of 10 Experts. This is a hard cap: if a Business does not release contact to any of its 10 Matches, no further Matches are ever surfaced for that Posting. This scarcity rule is intentional and cannot be reset by contacting support.',
      'A Business may release contact to one or more of its 10 Matches at the same time. Every Expert who is released contact is told, transparently, whether the Business released contact to other Experts for the same Posting.',
      'A Business may close a Posting at any time. Closing a Posting immediately ends every outstanding payment window for that Posting (see Section 7) and notifies affected Experts that the lead has gone cold, with no charge to them.',
    ],
  },
  {
    id: 'verification',
    num: '6.',
    title: 'Verification',
    body: [
      'Basic identity verification for Experts is free and self-serve: you provide the last 4 characters of a recognised local identification document (NRIC/FIN, MyKad, KTP, Thai National ID, or CCCD, depending on your country). These characters are encrypted before storage and are never displayed back to you, to any Business, or to any third party.',
      'Businesses must provide a valid business registration number, which our team reviews against an uploaded registration document before the Business can post a project.',
      'The optional Verified Badge (Section 9) is a stricter, paid credential tier: it additionally requires an uploaded identity document (for Experts) or an approved registration document (for Businesses), reviewed by our team. Badge holders are prioritised in match ranking. A Verified Badge is a marker of document review, not a guarantee of an Expert’s skills, a Business’s legitimacy, or the outcome of any engagement.',
      'We reserve the right to request additional verification information at any time and to suspend an account pending review.',
    ],
  },
  {
    id: 'fees',
    num: '7.',
    title: 'Contact Release, Unlock & Fees',
    intro: 'This is the core of how money moves on partly.asia, so we spell it out precisely:',
    body: [
      'When a Business releases contact to an Expert, that Expert has a 2-day window to pay a fixed fee to Unlock the Business’s contact details. The fee is fixed per country and displayed before payment; it is charged in the Expert’s local currency as listed, or in USD if the Expert chooses that option (a fixed exchange cost is already built into the USD price — see Section 8).',
      'If the Expert unlocks within the window, full contact details are exchanged in both directions and remain visible on the Platform for 5 calendar days. All further negotiation and engagement happens off-platform, directly between the Business and the Expert.',
      'If the Expert does not unlock within the 2-day window, the lead simply goes cold. No payment is ever taken, and there is nothing to refund — this is treated as a normal part of the process, not an error or a broken transaction.',
      'Businesses never pay to post, browse, or release contact. The fee is charged only to the Expert, and only once a Business has shown real interest by releasing contact.',
    ],
    bullets: [
      'For security and to keep the process fair for everyone, refer to a released lead only through the Platform while the contact window is open — do not ask a counterpart to move the conversation off-platform, or attempt to identify and contact a Business or Expert before a Release, in order to avoid the fee. We may suspend accounts that circumvent this process.',
      'partly.asia has no visibility into and no responsibility for what happens after contact is unlocked and the conversation moves off-platform.',
    ],
  },
  {
    id: 'payments',
    num: '8.',
    title: 'Payments',
    body: [
      'All payments are processed by Stripe, a third-party payment processor. We do not store your full card number. By making a payment you also agree to Stripe’s terms of service.',
      'Local-currency prices shown on the Platform are fixed per market and are not live-converted from USD at checkout. If you choose to pay in USD instead of your local currency, the USD price already reflects the forex cost we absorb; paying in local currency does not.',
      'All fees are quoted exclusive of any taxes that may apply in your jurisdiction; you are responsible for any such taxes.',
    ],
  },
  {
    id: 'verified-badge',
    num: '9.',
    title: 'Verified Badge Subscription',
    body: [
      'The Verified Badge is an optional, annual credential available to Experts and Businesses at a fixed fee per country, payable in local currency or USD.',
      'The Verified Badge does not auto-renew and you are never charged automatically at the end of a term — you choose to renew, and renewing extends your existing term rather than starting a new one.',
      'For Experts, the badge requires an uploaded identity document. Payment is taken first; the badge activates once our team approves the document. If the document is rejected, contact support — no additional badge fee is owed for a re-review.',
      'For Businesses, the badge requires an already-approved business registration document before purchase.',
    ],
  },
  {
    id: 'affiliate',
    num: '10.',
    title: 'Affiliate / Referral Program',
    body: [
      'Businesses, Experts, and third parties may enrol in our affiliate program and generate a personal referral link. Attribution is first-click and permanent: once someone signs up through your link, you are credited as their referrer for as long as their account exists.',
      'You earn a fixed, local-currency commission when a person you referred buys or renews a Verified Badge (recurring, every year it renews) or successfully unlocks a released lead (one-time, per lead). Commission amounts are shown on our pricing pages and may change for future events without affecting commissions already earned.',
      'You must share your referral link yourself, through your own channels (WhatsApp, LinkedIn, email, etc.) — partly.asia never contacts a referred person on your behalf, and you may not misrepresent your relationship to partly.asia when sharing it, use paid advertising containing our trademarks without permission, or spam.',
      'Payouts are made in USD, less applicable foreign-exchange and transaction fees, once your accrued balance clears the minimum payout threshold shown in your affiliate dashboard. We may withhold or reverse commissions obtained through fraud, self-referral, or violation of these Terms.',
    ],
  },
  {
    id: 'no-employment',
    num: '11.',
    title: 'No Employment Relationship',
    body: [
      'Nothing on the Platform creates an employment, agency, partnership, or joint-venture relationship between partly.asia and any Business or Expert, or between a Business and an Expert. Experts engaged through the Platform act as independent parties; classification, tax withholding, statutory benefits, and compliance with local labour law are the responsibility of the Business and Expert who enter into an engagement, not of partly.asia.',
    ],
  },
  {
    id: 'conduct',
    num: '12.',
    title: 'User Conduct',
    intro: 'You agree not to, and not to attempt to:',
    body: [],
    bullets: [
      'Provide false, misleading, or someone else’s identity, registration, or verification information.',
      'Circumvent the Release/Unlock fee mechanic described in Section 7.',
      'Post a Posting or profile for anything other than a genuine business need or genuine expertise.',
      'Harass, threaten, discriminate against, or abuse another user.',
      'Scrape, mine, or systematically extract data from the Platform.',
      'Use the Platform to send unsolicited commercial messages (spam).',
      'Interfere with the Platform’s security, availability, or normal operation, including through automated access (bots) not authorised by us.',
      'Violate any applicable law, or infringe the intellectual property or other rights of any person.',
    ],
  },
  {
    id: 'content',
    num: '13.',
    title: 'Content & Intellectual Property',
    body: [
      'You retain ownership of the content you submit (profile details, Postings, portfolio links, uploaded documents). By submitting content, you grant partly.asia a worldwide, royalty-free licence to host, display, and use it to operate and promote the Platform — for example, showing your profile to a matched counterpart, or your headline on a public "Hire me" page you choose to publish.',
      'The Platform itself — including its software, design, trademarks, and the "partly.asia" name and logo — is owned by us or our licensors and may not be copied, modified, or used without our written permission.',
      'Verification documents you upload (identity documents, business registration documents) are used solely for the review described in Section 6 and are never displayed publicly.',
    ],
  },
  {
    id: 'reporting',
    num: '14.',
    title: 'Reporting & Moderation',
    body: [
      'Any user, and any visitor, may report a Posting, Business, or Expert profile they believe violates these Terms or is fraudulent, misleading, or abusive. We review reports and may take action including removing content, suspending, or terminating an account, at our discretion. Filing a report does not notify the reported party of who filed it.',
    ],
  },
  {
    id: 'suspension',
    num: '15.',
    title: 'Suspension & Termination',
    body: [
      'We may suspend or terminate your account, remove a Posting, or restrict access to the Platform, with or without notice, if we believe you have violated these Terms, provided false information, engaged in fraud or abuse, or for any other reason at our reasonable discretion, including to protect the safety or interests of other users.',
      'A suspended Business account has all of its active Postings suspended and hidden from public view at the same time; reinstating the Business does not automatically restore each Posting, which is reviewed individually.',
      'You may close your own account at any time from your account settings. Closing your account does not entitle you to a refund of fees already paid for services already rendered (e.g., a contact already unlocked).',
      'Sections of these Terms that by their nature should survive termination (including Sections 4, 7, 11, 16, 17, 18, and 19) continue to apply after your account is closed.',
    ],
  },
  {
    id: 'disclaimers',
    num: '16.',
    title: 'Disclaimers',
    body: [
      'The Platform is provided "as is" and "as available", without warranties of any kind, whether express, implied, or statutory, including implied warranties of merchantability, fitness for a particular purpose, and non-infringement.',
      'We do not warrant that the Platform will be uninterrupted, secure, or error-free, or that any Match, Release, or engagement will meet your expectations. Verification (Section 6) reduces but does not eliminate risk; you are responsible for your own due diligence before entering any engagement.',
    ],
  },
  {
    id: 'liability',
    num: '17.',
    title: 'Limitation of Liability',
    body: [
      'To the maximum extent permitted by law, partly.asia and its officers, employees, and agents will not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, revenue, data, or business opportunity, arising from or related to your use of the Platform or any engagement between a Business and an Expert.',
      'To the maximum extent permitted by law, our total aggregate liability to you for any claim arising out of or relating to these Terms or the Platform will not exceed the total fees you paid to partly.asia in the 12 months preceding the event giving rise to the claim.',
      'Nothing in these Terms limits liability that cannot be limited under applicable law.',
    ],
  },
  {
    id: 'indemnification',
    num: '18.',
    title: 'Indemnification',
    body: [
      'You agree to indemnify and hold partly.asia harmless from any claim, loss, or expense (including reasonable legal fees) arising from your breach of these Terms, your content, your engagement with another user, or your violation of any law or third-party right.',
    ],
  },
  {
    id: 'governing-law',
    num: '19.',
    title: 'Governing Law & Disputes',
    body: [
      'These Terms are governed by the laws of Singapore, without regard to conflict-of-laws principles. Any dispute arising out of or relating to these Terms or the Platform will be subject to the exclusive jurisdiction of the courts of Singapore, except where mandatory local consumer-protection law gives you the right to bring a claim in your own country of residence.',
    ],
  },
  {
    id: 'changes',
    num: '20.',
    title: 'Changes to These Terms',
    body: [
      'We may update these Terms from time to time. If we make material changes, we will provide reasonable notice (for example, by email or an in-app notice) before they take effect. Continuing to use the Platform after changes take effect means you accept the updated Terms.',
    ],
  },
  {
    id: 'contact',
    num: '21.',
    title: 'Contact Us',
    body: [
      'Questions about these Terms can be sent to our support team via the ',
    ],
  },
]

export function TermsPage() {
  return (
    <>
      <Breadcrumb
        title="Terms & Conditions"
        trail={[{ label: 'Home', to: '/' }, { label: 'Terms & Conditions' }]}
      />
      <div className="mx-auto grid w-full max-w-[1320px] gap-12 px-6 py-16 lg:grid-cols-[1fr_260px] lg:px-10">
        <div className="flex flex-col gap-12">
          <div>
            <p className="text-sm text-muted">Last updated: {LAST_UPDATED}</p>
            <p className="mt-3 rounded-md bg-brand-50 px-4 py-3 text-sm leading-6 text-brand-800">
              This draft is written to match how partly.asia actually works today. It is provided as a starting
              point for your own legal counsel to review before it is relied on commercially — it is not legal
              advice.
            </p>
          </div>

          {sections.map((s) => (
            <section key={s.id} id={s.id} className="flex flex-col gap-4 scroll-mt-24">
              <h2 className="text-2xl font-medium text-ink">
                {s.num} {s.title}
              </h2>
              {s.intro && <p className="text-base leading-7 text-muted-600">{s.intro}</p>}
              {s.body.map((p, i) => {
                const isLast = i === s.body.length - 1
                return (
                  <p key={i} className="text-base leading-7 text-muted-600">
                    {p}
                    {isLast && s.id === 'contact' && (
                      <>
                        <Link to="/contact" className="font-medium text-brand hover:underline">
                          Contact page
                        </Link>
                        .
                      </>
                    )}
                  </p>
                )
              })}
              {s.bullets && s.bullets.length > 0 && (
                <ul className="flex flex-col gap-3">
                  {s.bullets.map((b) => (
                    <li
                      key={b}
                      className="flex gap-3 text-sm text-muted-600 before:mt-2 before:size-1.5 before:shrink-0 before:rounded-full before:bg-muted-slate"
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <p className="text-sm leading-6 text-muted">
            See also our{' '}
            <Link to="/privacy" className="font-medium text-brand hover:underline">
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link to="/trust" className="font-medium text-brand hover:underline">
              Trust &amp; Verification
            </Link>{' '}
            pages for more detail on verification and data handling.
          </p>
        </div>

        <nav className="hidden lg:block">
          <div className="sticky top-6">
            <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-400">Table of contents</p>
            <ul className="flex max-h-[calc(100vh-6rem)] flex-col gap-3 overflow-y-auto text-sm">
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-ink-600 hover:text-brand">
                    {s.num} {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
    </>
  )
}
