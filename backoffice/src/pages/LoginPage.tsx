import { Link } from 'react-router-dom'
import { Button } from '../components/ui'
import { IconEye, IconLock, IconMail } from '../components/Icons'

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
    <span className="text-[20px] font-semibold tracking-tight text-ink">Dashdark X</span>
  </div>
)

const Field = ({
  label,
  type,
  placeholder,
  icon,
  trailing,
}: {
  label: string
  type: string
  placeholder: string
  icon: React.ReactNode
  trailing?: React.ReactNode
}) => (
  <label className="block">
    <span className="mb-1.5 block text-[13px] font-medium text-ink-200">{label}</span>
    <span className="flex items-center gap-2.5 rounded-xl border border-line bg-surface-2 px-3.5 py-3 focus-within:border-brand-2">
      <span className="text-muted">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full bg-transparent text-[14px] text-ink placeholder:text-muted focus:outline-none"
      />
      {trailing ? <span className="text-muted">{trailing}</span> : null}
    </span>
  </label>
)

export const LoginPage = () => (
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
        Please enter your details to sign in to your account.
      </p>

      <button className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl border border-line bg-surface-2 py-3 text-[14px] font-medium text-ink-200 hover:text-ink">
        <span className="grid size-5 place-items-center rounded-full bg-white text-[12px] font-bold text-[#4285F4]">
          G
        </span>
        Sign in with Google
      </button>

      <div className="my-6 flex items-center gap-3 text-[12px] text-muted">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <Field
          label="Email"
          type="email"
          placeholder="you@example.com"
          icon={<IconMail width={17} height={17} />}
        />
        <Field
          label="Password"
          type="password"
          placeholder="Enter your password"
          icon={<IconLock width={17} height={17} />}
          trailing={<IconEye width={17} height={17} />}
        />

        <div className="flex items-center justify-between pt-1 text-[13px]">
          <label className="flex items-center gap-2 text-ink-200">
            <span className="grid size-4 place-items-center rounded-[5px] border border-line" />
            Remember me
          </label>
          <Link to="/login" className="font-medium text-brand-2 hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full py-3 text-[14px]">
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-muted">
        Don&apos;t have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-2 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  </div>
)
