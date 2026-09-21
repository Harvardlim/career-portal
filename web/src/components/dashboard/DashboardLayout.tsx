import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { useDisplayUser } from '@/lib/useDisplayUser'
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

const nav = [
  { label: 'Overview', to: '/dashboard', end: true, Icon: LayersIcon },
  { label: 'Warm leads', to: '/dashboard/leads', Icon: StarIcon },
  { label: 'Browse open needs', to: '/needs', Icon: SearchIcon },
  { label: 'Applied', to: '/dashboard/applied-jobs', Icon: BriefcaseIcon },
  { label: 'Expert profile', to: '/dashboard/expert-profile', Icon: UserCircleIcon },
  { label: 'Verification & badge', to: '/dashboard/verification', Icon: CircleCheckIcon },
  { label: 'Hire-me badge', to: '/dashboard/hire-me', Icon: ShareIcon },
  { label: 'Affiliate', to: '/dashboard/affiliate', Icon: ShareIcon },
  { label: 'Settings', to: '/dashboard/settings', Icon: GearIcon },
]

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useDisplayUser()

  // Expert-only area — send businesses to their own dashboard.
  if (!loading && user?.role === 'employer') {
    return <Navigate to="/employer/dashboard" replace />
  }

  return (
    <DashboardShell heading="Expert Dashboard" nav={nav}>
      {children}
    </DashboardShell>
  )
}
