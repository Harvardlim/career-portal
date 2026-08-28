import type { ReactNode } from 'react'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import {
  BellIcon,
  BookmarkIcon,
  BriefcaseIcon,
  GearIcon,
  LayersIcon,
} from '@/components/icons'

const nav = [
  { label: 'Overview', to: '/dashboard', end: true, Icon: LayersIcon },
  { label: 'Applied Jobs', to: '/dashboard/applied-jobs', Icon: BriefcaseIcon },
  { label: 'Favorite Jobs', to: '/dashboard/favorite-jobs', Icon: BookmarkIcon },
  { label: 'Job Alert', to: '/dashboard/job-alerts', Icon: BellIcon, badge: '09' },
  { label: 'Settings', to: '/dashboard/settings', Icon: GearIcon },
]

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell heading="Candidate Dashboard" nav={nav} variant="candidate">
      {children}
    </DashboardShell>
  )
}
