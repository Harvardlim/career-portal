import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Field, SaveButton, TextInput } from '@/components/dashboard/form'
import { TrashIcon } from '@/components/icons'
import { supabase } from '@/lib/supabase'
import { errMessage } from '@/lib/errors'
import { useSession } from '@/lib/useSession'
import { fetchMyCandidate, type CandidateProfileRow } from '@/lib/candidateProfile'

// Personal and contact details (name, photo, CV, phone, nationality, month
// and year of birth, gender, education) live on the Expert Profile page. This
// page is just account-level: password and closing the account.
export function SettingsPage() {
  const { session } = useSession()
  const userId = session?.user?.id ?? null
  const navigate = useNavigate()

  const [profile, setProfile] = useState<CandidateProfileRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [accountEmail, setAccountEmail] = useState<string | null>(null)
  const [closePrompt, setClosePrompt] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (!userId) return
    let alive = true
    fetchMyCandidate(userId)
      .then((row) => {
        if (!alive) return
        setProfile(row)
        setAccountEmail(row?.email ?? null)
      })
      .catch((err) => toast.error(errMessage(err)))
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [userId])

  async function confirmCloseAccount() {
    if (!profile) return
    setClosing(true)
    try {
      const { error } = await supabase.from('candidates').delete().eq('id', profile.id)
      if (error) throw error
      // Note: the underlying auth user is left in place ,  deleting it needs a
      // service-role server function, which isn't set up.
      await supabase.auth.signOut()
      navigate('/')
    } catch (err) {
      toast.error(errMessage(err))
      setClosing(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <h1 className="text-2xl font-medium text-ink">Account Settings</h1>

        {loading ? (
          <p className="text-sm text-muted">Loading...</p>
        ) : !profile ? (
          <p className="text-sm text-muted">No expert profile found for this account.</p>
        ) : (
          <div className="flex max-w-[720px] flex-col gap-10">
            <ChangePasswordForm accountEmail={accountEmail ?? profile.email ?? ''} />

            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-medium text-ink">Delete Your Account</h2>
              <p className="text-sm text-muted-600">
                If you delete your partly.asia account, you will no longer be able to get information about your
                matches, warm leads, and applications. You will be removed from all of partly.asia's services.
              </p>
              <button
                type="button"
                onClick={() => setClosePrompt(true)}
                className="flex w-fit items-center gap-2 text-sm font-medium text-danger"
              >
                <TrashIcon className="size-4" />
                Close Account
              </button>
            </div>
          </div>
        )}
      </div>

      {closePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-[420px] rounded-xl bg-surface p-6 shadow-2xl">
            <h2 className="text-lg font-medium text-ink">Close your account?</h2>
            <p className="mt-2 text-sm text-muted-600">
              This permanently removes your expert profile, resumes, applications and leads, and signs you out. This
              can&apos;t be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={closing}
                onClick={() => setClosePrompt(false)}
                className="rounded-[4px] border border-line px-5 py-2.5 text-sm font-semibold text-ink-600 hover:text-ink disabled:opacity-50"
              >
                Keep my account
              </button>
              <button
                type="button"
                disabled={closing}
                onClick={confirmCloseAccount}
                className="rounded-[4px] bg-danger px-5 py-2.5 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-50"
              >
                {closing ? 'Closing…' : 'Close account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export function ChangePasswordForm({ accountEmail }: { accountEmail: string }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (next.length < 6) {
      toast.error('New password must be at least 6 characters.')
      return
    }
    if (next !== confirm) {
      toast.error('Passwords do not match.')
      return
    }
    setBusy(true)
    try {
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: accountEmail,
        password: current,
      })
      if (reauthError) {
        toast.error('Current password is incorrect.')
        return
      }
      const { error } = await supabase.auth.updateUser({ password: next })
      if (error) throw error
      toast.success('Password updated')
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (err) {
      toast.error(errMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <h2 className="text-lg font-medium text-ink">Change Password</h2>
      <div className="grid gap-6 sm:grid-cols-3">
        <Field label="Current Password">
          <TextInput type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </Field>
        <Field label="New Password">
          <TextInput type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
        </Field>
        <Field label="Confirm Password">
          <TextInput type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
      </div>
      <SaveButton disabled={busy}>{busy ? 'Saving...' : 'Save Changes'}</SaveButton>
    </form>
  )
}
