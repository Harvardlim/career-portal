import { Link } from 'react-router-dom'

type Role = 'candidate' | 'employer'

/** Shown when someone tries to register an email that already has an account. */
export function RegisteredEmailDialog({
  email,
  existingRole,
  targetRole,
  onClose,
}: {
  email: string
  existingRole: Role
  targetRole: Role
  onClose: () => void
}) {
  const sameRole = existingRole === targetRole
  const label = (r: Role) => (r === 'candidate' ? 'expert' : 'business')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="w-full max-w-[440px] rounded-xl bg-surface p-6 shadow-2xl">
        <h2 className="text-lg font-medium text-ink">
          This email is already registered
        </h2>
        <p className="mt-2 text-sm text-muted-600">
          <b>{email}</b> is already registered as {label(existingRole) === 'expert' ? 'an' : 'a'} {label(existingRole)} account.
        </p>
        <p className="mt-2 text-sm text-muted-600">
          {sameRole ? (
            <>Please sign in to that account instead of registering again.</>
          ) : (
            <>
              One email can only hold one account, so it can&apos;t also be {label(targetRole) === 'expert' ? 'an' : 'a'}{' '}
              {label(targetRole)}. Sign in to your {label(existingRole)} account, or register the{' '}
              {label(targetRole)} with a different email address.
            </>
          )}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[4px] border border-line px-5 py-2.5 text-sm font-semibold text-ink-600 hover:text-ink"
          >
            Cancel
          </button>
          <Link
            to="/sign-in"
            className="rounded-[4px] bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}

/** Shown on a registration page when the visitor is already signed in to an account. */
export function AlreadySignedInNotice({
  email,
  role,
  dashboardPath,
  onSignOut,
}: {
  email: string
  role: Role
  dashboardPath: string
  onSignOut: () => void
}) {
  const label = role === 'candidate' ? 'an expert' : 'a business'
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 py-16 text-center">
      <h1 className="text-2xl font-medium text-navy" style={{ fontFamily: 'Georgia, serif' }}>
        You already have an account
      </h1>
      <p className="text-sm text-muted-600">
        You&apos;re signed in as <b>{email}</b>, which is {label} account. One email can only hold one account — to
        register a different profile, sign out and use another email address.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link to={dashboardPath} className="rounded-[4px] bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
          Go to my dashboard
        </Link>
        <button
          type="button"
          onClick={onSignOut}
          className="rounded-[4px] border border-line px-5 py-2.5 text-sm font-semibold text-ink-600 hover:text-ink"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
