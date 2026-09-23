import { useState } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import {
  CalendarIcon,
  EyeIcon,
  EyeOffIcon,
  UploadIcon,
} from '@/components/icons'
import { SelectMenu } from '@/components/app/SelectMenu'

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm text-ink">{label}</span>
      {children}
    </label>
  )
}

export function TextInput({
  icon,
  className,
  type = 'text',
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  icon?: ReactNode
  className?: string
}) {
  const [reveal, setReveal] = useState(false)
  const isPassword = type === 'password'
  const resolvedType = isPassword && reveal ? 'text' : type

  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
          {icon}
        </span>
      )}
      <input
        type={resolvedType}
        className={`h-12 w-full rounded-md border border-line bg-surface text-base text-ink outline-none focus:border-brand placeholder:text-muted-400 ${
          icon ? 'pl-10' : 'pl-4'
        } ${isPassword ? 'pr-11' : 'pr-4'} ${className ?? ''}`}
        {...rest}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setReveal((v) => !v)}
          aria-label={reveal ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
        >
          {reveal ? (
            <EyeOffIcon className="size-5" />
          ) : (
            <EyeIcon className="size-5" />
          )}
        </button>
      )}
    </div>
  )
}

/**
 * The dashboard form's dropdown — a thin adapter over the app-wide SelectMenu
 * so every select in the product shares one look and one keyboard behaviour.
 * `options[0]` is the "unselected" label (kept as a clearable list item, same
 * as the old native-select convention this replaced).
 */
export function Select({
  value,
  onChange,
  options = ['Select...'],
  disabled,
  className,
}: {
  value: string
  onChange: (value: string) => void
  options?: string[]
  disabled?: boolean
  className?: string
}) {
  const [empty, ...rest] = options
  return (
    <SelectMenu
      value={value}
      onChange={onChange}
      options={[{ value: '', label: empty }, ...rest.map((o) => ({ value: o, label: o }))]}
      disabled={disabled}
      className={className}
    />
  )
}

/**
 * Universal date input: keeps the browser's native date picker (calendar
 * popup, keyboard entry, a11y) but restyles the chrome to match TextInput
 * and SelectMenu so it reads as the same design system.
 */
export function DateInput({
  className,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'type'> & {
  className?: string
}) {
  return (
    <div className="relative">
      <input
        type="date"
        className={`h-11 w-full rounded-md border border-line bg-surface px-4 pr-10 text-sm text-ink outline-none focus:border-brand ${className ?? ''}`}
        {...rest}
      />
      <CalendarIcon className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-muted" />
    </div>
  )
}

export function RichText({ placeholder }: { placeholder?: string }) {
  return (
    <div className="rounded-md border border-line focus-within:border-brand">
      <textarea
        rows={5}
        placeholder={placeholder}
        className="w-full resize-none bg-transparent p-4 text-base text-ink outline-none placeholder:text-muted-400"
      />
      <div className="flex gap-1 border-t border-line px-3 py-2 text-sm text-muted">
        {['B', 'I', 'U', 'S', '🔗', '•', '1.'].map((b, i) => (
          <button
            key={i}
            type="button"
            className="grid size-7 place-items-center rounded hover:bg-surface-alt"
          >
            {b}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Dropzone({
  title,
  hint,
  className = '',
}: {
  title: ReactNode
  hint?: string
  className?: string
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-surface-alt/40 p-6 text-center ${className}`}
    >
      <UploadIcon className="size-8 text-muted" />
      <p className="text-sm font-medium text-ink">{title}</p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}

export function SaveButton({
  children = 'Save Changes',
  disabled,
}: {
  children?: ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="w-fit rounded-[4px] bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  )
}
