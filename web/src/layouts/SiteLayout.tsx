import { useEffect } from 'react'
import { Outlet, useNavigate, useSearchParams } from 'react-router-dom'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

export function SiteLayout() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  // Confirmation emails sent before the redirect moved still land on /?confirmed=1;
  // forward them to the login page, where the confirmation is acknowledged.
  useEffect(() => {
    if (params.get('confirmed') === '1') navigate('/sign-in?confirmed=1', { replace: true })
  }, [params, navigate])

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
