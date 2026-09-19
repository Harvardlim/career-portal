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
  SearchIcon,
  ShareIcon,
  StarIcon,
  UserCircleIcon,
} from '@/components/icons'

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useDisplayUser()
  const { unread } = useNotifications()

  // Expert-only area — send businesses to their own dashboard.
  if (!loading && user?.role === 'employer') {
    return <Navigate to="/employer/dashboard" replace />
  }

  const nav = [
    { label: 'Overview', to: '/dashboard', end: true, Icon: LayersIcon },
    { label: 'Warm leads', to: '/dashboard/leads', Icon: StarIcon },
    { label: 'Browse open needs', to: '/needs', Icon: SearchIcon },
    { label: 'Applied', to: '/dashboard/applied-jobs', Icon: BriefcaseIcon },
    {
      label: 'Notifications',
      to: '/dashboard/notifications',
      Icon: BellIcon,
      badge: unread > 0 ? String(unread) : undefined,
    },
    { label: 'Expert profile', to: '/dashboard/expert-profile', Icon: UserCircleIcon },
    { label: 'Verification & badge', to: '/dashboard/verification', Icon: CircleCheckIcon },
    { label: 'Hire-me badge', to: '/dashboard/hire-me', Icon: ShareIcon },
    { label: 'Affiliate', to: '/dashboard/affiliate', Icon: ShareIcon },
    { label: 'Settings', to: '/dashboard/settings', Icon: GearIcon },
  ]

  return (
    <DashboardShell heading="Expert Dashboard" nav={nav}>
      {children}
    </DashboardShell>
  )
}
