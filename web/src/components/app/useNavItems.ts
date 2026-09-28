import { useT } from '@/lib/i18n'
import { useDisplayUser } from '@/lib/useDisplayUser'

/** The primary nav links, shared by the desktop bar and the mobile menu. */
export function useNavItems() {
  const t = useT()
  const { user } = useDisplayUser()
  return [
    // Signed in, "Home" is the dashboard ,  the marketing page is for visitors.
    user ? { label: t('nav.dashboard'), to: user.dashboardPath } : { label: t('nav.home'), to: '/' },
    { label: t('nav.businesses'), to: '/for-businesses' },
    { label: t('nav.experts'), to: '/for-experts' },
    { label: t('nav.categories'), to: '/categories' },
    { label: t('nav.how'), to: '/how-it-works' },
  ]
}
