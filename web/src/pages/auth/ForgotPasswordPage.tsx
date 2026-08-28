import { Link } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { AuthField, AuthSocial, AuthSubmit } from '@/components/auth/fields'

export function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-8">
        <div className="flex flex-col gap-6">
          <h1 className="text-3xl font-medium leading-10 text-ink">
            Forget Password
          </h1>
          <div className="flex flex-col gap-2 text-base">
            <p className="text-ink-600">
              Go back to{' '}
              <Link to="/sign-in" className="font-medium text-brand">
                Sign In
              </Link>
            </p>
            <p className="text-ink-600">
              Don&rsquo;t have account{' '}
              <Link to="/create-account" className="font-medium text-brand">
                Create Account
              </Link>
            </p>
          </div>
        </div>

        <AuthField
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
        />

        <AuthSubmit>Reset Password</AuthSubmit>
        <AuthSocial verb="Sign in" />
      </form>
    </AuthLayout>
  )
}
