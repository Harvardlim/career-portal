import {
  useCallback,
  useEffect,
  useId,
  useState,
  type FormEvent,
} from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Field, SaveButton, Select, TextInput } from '@/components/dashboard/form'
import {
  FileIcon,
  GearIcon,
  PlusCircleIcon,
  TrashIcon,
  UserCircleIcon,
  UserIcon,
} from '@/components/icons'
import { experienceRanges } from '@/data/categories'
import { supabase } from '@/lib/supabase'
import { errMessage } from '@/lib/errors'
import { initialsFromName } from '@/lib/name'
import { clearDisplayUserCache } from '@/lib/useDisplayUser'
import { useSession } from '@/lib/useSession'
import {
  deleteResume,
  fetchMyCandidate,
  fetchMyResumes,
  formatFileSize,
  updateMyCandidate,
  uploadCandidateAvatar,
  uploadResume,
  type CandidateProfileRow,
  type ResumeRow,
} from '@/lib/candidateProfile'

const tabs = [
  { label: 'Personal', to: '/dashboard/settings', end: true, Icon: UserIcon },
  { label: 'Profile', to: '/dashboard/settings/profile', Icon: UserCircleIcon },
  { label: 'Account Setting', to: '/dashboard/settings/account', Icon: GearIcon },
]

const experienceOptions = ['Select...', ...experienceRanges]
const educationOptions = [
  'Select...',
  'High School',
  'Diploma',
  'Bachelor Degree',
  'Master Degree',
  'PhD',
]
const nationalityOptions = [
  'Select...',
  'Malaysia',
  'Singapore',
  'Indonesia',
  'India',
  'United States',
  'United Kingdom',
  'Other',
]
const genderOptions = ['Select...', 'Male', 'Female', 'Other']
const maritalOptions = ['Select...', 'Single', 'Married', 'Other']

type SetField = <K extends keyof CandidateProfileRow>(
  key: K,
  value: CandidateProfileRow[K],
) => void
type Save = (keys: (keyof CandidateProfileRow)[]) => void | Promise<void>

type TabProps = {
  profile: CandidateProfileRow
  setField: SetField
  save: Save
  saving: boolean
}

export function SettingsPage({
  tab,
}: {
  tab: 'personal' | 'profile' | 'account'
}) {
  const { session } = useSession()
  const userId = session?.user?.id ?? null
  const navigate = useNavigate()

  const [profile, setProfile] = useState<CandidateProfileRow | null>(null)
  const [resumes, setResumes] = useState<ResumeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [accountEmail, setAccountEmail] = useState<string | null>(null)
  const [closePrompt, setClosePrompt] = useState(false)
  const [closing, setClosing] = useState(false)

  const loadResumes = useCallback(async (candidateId: string) => {
    try {
      setResumes(await fetchMyResumes(candidateId))
    } catch (err) {
      console.error('Failed to load resumes', err)
    }
  }, [])

  useEffect(() => {
    if (!userId) return
    let alive = true
    fetchMyCandidate(userId)
      .then(async (row) => {
        if (!alive) return
        setProfile(row)
        setAccountEmail(row?.email ?? null)
        if (row) await loadResumes(row.id)
      })
      .catch((err) => toast.error(errMessage(err)))
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [userId, loadResumes])

  const setField = useCallback<SetField>((key, value) => {
    setProfile((p) => (p ? { ...p, [key]: value } : p))
  }, [])

  const save = useCallback<Save>(
    async (keys) => {
      if (!userId || !profile) return
      setSaving(true)
      try {
        const patch = Object.fromEntries(
          keys.map((k) => [k, profile[k]]),
        ) as Partial<CandidateProfileRow>
        await updateMyCandidate(userId, patch)

        // Name / photo feed the header avatar — drop the cached copy.
        if (keys.includes('full_name') || keys.includes('avatar_path')) {
          clearDisplayUserCache()
        }

        if (
          keys.includes('email') &&
          profile.email &&
          profile.email !== accountEmail
        ) {
          const { error } = await supabase.auth.updateUser({ email: profile.email })
          if (error) throw error
          setAccountEmail(profile.email)
          toast.success('Saved. Check your inbox to confirm the new email.')
        } else {
          toast.success('Changes saved')
        }
      } catch (err) {
        toast.error(errMessage(err))
      } finally {
        setSaving(false)
      }
    },
    [userId, profile, accountEmail],
  )

  async function confirmCloseAccount() {
    if (!profile) return
    setClosing(true)
    try {
      const { error } = await supabase.from('candidates').delete().eq('id', profile.id)
      if (error) throw error
      // Note: the underlying auth user is left in place — deleting it needs a
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
        <h1 className="text-2xl font-medium text-ink">Settings</h1>

        <div className="flex flex-wrap gap-6 border-b border-line">
          {tabs.map(({ label, to, end, Icon }) => (
            <NavLink
              key={label}
              to={to}
              end={end}
              className={({ isActive }) =>
                `-mb-px flex items-center gap-2 border-b-2 pb-3 text-sm ${
                  isActive
                    ? 'border-brand font-medium text-brand'
                    : 'border-transparent text-muted-600 hover:text-ink'
                }`
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-muted">Loading...</p>
        ) : !profile ? (
          <p className="text-sm text-muted">
            No candidate profile found for this account.
          </p>
        ) : (
          <>
            {tab === 'personal' && (
              <PersonalTab
                profile={profile}
                setField={setField}
                save={save}
                saving={saving}
                userId={userId}
                resumes={resumes}
                reloadResumes={() => profile && loadResumes(profile.id)}
              />
            )}
            {tab === 'profile' && (
              <ProfileTab
                profile={profile}
                setField={setField}
                save={save}
                saving={saving}
              />
            )}
            {tab === 'account' && (
              <AccountTab
                profile={profile}
                setField={setField}
                save={save}
                saving={saving}
                accountEmail={accountEmail ?? profile.email ?? ''}
                onCloseAccount={() => setClosePrompt(true)}
              />
            )}
          </>
        )}
      </div>

      {closePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-[420px] rounded-xl bg-surface p-6 shadow-2xl">
            <h2 className="text-lg font-medium text-ink">Close your account?</h2>
            <p className="mt-2 text-sm text-muted-600">
              This permanently removes your candidate profile, resumes, applications
              and saved jobs, and signs you out. This can&apos;t be undone.
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

/* ---------- Personal ---------- */

function PersonalTab({
  profile,
  setField,
  save,
  saving,
  userId,
  resumes,
  reloadResumes,
}: TabProps & {
  userId: string | null
  resumes: ResumeRow[]
  reloadResumes: () => void
}) {
  return (
    <div className="flex flex-col gap-10">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          save(['full_name', 'avatar_path'])
        }}
        className="flex flex-col gap-6"
      >
        <h2 className="text-lg font-medium text-ink">Basic Information</h2>
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <div className="flex flex-col gap-2">
            <span className="text-sm text-ink">Profile Photo</span>
            <AvatarField
              userId={userId}
              name={profile.full_name ?? ''}
              url={profile.avatar_path}
              onChange={(url) => setField('avatar_path', url)}
            />
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Full name">
              <TextInput
                value={profile.full_name ?? ''}
                onChange={(e) => setField('full_name', e.target.value)}
              />
            </Field>
          </div>
        </div>
        <SaveButton disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </SaveButton>
      </form>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-medium text-ink">Your Cv/Resume</h2>
        <ResumeList
          candidateId={profile.id}
          resumes={resumes}
          onChange={reloadResumes}
        />
      </div>
    </div>
  )
}

function AvatarField({
  userId,
  name,
  url,
  onChange,
}: {
  userId: string | null
  name: string
  url: string | null
  onChange: (url: string | null) => void
}) {
  const [busy, setBusy] = useState(false)
  const initials = initialsFromName(name)

  async function handleFile(file: File | null) {
    if (!file || !userId) return
    setBusy(true)
    try {
      const uploaded = await uploadCandidateAvatar(userId, file)
      onChange(uploaded)
      toast.success('Photo uploaded — hit Save Changes to keep it')
    } catch (err) {
      toast.error(errMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-3">
      {url ? (
        <img
          src={url}
          alt={name || 'Profile'}
          className="size-28 rounded-full border border-line object-cover"
        />
      ) : (
        <div className="grid size-28 place-items-center rounded-full bg-brand-50 text-2xl font-semibold text-brand">
          {initials || <UserCircleIcon className="size-10" />}
        </div>
      )}
      <div className="flex items-center gap-3">
        <label className="cursor-pointer rounded-md border border-line px-4 py-2 text-sm font-medium text-ink-600 hover:bg-surface-alt">
          {busy ? 'Uploading…' : url ? 'Replace' : 'Upload photo'}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={busy || !userId}
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </label>
        {url && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-sm text-muted hover:text-danger"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  )
}

function ResumeList({
  candidateId,
  resumes,
  onChange,
}: {
  candidateId: string
  resumes: ResumeRow[]
  onChange: () => void
}) {
  const id = useId()
  const [busy, setBusy] = useState(false)

  async function handleAdd(file: File | null) {
    if (!file) return
    setBusy(true)
    try {
      await uploadResume(candidateId, file)
      toast.success('Resume uploaded')
      onChange()
    } catch (err) {
      toast.error(errMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(row: ResumeRow) {
    try {
      await deleteResume(row)
      toast.success('Resume removed')
      onChange()
    } catch (err) {
      toast.error(errMessage(err))
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {resumes.map((r) => (
        <div
          key={r.id}
          className="flex items-center justify-between gap-3 rounded-lg bg-surface-alt/60 p-4"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded bg-surface text-brand">
              <FileIcon className="size-5" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium text-ink">
                {r.file_name}
              </span>
              <span className="text-xs text-muted">
                {formatFileSize(r.size_bytes)}
              </span>
            </span>
          </span>
          <button
            type="button"
            aria-label={`Remove ${r.file_name}`}
            onClick={() => handleDelete(r)}
            className="shrink-0 text-muted hover:text-danger"
          >
            <TrashIcon className="size-5" />
          </button>
        </div>
      ))}
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-surface-alt/40 p-6 text-center hover:border-brand">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-ink">
          <PlusCircleIcon className="size-5 text-brand" />
          {busy ? 'Uploading...' : 'Add Cv/Resume'}
        </span>
        <span className="text-xs text-muted">Browse file or drop here. PDF or DOCX.</span>
        <input
          id={id}
          type="file"
          accept=".pdf,.doc,.docx"
          className="sr-only"
          onChange={(e) => handleAdd(e.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  )
}

/* ---------- Profile ---------- */

function ProfileTab({ profile, setField, save, saving }: TabProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        save([
          'nationality',
          'date_of_birth',
          'gender',
          'marital_status',
          'education',
          'years_experience',
          'biography',
        ])
      }}
      className="flex flex-col gap-6"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Nationality">
          <Select
            options={nationalityOptions}
            value={profile.nationality ?? ''}
            onChange={(e) => setField('nationality', e.target.value || null)}
          />
        </Field>
        <Field label="Date of Birth">
          <TextInput
            type="date"
            value={profile.date_of_birth ?? ''}
            onChange={(e) => setField('date_of_birth', e.target.value || null)}
          />
        </Field>
        <Field label="Gender">
          <Select
            options={genderOptions}
            value={profile.gender ?? ''}
            onChange={(e) => setField('gender', e.target.value || null)}
          />
        </Field>
        <Field label="Marital Status">
          <Select
            options={maritalOptions}
            value={profile.marital_status ?? ''}
            onChange={(e) => setField('marital_status', e.target.value || null)}
          />
        </Field>
        <Field label="Education">
          <Select
            options={educationOptions}
            value={profile.education ?? ''}
            onChange={(e) => setField('education', e.target.value || null)}
          />
        </Field>
        <Field label="Experience">
          <Select
            options={experienceOptions}
            value={profile.years_experience ?? ''}
            onChange={(e) => setField('years_experience', e.target.value || null)}
          />
        </Field>
      </div>
      <Field label="Biography">
        <textarea
          rows={6}
          placeholder="Write down your biography here. Let the employers know who you are..."
          className="w-full resize-none rounded-md border border-line bg-surface p-4 text-base text-ink outline-none focus:border-brand placeholder:text-muted-400"
          value={profile.biography ?? ''}
          onChange={(e) => setField('biography', e.target.value || null)}
        />
      </Field>
      <SaveButton disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </SaveButton>
    </form>
  )
}

/* ---------- Account Setting ---------- */

function AccountTab({
  profile,
  setField,
  save,
  saving,
  accountEmail,
  onCloseAccount,
}: TabProps & { accountEmail: string; onCloseAccount: () => void }) {
  return (
    <div className="flex max-w-[720px] flex-col gap-10">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          save(['contact_number', 'email'])
        }}
        className="flex flex-col gap-6"
      >
        <h2 className="text-lg font-medium text-ink">Contact Info</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Phone">
            <TextInput
              placeholder="Phone number.."
              value={profile.contact_number ?? ''}
              onChange={(e) => setField('contact_number', e.target.value || null)}
            />
          </Field>
          <Field label="Email">
            <TextInput
              type="email"
              placeholder="Email address"
              value={profile.email ?? ''}
              onChange={(e) => setField('email', e.target.value || null)}
            />
          </Field>
        </div>
        <SaveButton disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </SaveButton>
      </form>

      <ChangePasswordForm accountEmail={accountEmail} />

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-medium text-ink">Delete Your Account</h2>
        <p className="text-sm text-muted-600">
          If you delete your Partly Asia account, you will no longer be able to get
          information about the matched jobs, following employers, and job alert,
          shortlisted jobs and more. You will be abandoned from all the services
          of partly.asia.
        </p>
        <button
          type="button"
          onClick={onCloseAccount}
          className="flex w-fit items-center gap-2 text-sm font-medium text-danger"
        >
          <TrashIcon className="size-4" />
          Close Account
        </button>
      </div>
    </div>
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
          <TextInput
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </Field>
        <Field label="New Password">
          <TextInput
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </Field>
        <Field label="Confirm Password">
          <TextInput
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>
      </div>
      <SaveButton disabled={busy}>
        {busy ? 'Saving...' : 'Save Changes'}
      </SaveButton>
    </form>
  )
}
