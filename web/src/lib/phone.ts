import { validatePhone } from '@/lib/partly'

/**
 * Per-country phone rules. The form shows the dial code as a fixed prefix and
 * the user types only the national number; it is stored in the database as
 * digits with the country code and no "+" or separators (e.g. 60123456789).
 *
 * `national` matches the number as dialled from abroad: no country code and
 * no leading trunk "0" (Malaysia 012-345 6789 -> 123456789).
 */
type PhoneRule = { name: string; dial: string; national: RegExp; example: string; trunkZero: boolean }

const RULES: Record<string, PhoneRule> = {
  SG: { name: 'Singapore', dial: '65', national: /^[3689]\d{7}$/, example: '9123 4567', trunkZero: false },
  MY: { name: 'Malaysia', dial: '60', national: /^(?:1\d{8,9}|[3-9]\d{7,8})$/, example: '12-345 6789', trunkZero: true },
  ID: { name: 'Indonesia', dial: '62', national: /^(?:8\d{8,11}|[2-7]\d{7,10})$/, example: '812-3456-7890', trunkZero: true },
  TH: { name: 'Thailand', dial: '66', national: /^(?:[689]\d{8}|[2-7]\d{7})$/, example: '81 234 5678', trunkZero: true },
  VN: { name: 'Vietnam', dial: '84', national: /^(?:[35789]\d{8}|2\d{9})$/, example: '91 234 5678', trunkZero: true },
  PH: { name: 'the Philippines', dial: '63', national: /^(?:9\d{9}|2\d{7,8}|[3-8]\d{8,9})$/, example: '917 123 4567', trunkZero: true },
}

export function hasPhoneRule(country: string | null | undefined): boolean {
  return !!country && country in RULES
}

/** "+60" for MY; empty for a country we have no rule for. */
export function dialPrefix(country: string | null | undefined): string {
  return country && RULES[country] ? `+${RULES[country].dial}` : ''
}

export function phoneExample(country: string | null | undefined): string {
  return country && RULES[country] ? RULES[country].example : ''
}

/** Digits of the national number: separators, a pasted "+CC" and the trunk "0" removed. */
function nationalDigits(rule: PhoneRule, raw: string): string {
  const v = raw.trim()
  let digits = v.replace(/\D/g, '')
  if (v.startsWith('+') && digits.startsWith(rule.dial)) digits = digits.slice(rule.dial.length)
  if (rule.trunkZero && digits.startsWith('0')) digits = digits.slice(1)
  // Pasted with the country code but without the "+" (60123456789).
  if (!rule.national.test(digits) && digits.startsWith(rule.dial)) {
    let rest = digits.slice(rule.dial.length)
    if (rule.trunkZero && rest.startsWith('0')) rest = rest.slice(1)
    if (rule.national.test(rest)) return rest
  }
  return digits
}

/** Error message for the national number typed for `country`, or null when it's valid. */
export function validateCountryPhone(country: string | null | undefined, raw: string): string | null {
  const rule = country ? RULES[country] : undefined
  if (!rule) return validatePhone(raw) // no rule for this country: generic international check
  const v = raw.trim()
  if (!v) return 'Enter a phone number.'
  if (!/^\+?[0-9\s().-]+$/.test(v)) return 'Use digits only ,  spaces, dashes and brackets are fine.'
  if (!rule.national.test(nationalDigits(rule, v))) {
    return `Enter a valid ${rule.name} phone number without the +${rule.dial}, e.g. ${rule.example}.`
  }
  return null
}

/** The value written to the database: country code + national number, digits only. */
export function toStoredPhone(country: string | null | undefined, raw: string): string {
  const rule = country ? RULES[country] : undefined
  if (!rule) return raw.replace(/\D/g, '')
  return rule.dial + nationalDigits(rule, raw)
}

/**
 * What to show in the input for a stored number. Handles the new digits-only
 * format and older free-text values ("+65 6123 4567", "012-345 6789").
 */
export function nationalFromStored(country: string | null | undefined, stored: string | null | undefined): string {
  const rule = country ? RULES[country] : undefined
  const v = (stored ?? '').trim()
  if (!rule || !v) return v
  const digits = v.replace(/\D/g, '')
  if (digits.startsWith(rule.dial) && rule.national.test(nationalDigits(rule, digits.slice(rule.dial.length)))) {
    return nationalDigits(rule, digits.slice(rule.dial.length))
  }
  return nationalDigits(rule, v)
}

/** Reads a stored number back for display: "60123456789" -> "+60123456789". */
export function formatStoredPhone(stored: string | null | undefined): string {
  const v = (stored ?? '').trim()
  return /^\d{8,15}$/.test(v) ? `+${v}` : v
}
