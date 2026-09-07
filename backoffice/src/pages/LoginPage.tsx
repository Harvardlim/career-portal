import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui'
import { IconEye, IconLock, IconMail } from '../components/Icons'
import { adminLogin, getAdminSession } from '../lib/admin'
import { errMessage } from '../lib/errors'

const Logo = () => (
  <div className="flex items-center gap-2.5">
    <span className="grid size-9 place-items-center rounded-lg bg-bg">
      <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
        <defs>
          <linearGradient id="loginLogo" x1="0" y1="0" x2="32" y2="32">
            <stop stopColor="#CB3CFF" />
            <stop offset="1" stopColor="#00C2FF" />
          </linearGradient>
        </defs>
        <path d="M9 22V10a1 1 0 0 1 1-1h6a7 7 0 0 1 0 14h-6a1 1 0 0 1-1-1Z" fill="url(#loginLogo)" />
        <circle cx="21" cy="11" r="3" fill="#CB3CFF" />
      </svg>
    </span>
    <span className="text-[20px] font-semibold tracking-tight text-ink">Career Portal Admin</span>
  </div>
)

export const LoginPage = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [reveal, setReveal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (getAdminSession()) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await adminLogin(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(errMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-4 py-10">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full opacity-30 blur-[120px]"
        style={{ background: 'radial-gradient(closest-side, #CB3CFF, transparent)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-52 right-[-120px] h-[420px] w-[520px] rounded-full opacity-20 blur-[120px]"
        style={{ background: 'radial-gradient(closest-side, #00C2FF, transparent)' }}
      />

      <div className="relative w-full max-w-[420px] rounded-2xl border border-line bg-surface p-8 shadow-pop">
        <Logo />

        <h1 className="mt-7 text-[24px] font-semibold text-ink">Welcome back</h1>
        <p className="mt-1 text-[13px] text-muted">
          Please enter your details to sign in to the backoffice.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink-200">Email</span>
            <span className="flex items-center gap-2.5 rounded-xl border border-line bg-surface-2 px-3.5 py-3 focus-within:border-brand-2">
              <span className="text-muted">
                <IconMail width={17} height={17} />
              </span>
              <input
                type="email"
                required
                autoComplete="username"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-[14px] text-ink placeholder:text-muted focus:outline-none"
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink-200">Password</span>
            <span className="flex items-center gap-2.5 rounded-xl border border-line bg-surface-2 px-3.5 py-3 focus-within:border-brand-2">
              <span className="text-muted">
                <IconLock width={17} height={17} />
              </span>
              <input
                type={reveal ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-[14px] text-ink placeholder:text-muted focus:outline-none"
              />
              <button
                type="button"
                aria-label={reveal ? 'Hide password' : 'Show password'}
                onClick={() => setReveal((v) => !v)}
                className="text-muted hover:text-ink-200"
              >
                <IconEye width={17} height={17} />
              </button>
            </span>
          </label>

          {error ? (
            <p className="rounded-lg bg-danger/12 px-3 py-2 text-[13px] text-danger">{error}</p>
          ) : null}

          <Button type="submit" disabled={busy} className="w-full py-3 text-[14px]">
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  )
}
