import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { useDisplayUser } from '@/lib/useDisplayUser'
import { useNotifications } from '@/lib/partly'
import {
  BellIcon,
  BriefcaseIcon,
  CircleCheckIcon,
  GearIcon,
  LayersIcon,
  PlusCircleIcon,
  ShareIcon,
  UserCircleIcon,
} from '@/components/icons'

export function EmployerDashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useDisplayUser()
  const { unread } = useNotifications()

  // Business-only area — send experts (or accounts with no business profile)
  // to their own dashboard.
  if (!loading && user && user.role !== 'employer') {
    return <Navigate to="/dashboard" replace />
  }

  const nav = [
    { label: 'Overview', to: '/employer/dashboard', end: true, Icon: LayersIcon },
    { label: 'Post a need', to: '/employer/post-need', Icon: PlusCircleIcon },
    { label: 'My postings & matches', to: '/employer/postings', Icon: BriefcaseIcon },
    {
      label: 'Notifications',
      to: '/employer/notifications',
      Icon: BellIcon,
      badge: unread > 0 ? String(unread) : undefined,
    },
    { label: 'Verification', to: '/employer/verification', Icon: CircleCheckIcon },
    { label: 'Business profile', to: '/company/register', Icon: UserCircleIcon },
    { label: 'Affiliate', to: '/employer/affiliate', Icon: ShareIcon },
    { label: 'Settings', to: '/employer/settings', Icon: GearIcon },
  ]

  return (
    <DashboardShell heading="Business Dashboard" nav={nav}>
      {children}
    </DashboardShell>
  )
}
