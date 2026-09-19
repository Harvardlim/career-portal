import { en, type TranslationKey } from './en'
import { zh } from './zh'
import { ms } from './ms'
import { id } from './id'
import { th } from './th'
import { vi } from './vi'

export type Locale = 'en' | 'zh' | 'ms' | 'id' | 'th' | 'vi'

/** Phase 1 ships EN / ZH / MS; phase 2 adds ID / TH / VI. All six are wired. */
export const LANGUAGES: { code: Locale; label: string; native: string; phase: 1 | 2 }[] = [
  { code: 'en', label: 'English', native: 'English', phase: 1 },
  { code: 'zh', label: 'Chinese', native: '中文', phase: 1 },
  { code: 'ms', label: 'Malay', native: 'Bahasa Melayu', phase: 1 },
  { code: 'id', label: 'Indonesian', native: 'Bahasa Indonesia', phase: 2 },
  { code: 'th', label: 'Thai', native: 'ไทย', phase: 2 },
  { code: 'vi', label: 'Vietnamese', native: 'Tiếng Việt', phase: 2 },
]

export const DICTIONARIES: Record<Locale, Partial<Record<TranslationKey, string>>> = {
  en,
  zh,
  ms,
  id,
  th,
  vi,
}

export { en }
export type { TranslationKey }
