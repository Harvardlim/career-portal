import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDownIcon } from '@/components/icons'

export type DropdownOption = { value: string; label: string }

/** A styled select: a trigger button with an options list that opens below it. */
export function Dropdown({
  value,
  options,
  onChange,
  placeholder = 'Select…',
  icon,
  className = '',
  align = 'left',
}: {
  value: string
  options: DropdownOption[]
  onChange: (value: string) => void
  placeholder?: string
  icon?: ReactNode
  className?: string
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-left"
      >
        {icon}
        <span className={`flex-1 truncate ${current ? 'text-ink' : 'text-muted-400'}`}>
          {current ? current.label : placeholder}
        </span>
        <ChevronDownIcon
          className={`size-5 shrink-0 text-muted transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className={`absolute top-[calc(100%+8px)] z-30 max-h-72 w-full overflow-auto rounded-lg border border-line bg-surface py-2 shadow-[0px_12px_40px_rgba(0,44,109,0.12)] ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {options.map((o) => (
            <li key={o.value} role="option" aria-selected={o.value === value}>
              <button
                type="button"
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
                className={`flex w-full items-center px-4 py-2 text-left text-sm transition-colors hover:bg-surface-alt ${
                  o.value === value ? 'font-medium text-brand' : 'text-ink-600'
                }`}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
