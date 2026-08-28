import { Link } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import {
  AuthCheckbox,
  AuthField,
  AuthSocial,
  AuthSubmit,
} from '@/components/auth/fields'
import { ChevronDownIcon } from '@/components/icons'

export function CreateAccountPage() {
  return (
    <AuthLayout>
      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex flex-col gap-8"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-medium leading-10 text-ink">
              Create account.
            </h1>
            <p className="text-base text-ink-600">
              Already have account?{' '}
              <Link to="/sign-in" className="font-medium text-brand">
                Log In
              </Link>
            </p>
          </div>
          <div className="relative w-[150px] shrink-0">
            <label htmlFor="account-type" className="sr-only">
              Account type
            </label>
            <select
              id="account-type"
              defaultValue="Employers"
              className="h-12 w-full appearance-none rounded-[6px] border border-line bg-surface px-[17px] pr-9 text-sm text-muted-600 outline-none focus:border-brand"
            >
              <option value="Candidates">Candidates</option>
              <option value="Employers">Employers</option>
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-[15px] top-1/2 size-5 -translate-y-1/2 text-muted-600" />
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-5 sm:flex-row">
            <AuthField label="Full Name" name="fullName" autoComplete="name" />
            <AuthField label="Username" name="username" autoComplete="username" />
          </div>
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
            autoComplete="new-password"
          />
          <AuthField
            label="Confirm Password"
            name="confirmPassword"
            password
            autoComplete="new-password"
          />
          <AuthCheckbox name="terms">
            I&apos;ve read and agree with your{' '}
            <a href="#" className="font-medium text-brand">
              Terms of Services
            </a>
          </AuthCheckbox>
        </div>

        <AuthSubmit>Create account</AuthSubmit>
        <AuthSocial verb="Sign up" />
      </form>
    </AuthLayout>
  )
}
