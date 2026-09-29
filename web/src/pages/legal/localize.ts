import type { Locale } from '@/locales'
import type { LegalOverride } from './terms.zh'

/** Overlays a language's translated title/intro/body/bullets on the English sections, matched by id. */
export function localizeSections<T extends { id: string }>(
  base: T[],
  locale: Locale,
  zh: Record<string, LegalOverride>,
  ms: Record<string, LegalOverride>,
): T[] {
  const table = locale === 'zh' ? zh : locale === 'ms' ? ms : null
  if (!table) return base
  return base.map((s) => ({ ...s, ...(table[s.id] ?? {}) }))
}
