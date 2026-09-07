import { useId, useState } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { ArrowRightIcon, EyeIcon, EyeOffIcon } from '@/components/icons'

/* ---------- Input field ---------- */

type AuthFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label: string
  password?: boolean
  size?: 'md' | 'lg'
}

export function AuthField({
  label,
  password = false,
  size = 'md',
  type = 'text',
  className,
  ...rest
}: AuthFieldProps) {
  const id = useId()
  const [reveal, setReveal] = useState(false)
  const resolvedType = password ? (reveal ? 'text' : 'password') : type

  return (
    <div className={`relative w-full ${className ?? ''}`}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type={resolvedType}
        placeholder={label}
        className={`w-full rounded-[5px] border border-line bg-surface text-ink outline-none transition-colors placeholder:text-muted focus:border-brand ${
          size === 'lg'
            ? 'h-16 px-8 text-lg leading-7'
            : 'h-12 px-[17px] text-base leading-6'
        } ${password ? 'pr-12' : ''}`}
        {...rest}
      />
      {password && (
        <button
          type="button"
          onClick={() => setReveal((v) => !v)}
          aria-label={reveal ? 'Hide password' : 'Show password'}
          className="absolute right-[17px] top-1/2 -translate-y-1/2 text-muted"
        >
          {reveal ? (
            <EyeOffIcon className="size-[22px]" />
          ) : (
            <EyeIcon className="size-[22px]" />
          )}
        </button>
      )}
    </div>
  )
}

/* ---------- Submit button ---------- */

export function AuthSubmit({
  children,
  disabled,
}: {
  children: ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="flex w-full items-center justify-center gap-3 rounded-[4px] bg-brand px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
      <ArrowRightIcon className="size-6" />
    </button>
  )
}

/* ---------- Checkbox ---------- */

export function AuthCheckbox({
  children,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { children: ReactNode }) {
  const id = useId()
  return (
    <div className="flex items-center gap-2.5">
      <input
        id={id}
        type="checkbox"
        className="size-5 shrink-0 rounded-[3px] border border-brand-200 text-brand accent-brand"
        {...rest}
      />
      <label htmlFor={id} className="text-sm text-muted">
        {children}
      </label>
    </div>
  )
}
