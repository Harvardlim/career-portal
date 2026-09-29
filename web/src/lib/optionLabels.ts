import { tr } from './i18n'
import { categoryLabel } from './categoryNames'
import { COUNTRY_NAMES_EN, countryName } from './partly'
import type { TranslationKey } from '@/locales'

// Dropdown values are stored in English (they go to the database as-is), so only
// the label shown is translated. Unknown values pass through unchanged.
const COUNTRY_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_NAMES_EN)
    .filter(([code]) => code !== 'OTHER')
    .map(([code, name]) => [name, code]),
)

const KEY: Record<string, TranslationKey> = {
  'Select...': 'opt.select',
  'High School': 'opt.high_school',
  Diploma: 'opt.diploma',
  'Bachelor Degree': 'opt.bachelor',
  'Master Degree': 'opt.master',
  PhD: 'opt.phd',
  Male: 'opt.male',
  Female: 'opt.female',
  Other: 'country.other',
  Freshers: 'opt.freshers',
  '1 - 2 Years': 'opt.exp_1_2',
  '2 - 4 Years': 'opt.exp_2_4',
  '4 - 6 Years': 'opt.exp_4_6',
  '6 - 8 Years': 'opt.exp_6_8',
  '8 - 10 Years': 'opt.exp_8_10',
  '10 - 15 Years': 'opt.exp_10_15',
  '15+ Years': 'opt.exp_15',
  Monthly: 'opt.monthly',
  Weekly: 'opt.weekly',
  Hours: 'opt.hours',
  'Project Basis': 'opt.project_basis',
  'On-site': 'opt.onsite',
  Hybrid: 'opt.hybrid',
  Remote: 'opt.remote',
  Hourly: 'opt.hourly',
  Yearly: 'opt.yearly',
  Project: 'opt.project',
  'Human Resources': 'cat.full.hr',
  'Information Technology': 'cat.full.it',
  'Sales & Business Development': 'cat.full.sales',
  'Strategy & Management Consulting': 'cat.full.strategy',
  Technology: 'ind.tech',
  'Fintech / Payments': 'ind.fintech',
  Finance: 'cat.name.finance',
  Healthcare: 'ind.health',
  Retail: 'ind.retail',
  Education: 'ind.education',
  Manufacturing: 'ind.manufacturing',
  Media: 'ind.media',
  HR: 'cat.name.hr',
  IT: 'cat.name.it',
  Marketing: 'cat.name.marketing',
  Legal: 'cat.name.legal',
  Sales: 'cat.name.sales',
  Strategy: 'cat.name.strategy',
  Operations: 'cat.name.operations',
  pending: 'opt.st_pending',
  earned: 'opt.st_earned',
  paid: 'opt.st_paid',
}

export function optionLabel(value: string): string {
  const code = COUNTRY_CODE[value]
  if (code) return countryName(code)
  const key = KEY[value]
  return key ? tr(key) : categoryLabel(value)
}

const BADGE_STATUSES = ['pending', 'awaiting_review', 'active', 'superseded', 'expired', 'cancelled']

/** Badge purchase status → translated label (unknown statuses pass through). */
export function badgeStatusLabel(status: string): string {
  return BADGE_STATUSES.includes(status) ? tr(`badge.st.${status}` as TranslationKey) : status
}
