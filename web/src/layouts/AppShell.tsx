import type { ReactNode } from 'react'
import { AppHeader } from '@/components/app/AppHeader'
import { SiteFooter } from '@/components/SiteFooter'

export function AppShell({
  children,
  variant = 'candidate',
}: {
  children: ReactNode
  variant?: 'candidate' | 'employer'
}) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <AppHeader variant={variant} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
