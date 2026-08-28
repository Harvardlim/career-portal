import { AuthLayout } from '@/components/auth/AuthLayout'
import { AuthField, AuthSubmit } from '@/components/auth/fields'

export function ResetPasswordPage() {
  return (
    <AuthLayout variant="centered">
      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex flex-col items-center gap-9"
      >
        <div className="flex flex-col gap-6 text-center">
          <h1 className="text-3xl font-medium leading-10 text-ink">
            Reset Password
          </h1>
          <p className="text-base leading-6 text-muted">
            Duis luctus interdum metus, ut consectetur ante consectetur sed.
            Suspendisse euismod viverra massa sit amet mollis.
          </p>
        </div>

        <div className="flex w-full flex-col gap-4">
          <AuthField
            label="New Password"
            name="password"
            password
            autoComplete="new-password"
          />
          <AuthField
            label="Confirm Password"
            name="confirmPassword"
            password
            autoComplete="new-password"
          />
        </div>

        <AuthSubmit>Reset Password</AuthSubmit>
      </form>
    </AuthLayout>
  )
}
