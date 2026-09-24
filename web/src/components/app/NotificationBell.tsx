import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { BellIcon } from '@/components/icons'
import {
  markAllNotificationsRead,
  markNotificationRead,
  useNotifications,
  type NotificationRow,
} from '@/lib/partly'

/** Re-check for new notifications this often, and whenever the tab regains focus. */
const POLL_MS = 60_000

function timeAgo(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

/**
 * The header bell. Every in-app notification the flow writes (warm lead, cold
 * lead, unlocked contact, badge status...) lands here; a fresh one also pops a
 * toast so a warm lead is never missed while the person is on another page.
 */
export function NotificationBell({ userId }: { userId: string }) {
  const navigate = useNavigate()
  const { notifications, unread, loading, reload } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const seen = useRef<Set<string> | null>(null)

  // Toast anything that arrives after the first load (never the backlog).
  useEffect(() => {
    if (loading) return
    if (seen.current === null) {
      seen.current = new Set(notifications.map((n) => n.id))
      return
    }
    for (const n of notifications) {
      if (seen.current.has(n.id)) continue
      seen.current.add(n.id)
      if (n.read_at) continue
      toast(n.title, {
        description: n.body ?? undefined,
        duration: 10_000,
        action: n.link
          ? {
              label: 'View',
              onClick: () => {
                void markNotificationRead(n.id).then(reload)
                navigate(n.link!)
              },
            }
          : undefined,
      })
    }
  }, [notifications, loading, navigate, reload])

  // Realtime is best-effort; poll + refresh on focus so a lead is never stuck unseen.
  useEffect(() => {
    const t = setInterval(() => void reload(), POLL_MS)
    const onFocus = () => void reload()
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(t)
      window.removeEventListener('focus', onFocus)
    }
  }, [reload])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  async function openItem(n: NotificationRow) {
    setOpen(false)
    if (!n.read_at) await markNotificationRead(n.id).catch(() => {})
    void reload()
    if (n.link) navigate(n.link)
  }

  async function readAll() {
    await markAllNotificationsRead(userId).catch(() => {})
    void reload()
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-haspopup="true"
        aria-expanded={open}
        className="relative grid size-11 place-items-center rounded-full text-ink-600 transition-colors hover:bg-surface-alt"
      >
        <BellIcon className="size-6" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 grid min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[11px] font-semibold leading-[18px] text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-13 z-50 w-[360px] max-w-[calc(100vw-32px)] overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-ink">Notifications</p>
            {unread > 0 && (
              <button type="button" onClick={readAll} className="text-xs font-medium text-brand hover:underline">
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted">Nothing yet — warm leads and updates land here.</p>
          ) : (
            <ul className="max-h-[420px] divide-y divide-line overflow-y-auto">
              {notifications.slice(0, 15).map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => void openItem(n)}
                    className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-alt ${n.read_at ? '' : 'bg-gold-50/60'}`}
                  >
                    <span
                      className={`mt-1.5 size-2 shrink-0 rounded-full ${n.read_at ? 'bg-transparent' : 'bg-gold'}`}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink">{n.title}</span>
                      {n.body && <span className="mt-0.5 line-clamp-3 block text-xs text-ink-600">{n.body}</span>}
                      <span className="mt-1 block text-[11px] text-muted">{timeAgo(n.created_at)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
