import { useEffect } from 'react'
import { Outlet, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

export function SiteLayout() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  // The registration-confirm email link redirects here with ?confirmed=1 once
  // GoTrue has verified the address and signed the user in.
  useEffect(() => {
    if (params.get('confirmed') === '1') {
      toast.success('Your email is confirmed — your account is now active.')
      navigate('/', { replace: true })
    }
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
