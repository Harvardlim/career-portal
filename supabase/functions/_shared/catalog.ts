// Server-side price catalog. The client only sends a key ("standard",
// "candidate_yearly", ...) -- amounts, credit counts and term lengths are
// resolved here so a tampered request can't change what gets charged or granted.
// Amounts are in USD cents. Keep in sync with the copy on:
//   web/src/pages/employer/PostJobPricingPage.tsx
//   web/src/pages/dashboard/MembershipPage.tsx

export type CreditPackageKey =
  | 'standard'
  | 'referral'
  | 'repeat_1'
  | 'repeat_2'

export type CreditPackage = {
  key: CreditPackageKey
  label: string
  amount: number // USD cents
  credits: number
  /** first purchase only -- requires NO active employer membership */
  firstTime: boolean
}

export const CREDIT_PACKAGES: Record<CreditPackageKey, CreditPackage> = {
  standard: { key: 'standard', label: 'Standard', amount: 99900, credits: 3, firstTime: true },
  referral: { key: 'referral', label: 'Referral', amount: 49900, credits: 3, firstTime: true },
  repeat_1: { key: 'repeat_1', label: '1st repeat purchase', amount: 39900, credits: 3, firstTime: false },
  repeat_2: { key: 'repeat_2', label: '2nd repeat purchase', amount: 19900, credits: 5, firstTime: false },
}

/** A first credit-package purchase also grants this many days of paying-employer
 *  status, which unlocks the discounted repeat ("add credits") tiers. */
export const EMPLOYER_MEMBERSHIP_DAYS = 365

export type MembershipPlanKey = 'candidate_monthly' | 'candidate_yearly'

export type MembershipPlan = {
  key: MembershipPlanKey
  label: string
  amount: number // USD cents
  period: 'month' | 'year'
  days: number
}

export const MEMBERSHIP_PLANS: Record<MembershipPlanKey, MembershipPlan> = {
  candidate_monthly: {
    key: 'candidate_monthly',
    label: 'Member — Monthly',
    amount: 9900,
    period: 'month',
    days: 30,
  },
  candidate_yearly: {
    key: 'candidate_yearly',
    label: 'Member — Yearly',
    amount: 19900,
    period: 'year',
    days: 365,
  },
}

// Affiliate commission paid to the referrer when a referred user makes their
// first qualifying purchase. USD. Keep in sync with the tiers shown on
// web/src/pages/AffiliatePage.tsx. Packages not listed pay nothing.
export const CREDIT_COMMISSION_USD: Record<CreditPackageKey, number> = {
  standard: 150, // $999
  referral: 99, // $499
  repeat_1: 0,
  repeat_2: 30, // $199
}

export const MEMBERSHIP_COMMISSION_USD: Record<MembershipPlanKey, number> = {
  candidate_monthly: 30, // $99 / month
  candidate_yearly: 70, // $199 / year
}

export function isCreditPackageKey(v: unknown): v is CreditPackageKey {
  return typeof v === 'string' && v in CREDIT_PACKAGES
}

export function isMembershipPlanKey(v: unknown): v is MembershipPlanKey {
  return typeof v === 'string' && v in MEMBERSHIP_PLANS
}
