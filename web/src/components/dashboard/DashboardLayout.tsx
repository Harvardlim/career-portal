import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { useDisplayUser } from '@/lib/useDisplayUser'
import { useWarmLeadCount } from '@/lib/partly'
import {
  BriefcaseIcon,
  CircleCheckIcon,
  GearIcon,
  LayersIcon,
  SearchIcon,
  ShareIcon,
  StarIcon,
  UserCircleIcon,
} from '@/components/icons'
import { useT, tr } from '@/lib/i18n'

const nav = [
  { get label() { return tr('dash.overview') }, to: '/dashboard', end: true, Icon: LayersIcon },
  { get label() { return tr('dash.warm_leads') }, to: '/dashboard/leads', Icon: StarIcon },
  { get label() { return tr('dash.browse_needs') }, to: '/needs', Icon: SearchIcon },
  { get label() { return tr('dash.applied') }, to: '/dashboard/applied-jobs', Icon: BriefcaseIcon },
  { get label() { return tr('dash.expert_profile') }, to: '/dashboard/expert-profile', Icon: UserCircleIcon },
  { get label() { return tr('dash.verification') }, to: '/dashboard/verification', Icon: CircleCheckIcon },
  { get label() { return tr('dash.hire_me') }, to: '/dashboard/hire-me', Icon: ShareIcon },
  { get label() { return tr('dash.affiliate') }, to: '/dashboard/affiliate', Icon: ShareIcon },
  { get label() { return tr('dash.settings') }, to: '/dashboard/settings', Icon: GearIcon },
]

export function DashboardLayout({ children }: { children: ReactNode }) {
  const t = useT()
  const { user, loading } = useDisplayUser()
  const warm = useWarmLeadCount(user?.role === 'candidate' ? user.profileId : null)

  // Expert-only area ,  send businesses to their own dashboard.
  if (!loading && user?.role === 'employer') {
    return <Navigate to="/employer/dashboard" replace />
  }

  return (
    <DashboardShell
      heading={t('ui.expert_dashboard')}
      nav={nav.map((item) => (item.to === '/dashboard/leads' && warm > 0 ? { ...item, badge: String(warm) } : item))}
    >
      {children}
    </DashboardShell>
  )
}
