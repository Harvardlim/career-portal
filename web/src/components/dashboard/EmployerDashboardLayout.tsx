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

const nav = [
  { label: 'Overview', to: '/employer/dashboard', end: true, Icon: LayersIcon },
  { label: 'Post a need', to: '/employer/post-need', Icon: PlusCircleIcon },
  { label: 'My postings & matches', to: '/employer/postings', Icon: BriefcaseIcon },
  { label: 'Verification', to: '/employer/verification', Icon: CircleCheckIcon },
  { label: 'Business profile', to: '/company/register', Icon: UserCircleIcon },
  { label: 'Affiliate', to: '/employer/affiliate', Icon: ShareIcon },
  { label: 'Settings', to: '/employer/settings', Icon: GearIcon },
]

export function EmployerDashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useDisplayUser()

  // Business-only area — send experts (or accounts with no business profile)
  // to their own dashboard.
  if (!loading && user && user.role !== 'employer') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <DashboardShell heading="Business Dashboard" nav={nav}>
      {children}
    </DashboardShell>
  )
}
