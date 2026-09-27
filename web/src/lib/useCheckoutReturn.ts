import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { confirmCheckout, readCheckoutParams } from './stripe'

// Stripe returns to ?checkout=success&session_id=... . The page effect that
// handles it re-ran every time the account data reloaded (and twice under
// StrictMode) before the query string was cleared, so the same payment was
// confirmed -- and toasted -- several times. Each session is now handled once
// per tab, and its toast carries a fixed id so it can never stack.
const handled = new Set<string>()
let lastReturnAt = 0

/** True shortly after a Stripe return, so the notification bell doesn't toast the same event again. */
export function justReturnedFromCheckout(withinMs = 60_000): boolean {
  return Date.now() - lastReturnAt < withinMs
}

type Options = {
  successMessage: string
  cancelledMessage: string
  successAction?: { label: string; onClick: () => void }
  /** Refresh the page's data once the payment is confirmed. */
  onConfirmed?: () => void | Promise<void>
}

export function useCheckoutReturn(opts: Options): { confirming: boolean } {
  const location = useLocation()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)
  const latest = useRef(opts)
  latest.current = opts

  useEffect(() => {
    const { outcome, sessionId } = readCheckoutParams(location.search)
    if (!outcome) return
    navigate(location.pathname, { replace: true })
    const key = sessionId ?? `${outcome}:${location.pathname}`
    if (handled.has(key)) return
    handled.add(key)
    lastReturnAt = Date.now()

    if (outcome === 'cancelled') {
      toast(latest.current.cancelledMessage, { id: `checkout-${key}` })
      return
    }
    if (!sessionId) return
    setConfirming(true)
    confirmCheckout(sessionId)
      .then(async (ok) => {
        if (ok) toast.success(latest.current.successMessage, { id: `checkout-${key}`, action: latest.current.successAction })
        await latest.current.onConfirmed?.()
      })
      .finally(() => setConfirming(false))
  }, [location.search, location.pathname, navigate])

  return { confirming }
}
