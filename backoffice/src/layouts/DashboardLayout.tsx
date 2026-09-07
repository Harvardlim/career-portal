import { Navigate, Outlet } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'
import { useAdminSession } from '../lib/admin'

export const DashboardLayout = () => {
  const session = useAdminSession()
  if (!session) return <Navigate to="/login" replace />

  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg text-ink-200">
      <Sidebar />
      <main className="scroll-slim flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1100px] px-10 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
