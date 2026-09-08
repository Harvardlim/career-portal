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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="w-full max-w-[440px] rounded-xl bg-surface p-6 shadow-2xl">
        <h2 className="text-lg font-medium text-ink">
          This email is already registered
        </h2>
        <p className="mt-2 text-sm text-muted-600">
          <b>{email}</b> is already registered as a {existingRole} account.
        </p>
        <p className="mt-2 text-sm text-muted-600">
          {sameRole ? (
            <>Please sign in to that account instead of registering again.</>
          ) : (
            <>
              Sign in to your {existingRole} account first, then add your{' '}
              {targetRole} profile from there. This keeps your login credentials
              the same for both.
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
