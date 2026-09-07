import { useEffect, useRef, useState } from 'react'
import { IconChevronDown } from './Icons'

export type Option = { value: string; label: string }

const control =
  'flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-line bg-surface-2 px-3 text-[13px] text-ink transition focus:outline-none'

type Props = {
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  disabled?: boolean
  className?: string
}

/** Custom dropdown: a trigger styled like the text inputs, opening a themed
 *  list panel right below it (instead of the native OS <select> popup). */
export const SelectMenu = ({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  disabled = false,
  className = '',
}: Props) => {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value) ?? null

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((a) => Math.min(a + 1, options.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((a) => Math.max(a - 1, 0))
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const opt = options[active]
        if (opt) {
          onChange(opt.value)
          setOpen(false)
        }
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, options, active, onChange])

  const toggle = () => {
    if (disabled) return
    setActive(Math.max(0, options.findIndex((o) => o.value === value)))
    setOpen((o) => !o)
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`${control} ${open ? 'border-brand-2' : 'hover:border-ink-400'} disabled:opacity-50`}
      >
        <span className={selected ? 'text-ink' : 'text-muted'}>
          {selected ? selected.label : placeholder}
        </span>
        <IconChevronDown
          width={14}
          height={14}
          className={`shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-line bg-surface-2 py-1 shadow-pop"
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value
            return (
              <li key={opt.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-[13px] ${
                    i === active ? 'bg-white/[0.06]' : ''
                  } ${isSelected ? 'text-brand-2' : 'text-ink-200'}`}
                >
                  {opt.label}
                  {isSelected ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 13 4 4L19 7" />
                    </svg>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
