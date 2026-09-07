import { EmployerDashboardLayout } from '@/components/dashboard/EmployerDashboardLayout'
import { ChangePasswordForm } from '@/pages/dashboard/SettingsPage'
import { useEmployer } from '@/lib/employers'

export function EmployerSettingsPage() {
  const { employer, session, loading } = useEmployer()
  const email = session?.user.email ?? employer?.business_email ?? ''

  return (
    <EmployerDashboardLayout>
      <div className="flex max-w-[720px] flex-col gap-8">
        <h1 className="text-2xl font-medium text-ink">Settings</h1>
        {loading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : (
          <ChangePasswordForm accountEmail={email} />
        )}
      </div>
    </EmployerDashboardLayout>
  )
}
