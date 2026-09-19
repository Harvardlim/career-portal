import { Link } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { ArrowRightIcon, CircleCheckIcon, UsersIcon } from '@/components/icons'
import { GoldCircle } from '@/components/marketing/blocks'
import { useT } from '@/lib/i18n'

export function CreateAccountPage() {
  const t = useT()
  const paths = [
    {
      to: '/employer/register',
      title: t('hero.toggle.business'),
      description: 'Post your project free, review up to 10 verified experts, and release contact only when it fits.',
      Icon: UsersIcon,
    },
    {
      to: '/candidate/register',
      title: t('hero.toggle.expert'),
      description: 'Apply to real projects and pay a small fixed fee only when a business releases contact to you.',
      Icon: CircleCheckIcon,
    },
  ]

  return (
    <AuthLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h1
            className="text-3xl font-medium leading-tight text-navy"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Join partly.asia
          </h1>
          <p className="text-base text-ink-600">{t('hero.sub')}</p>
          <p className="text-sm text-ink-600">
            Already have an account?{' '}
            <Link to="/sign-in" className="font-medium text-brand">
              {t('nav.login')}
            </Link>
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium text-ink-200">First, tell us who you are</p>
          {paths.map(({ to, title, description, Icon }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-center gap-5 rounded-xl border border-line bg-cream p-6 transition-colors hover:border-gold"
            >
              <GoldCircle size={56}>
                <Icon className="size-7" />
              </GoldCircle>
              <span className="flex flex-1 flex-col gap-1">
                <span className="text-lg font-semibold text-navy">{title}</span>
                <span className="text-sm text-ink-600">{description}</span>
              </span>
              <ArrowRightIcon className="size-6 shrink-0 text-muted transition-colors group-hover:text-gold" />
            </Link>
          ))}
        </div>

        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
          <li>✓ {t('trust.verified')}</li>
          <li>✓ {t('trust.matched')}</li>
          <li>✓ {t('trust.pay')}</li>
        </ul>
      </div>
    </AuthLayout>
  )
}
