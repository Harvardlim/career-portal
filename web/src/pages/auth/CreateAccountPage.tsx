import { Link } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { ArrowRightIcon, BuildingIcon, UserIcon } from '@/components/icons'

const paths = [
  {
    to: '/candidate/register',
    title: "I'm a Candidate",
    description: "I'm looking for a job and want to register my profile.",
    Icon: UserIcon,
  },
  {
    to: '/employer/register',
    title: "I'm an Employer",
    description: "I'm hiring and want to register my company.",
    Icon: BuildingIcon,
  },
]

export function CreateAccountPage() {
  return (
    <AuthLayout>
      <div className="flex flex-col gap-8">
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

        <div className="flex flex-col gap-5">
          <p className="text-sm font-medium text-ink-200">
            First, tell us who you are
          </p>
          {paths.map(({ to, title, description, Icon }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-center gap-5 rounded-xl border border-line bg-surface p-6 transition-colors hover:border-brand hover:bg-brand-50/40"
            >
              <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand">
                <Icon className="size-7" />
              </span>
              <span className="flex flex-1 flex-col gap-1">
                <span className="text-lg font-medium text-ink">{title}</span>
                <span className="text-sm text-ink-600">{description}</span>
              </span>
              <ArrowRightIcon className="size-6 shrink-0 text-muted transition-colors group-hover:text-brand" />
            </Link>
          ))}
        </div>
      </div>
    </AuthLayout>
  )
}
