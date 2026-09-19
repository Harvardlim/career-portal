import type { ComponentType, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BellIcon } from '@/components/icons'
import { EmptyState, SecondaryButton } from '@/components/partly/ui'
import { markAllNotificationsRead, markNotificationRead, useNotifications, type NotificationRow } from '@/lib/partly'
import { useSession } from '@/lib/useSession'

const TONE: Record<string, string> = {
  warm_lead: 'border-l-amber-400',
  contact_unlocked: 'border-l-emerald-500',
  lead_cold: 'border-l-line',
  lead_cold_job_closed: 'border-l-line',
  badge_renewal: 'border-l-brand',
  badge_active: 'border-l-brand',
  verification_approved: 'border-l-emerald-500',
  verification_rejected: 'border-l-danger',
}

function Row({ n, onOpen }: { n: NotificationRow; onOpen: (n: NotificationRow) => void }) {
  const inner = (
    <div className={`flex gap-3 border-l-4 py-3 pl-3 pr-2 ${TONE[n.kind] ?? 'border-l-line'} ${n.read_at ? 'opacity-70' : ''}`}>
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${n.read_at ? 'text-ink-600' : 'font-medium text-ink'}`}>{n.title}</p>
        {n.body && <p className="mt-0.5 text-sm text-muted">{n.body}</p>}
        <p className="mt-1 text-xs text-muted-400">{new Date(n.created_at).toLocaleString()}</p>
      </div>
      {!n.read_at && <span className="mt-2 size-2 shrink-0 rounded-full bg-brand" />}
    </div>
  )
  return n.link ? (
    <Link to={n.link} onClick={() => onOpen(n)} className="block hover:bg-surface-alt">
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={() => onOpen(n)} className="block w-full text-left hover:bg-surface-alt">
      {inner}
    </button>
  )
}

/** Shared by both dashboards; the layout decides which shell wraps it. */
export function NotificationsPage({ Layout }: { Layout: ComponentType<{ children: ReactNode }> }) {
  const { session } = useSession()
  const { notifications, unread, loading, reload } = useNotifications()

  async function open(n: NotificationRow) {
    if (n.read_at) return
    await markNotificationRead(n.id).catch(() => {})
    void reload()
  }

  async function readAll() {
    if (!session) return
    await markAllNotificationsRead(session.user.id).catch(() => {})
    void reload()
  }

  return (
    <Layout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="flex items-center gap-2 text-lg font-medium text-ink">
            <BellIcon className="size-5" /> Notifications{' '}
            {unread > 0 && <span className="rounded-full bg-brand px-2 py-0.5 text-xs text-white">{unread}</span>}
          </h1>
          {unread > 0 && (
            <SecondaryButton className="h-9 px-3 text-xs" onClick={readAll}>
              Mark all read
            </SecondaryButton>
          )}
        </div>
        {notifications.length === 0 ? (
          <EmptyState>{loading ? 'Loading…' : 'Nothing yet. Warm leads, unlocks and verification updates land here.'}</EmptyState>
        ) : (
          <div className="flex flex-col divide-y divide-line rounded-xl border border-line">
            {notifications.map((n) => (
              <Row key={n.id} n={n} onOpen={open} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
