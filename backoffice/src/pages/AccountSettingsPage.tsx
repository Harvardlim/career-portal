import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card } from '../components/ui'
import { IconEye, IconLock } from '../components/Icons'
import { adminChangePassword, signOut, useAdminSession } from '../lib/admin'
import { errMessage } from '../lib/errors'

const PasswordField = ({
  label,
  value,
  onChange,
  autoComplete,
  hint,
  hintTone = 'muted',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  autoComplete?: string
  hint?: string
  hintTone?: 'muted' | 'danger' | 'success'
}) => {
  const [reveal, setReveal] = useState(false)
  const hintClass =
    hintTone === 'danger'
      ? 'text-danger'
      : hintTone === 'success'
        ? 'text-success'
        : 'text-muted'
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-ink-200">{label}</span>
      <span className="flex items-center gap-2.5 rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 focus-within:border-brand-2">
        <span className="text-muted">
          <IconLock width={16} height={16} />
        </span>
        <input
          type={reveal ? 'text' : 'password'}
          required
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-[14px] text-ink focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setReveal((v) => !v)}
          aria-label={reveal ? 'Hide password' : 'Show password'}
          aria-pressed={reveal}
          className={reveal ? 'text-brand-2' : 'text-muted hover:text-ink-200'}
        >
          <IconEye width={16} height={16} />
        </button>
      </span>
      {hint ? <span className={`mt-1 block text-[12px] ${hintClass}`}>{hint}</span> : null}
    </label>
  )
}

export const AccountSettingsPage = () => {
  const session = useAdminSession()
  const navigate = useNavigate()

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const tooShort = next.length > 0 && next.length < 8
  const mismatch = confirm.length > 0 && next !== confirm
  const matches = confirm.length > 0 && next.length > 0 && next === confirm
  const canSubmit =
    !busy && current.length > 0 && next.length >= 8 && next === confirm

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!session) return
    setError(null)
    setNotice(null)
    if (next.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }
    if (next !== confirm) {
      setError('New password and confirmation do not match.')
      return
    }
    setBusy(true)
    try {
      await adminChangePassword(session.email, current, next)
      setCurrent('')
      setNext('')
      setConfirm('')
      setNotice('Password updated.')
    } catch (err) {
      setError(errMessage(err))
    } finally {
      setBusy(false)
    }
  }

  function handleSignOut() {
    signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold text-ink">Account settings</h1>
        <p className="mt-1 text-[13px] text-muted">Manage your backoffice sign-in.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Card className="h-fit p-6">
          <h2 className="text-[17px] font-semibold text-ink">Profile</h2>
          <dl className="mt-4 space-y-3 text-[13px]">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Name</dt>
              <dd className="font-medium text-ink">{session?.name ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Email</dt>
              <dd className="font-medium text-ink">{session?.email ?? '—'}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-5 w-full rounded-xl border border-line bg-surface-2 py-2.5 text-[13px] font-semibold text-ink-200 hover:text-ink"
          >
            Sign out
          </button>
        </Card>

        <Card className="p-6">
          <h2 className="text-[17px] font-semibold text-ink">Change password</h2>
          <form className="mt-4 max-w-[420px] space-y-3.5" onSubmit={handleSubmit}>
            <PasswordField
              label="Current password"
              value={current}
              onChange={setCurrent}
              autoComplete="current-password"
            />
            <PasswordField
              label="New password"
              value={next}
              onChange={setNext}
              autoComplete="new-password"
              hint={tooShort ? 'At least 8 characters.' : undefined}
              hintTone="danger"
            />
            <PasswordField
              label="Confirm new password"
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
              hint={
                mismatch
                  ? 'Passwords do not match.'
                  : matches
                    ? 'Passwords match.'
                    : undefined
              }
              hintTone={mismatch ? 'danger' : 'success'}
            />

            {error ? (
              <p className="rounded-lg bg-danger/12 px-3 py-2 text-[13px] text-danger">{error}</p>
            ) : null}
            {notice ? (
              <p className="rounded-lg bg-success/12 px-3 py-2 text-[13px] text-success">
                {notice}
              </p>
            ) : null}

            <Button type="submit" disabled={!canSubmit} className="py-2.5">
              {busy ? 'Saving…' : 'Update password'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
