import { useEffect, useState, type FormEvent } from 'react'
import { Button, Card } from '../components/ui'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { IconLock, IconMail, IconTrash, IconUsers } from '../components/Icons'
import {
  adminAuthEnabled,
  adminCreate,
  adminDelete,
  adminList,
  useAdminSession,
  type AdminRow,
} from '../lib/admin'
import { errMessage } from '../lib/errors'

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })

export const AdminListPage = () => {
  const session = useAdminSession()
  const [rows, setRows] = useState<AdminRow[]>([])
  const [loading, setLoading] = useState(adminAuthEnabled)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [pendingRemove, setPendingRemove] = useState<AdminRow | null>(null)
  const [removing, setRemoving] = useState(false)
  const [removeError, setRemoveError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      setRows(await adminList())
      setError(null)
    } catch (e) {
      setError(errMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!adminAuthEnabled) return
    void load()
  }, [])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setCreating(true)
    setFormError(null)
    setNotice(null)
    try {
      const created = await adminCreate(name, email, password)
      setName('')
      setEmail('')
      setPassword('')
      setNotice(`Admin "${created.name}" added.`)
      await load()
    } catch (e) {
      setFormError(errMessage(e))
    } finally {
      setCreating(false)
    }
  }

  async function confirmRemove() {
    if (!pendingRemove) return
    setRemoving(true)
    setRemoveError(null)
    try {
      await adminDelete(pendingRemove.id)
      setNotice(`Removed ${pendingRemove.name}.`)
      setPendingRemove(null)
      await load()
    } catch (e) {
      setRemoveError(errMessage(e))
    } finally {
      setRemoving(false)
    }
  }

  if (!adminAuthEnabled) {
    return (
      <Card className="p-6 text-[14px] text-muted">
        Connect Supabase (set the env vars) to manage admins.
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold text-ink">Admin List</h1>
        <p className="mt-1 text-[13px] text-muted">
          Backoffice accounts that can sign in here.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card className="p-0">
          <div className="flex items-center justify-between px-6 py-5">
            <h2 className="text-[17px] font-semibold text-ink">All admins</h2>
            <span className="gradient-brand-text text-[13px] font-semibold">
              {rows.length} total
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-y border-line text-[12px] text-muted">
                  <th className="py-3 pl-6 pr-3 font-medium">Name</th>
                  <th className="px-3 py-3 font-medium">Email</th>
                  <th className="px-3 py-3 font-medium">Added</th>
                  <th className="py-3 pr-6" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted">
                      Loading…
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-danger">
                      {error}
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted">
                      No admins yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-line/60 last:border-0 hover:bg-white/[0.02]"
                    >
                      <td className="py-4 pl-6 pr-3">
                        <span className="flex items-center gap-3">
                          <span className="grid size-8 place-items-center rounded-full bg-white/[0.06] text-ink-200">
                            <IconUsers width={15} height={15} />
                          </span>
                          <span className="font-semibold text-ink">{a.name}</span>
                          {session?.id === a.id ? (
                            <span className="rounded-md bg-brand/15 px-1.5 py-0.5 text-[11px] text-brand-2">
                              you
                            </span>
                          ) : null}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-muted">{a.email}</td>
                      <td className="px-3 py-4 text-muted">{fmtDate(a.created_at)}</td>
                      <td className="py-4 pr-6 text-right">
                        {session?.id === a.id ? (
                          <span className="inline-flex text-muted/30" title="You can't remove your own account">
                            <IconTrash width={15} height={15} />
                          </span>
                        ) : (
                          <button
                            type="button"
                            aria-label={`Remove ${a.name}`}
                            title={rows.length <= 1 ? "Can't remove the last admin" : `Remove ${a.name}`}
                            disabled={rows.length <= 1}
                            onClick={() => {
                              setRemoveError(null)
                              setPendingRemove(a)
                            }}
                            className="inline-flex text-muted hover:text-danger disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <IconTrash width={15} height={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="h-fit p-6">
          <h2 className="text-[17px] font-semibold text-ink">Add admin</h2>
          <form className="mt-4 space-y-3.5" onSubmit={handleCreate}>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink-200">Name</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-[14px] text-ink placeholder:text-muted focus:border-brand-2 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink-200">Email</span>
              <span className="flex items-center gap-2.5 rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 focus-within:border-brand-2">
                <span className="text-muted">
                  <IconMail width={16} height={16} />
                </span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full bg-transparent text-[14px] text-ink placeholder:text-muted focus:outline-none"
                />
              </span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink-200">
                Temporary password
              </span>
              <span className="flex items-center gap-2.5 rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 focus-within:border-brand-2">
                <span className="text-muted">
                  <IconLock width={16} height={16} />
                </span>
                <input
                  required
                  type="text"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full bg-transparent text-[14px] text-ink placeholder:text-muted focus:outline-none"
                />
              </span>
            </label>

            {formError ? (
              <p className="rounded-lg bg-danger/12 px-3 py-2 text-[13px] text-danger">
                {formError}
              </p>
            ) : null}
            {notice ? (
              <p className="rounded-lg bg-success/12 px-3 py-2 text-[13px] text-success">
                {notice}
              </p>
            ) : null}

            <Button type="submit" disabled={creating} className="w-full py-2.5">
              {creating ? 'Adding…' : 'Add admin'}
            </Button>
          </form>
          <p className="mt-3 text-[12px] text-muted">
            Share the email and temporary password with the new admin. They can change it
            under Account settings.
          </p>
        </Card>
      </div>

      <ConfirmDialog
        open={pendingRemove !== null}
        title="Remove admin"
        message={
          pendingRemove ? (
            <>
              <strong className="text-ink-200">{pendingRemove.name}</strong> ({pendingRemove.email})
              will no longer be able to sign in to the backoffice.
            </>
          ) : null
        }
        confirmLabel="Remove admin"
        busy={removing}
        error={removeError}
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemove(null)}
      />
    </div>
  )
}
