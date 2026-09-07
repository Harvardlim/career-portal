import { useState } from 'react'
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import {
  ChevronDownIcon,
  EyeIcon,
  EyeOffIcon,
  UploadIcon,
} from '@/components/icons'

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

export function Select({
  options = ['Select...'],
  ...rest
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> & {
  options?: string[]
}) {
  return (
    <div className="relative">
      <select
        className="h-12 w-full appearance-none rounded-md border border-line bg-surface px-4 pr-10 text-base text-muted-600 outline-none focus:border-brand"
        {...rest}
      >
        {options.map((o, i) => (
          <option key={o} value={i === 0 ? '' : o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-muted" />
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
