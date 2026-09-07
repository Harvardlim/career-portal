import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { useDisplayUser } from '@/lib/useDisplayUser'
import {
  BookmarkIcon,
  BriefcaseIcon,
  GearIcon,
  LayersIcon,
  SearchPlusIcon,
  ShareIcon,
  StarIcon,
} from '@/components/icons'

const nav = [
  { label: 'Overview', to: '/dashboard', end: true, Icon: LayersIcon },
  { label: 'Applied Jobs', to: '/dashboard/applied-jobs', Icon: BriefcaseIcon },
  { label: 'Favorite Jobs', to: '/dashboard/favorite-jobs', Icon: BookmarkIcon },
  { label: 'Priority Match', to: '/dashboard/priority-match', Icon: SearchPlusIcon },
  { label: 'Membership', to: '/dashboard/membership', Icon: StarIcon },
  { label: 'Affiliate', to: '/dashboard/affiliate', Icon: ShareIcon },
  { label: 'Settings', to: '/dashboard/settings', Icon: GearIcon },
]

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useDisplayUser()

  // Candidate-only area — send employers to their own dashboard.
  if (!loading && user?.role === 'employer') {
    return <Navigate to="/employer/dashboard" replace />
  }

  return (
    <DashboardShell heading="Candidate Dashboard" nav={nav}>
      {children}
    </DashboardShell>
  )
}
