import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DICTIONARIES, LANGUAGES, en, type Locale, type TranslationKey } from '@/locales'

const STORAGE_KEY = 'partly-lang'

type I18n = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18n | null>(null)

let activeLocale: Locale = 'en'

function interpolate(raw: string, vars?: Record<string, string | number>) {
  if (!vars) return raw
  return raw.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`))
}

/** Locale in use right now, for plain (non-React) code such as lib/ helpers. */
export function currentLocale(): Locale {
  return activeLocale
}

const INTL_LOCALES: Record<Locale, string> = { en: 'en-US', zh: 'zh-CN', ms: 'ms-MY', id: 'id-ID', th: 'th-TH', vi: 'vi-VN' }

/** BCP-47 tag for Intl / toLocaleDateString in the active language. */
export function intlLocale(): string {
  return INTL_LOCALES[activeLocale]
}

/**
 * Translate outside React. Reads the locale the provider last rendered with,
 * so call it while rendering (or in event handlers), never at module load.
 */
export function tr(key: TranslationKey, vars?: Record<string, string | number>): string {
  return interpolate(DICTIONARIES[activeLocale][key] ?? en[key] ?? key, vars)
}

function detect(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && LANGUAGES.some((l) => l.code === saved)) return saved as Locale
  } catch {
    /* storage unavailable */
  }
  const nav = (navigator.language || 'en').toLowerCase()
  const hit = LANGUAGES.find((l) => nav.startsWith(l.code))
  return hit?.code ?? 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => detect())
  activeLocale = locale

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {
      /* storage unavailable */
    }
  }, [])

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      return interpolate(DICTIONARIES[locale][key] ?? en[key] ?? key, vars)
    },
    [locale],
  )

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <LanguageProvider>')
  return ctx
}

export function useT() {
  return useI18n().t
}
