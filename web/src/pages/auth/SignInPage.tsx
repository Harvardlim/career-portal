import { Link } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import {
  AuthCheckbox,
  AuthField,
  AuthSocial,
  AuthSubmit,
} from '@/components/auth/fields'

export function SignInPage() {
  return (
    <AuthLayout>
      <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-medium leading-10 text-ink">Sign in</h1>
          <p className="text-base text-ink-600">
            Don&rsquo;t have account{' '}
            <Link to="/create-account" className="font-medium text-brand">
              Create Account
            </Link>
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <AuthField
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
          />
          <AuthField
            label="Password"
            name="password"
            password
            autoComplete="current-password"
          />
          <div className="flex items-center justify-between">
            <AuthCheckbox name="remember">Remember Me</AuthCheckbox>
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-brand"
            >
              Forget password
            </Link>
          </div>
        </div>

        <AuthSubmit>Sign in</AuthSubmit>
        <AuthSocial verb="Sign in" />
      </form>
    </AuthLayout>
  )
}
