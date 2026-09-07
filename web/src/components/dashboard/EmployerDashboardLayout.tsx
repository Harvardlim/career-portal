import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { useDisplayUser } from '@/lib/useDisplayUser'
import {
  BookmarkIcon,
  BriefcaseIcon,
  GearIcon,
  LayersIcon,
  PlusCircleIcon,
  ShareIcon,
  UserCircleIcon,
  FileIcon,
} from '@/components/icons'

const nav = [
  { label: 'Overview', to: '/employer/dashboard', end: true, Icon: LayersIcon },
  { label: 'Employers Profile', to: '/company/register', Icon: UserCircleIcon },
  { label: 'Post a Job', to: '/employer/post-job', Icon: PlusCircleIcon },
  { label: 'My Jobs', to: '/employer/my-jobs', Icon: BriefcaseIcon },
  { label: 'Saved Candidate', to: '/employer/saved-candidates', Icon: BookmarkIcon },
  { label: 'Plans & Billing', to: '/employer/billing', Icon: FileIcon },
  { label: 'Affiliate', to: '/employer/affiliate', Icon: ShareIcon },
  { label: 'Settings', to: '/employer/settings', Icon: GearIcon },
]

export function EmployerDashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useDisplayUser()

  // Employer-only area — send candidates (or accounts with no employer profile)
  // to their own dashboard.
  if (!loading && user && user.role !== 'employer') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <DashboardShell heading="Employers Dashboard" nav={nav}>
      {children}
    </DashboardShell>
  )
}
