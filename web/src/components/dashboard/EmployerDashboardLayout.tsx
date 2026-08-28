import type { ReactNode } from 'react'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import {
  BookmarkIcon,
  BriefcaseIcon,
  GearIcon,
  LayersIcon,
  PlusCircleIcon,
  UserCircleIcon,
  UsersIcon,
  FileIcon,
} from '@/components/icons'

const nav = [
  { label: 'Overview', to: '/employer/dashboard', end: true, Icon: LayersIcon },
  { label: 'Employers Profile', to: '/company/register', Icon: UserCircleIcon },
  { label: 'Post a Job', to: '/employer/post-job', Icon: PlusCircleIcon },
  { label: 'My Jobs', to: '/employer/my-jobs', Icon: BriefcaseIcon },
  { label: 'Saved Candidate', to: '/employer/saved-candidates', Icon: BookmarkIcon },
  { label: 'Plans & Billing', to: '/employer/billing', Icon: FileIcon },
  { label: 'All Companies', to: '/browse-employer', Icon: UsersIcon },
  { label: 'Settings', to: '/dashboard/settings', Icon: GearIcon },
]

export function EmployerDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell heading="Employers Dashboard" nav={nav} variant="employer">
      {children}
    </DashboardShell>
  )
}
