import { useEffect, useRef, useState } from 'react'
import { ChevronDownIcon, GlobeIcon } from '@/components/icons'
import { useI18n } from '@/lib/i18n'
import { LANGUAGES } from '@/locales'

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0]

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('lang.label')}
        className="flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink"
      >
        <GlobeIcon className="size-4" />
        {compact ? current.code.toUpperCase() : current.native}
        <ChevronDownIcon className="size-4" />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-30 mt-2 w-48 overflow-hidden rounded-md border border-line bg-surface py-1 shadow-lg"
        >
          {LANGUAGES.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                role="option"
                aria-selected={l.code === locale}
                onClick={() => {
                  setLocale(l.code)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-surface-alt ${
                  l.code === locale ? 'font-medium text-brand' : 'text-ink'
                }`}
              >
                <span>{l.native}</span>
                {l.phase === 2 && <span className="text-[10px] uppercase text-muted-400">{t('lang.comingSoon')}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
