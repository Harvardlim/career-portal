import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { useDisplayUser } from '@/lib/useDisplayUser'
import {
  BriefcaseIcon,
  CircleCheckIcon,
  GearIcon,
  LayersIcon,
  PlusCircleIcon,
  ShareIcon,
  UserCircleIcon,
} from '@/components/icons'
import { useT, tr } from '@/lib/i18n'

const nav = [
  { get label() { return tr('dash.overview') }, to: '/employer/dashboard', end: true, Icon: LayersIcon },
  { get label() { return tr('dash.post_need') }, to: '/employer/post-need', Icon: PlusCircleIcon },
  { get label() { return tr('dash.my_postings') }, to: '/employer/postings', Icon: BriefcaseIcon },
  { get label() { return tr('dash.verification_biz') }, to: '/employer/verification', Icon: CircleCheckIcon },
  { get label() { return tr('dash.biz_profile') }, to: '/company/register', Icon: UserCircleIcon },
  { get label() { return tr('dash.affiliate') }, to: '/employer/affiliate', Icon: ShareIcon },
  { get label() { return tr('dash.settings') }, to: '/employer/settings', Icon: GearIcon },
]

export function EmployerDashboardLayout({ children }: { children: ReactNode }) {
  const t = useT()
  const { user, loading } = useDisplayUser()

  // Business-only area ,  send experts (or accounts with no business profile)
  // to their own dashboard.
  if (!loading && user && user.role !== 'employer') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <DashboardShell heading={t('ui.business_dashboard')} nav={nav}>
      {children}
    </DashboardShell>
  )
}
