import { NavLink } from 'react-router-dom'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import {
  Dropzone,
  Field,
  RichText,
  SaveButton,
  Select,
  TextInput,
} from '@/components/dashboard/form'
import {
  FileIcon,
  GearIcon,
  GlobeIcon,
  LinkIcon,
  MoreIcon,
  PlusCircleIcon,
  UserCircleIcon,
  UserIcon,
} from '@/components/icons'

const tabs = [
  { label: 'Personal', to: '/dashboard/settings', end: true, Icon: UserIcon },
  { label: 'Profile', to: '/dashboard/settings/profile', Icon: UserCircleIcon },
  { label: 'Social Links', to: '/dashboard/settings/social', Icon: GlobeIcon },
  { label: 'Account Setting', to: '/dashboard/settings/account', Icon: GearIcon },
]

const resumes = [
  { name: 'Professional Resume', size: '3.5 MB' },
  { name: 'Product Designer', size: '4.7 MB' },
  { name: 'Visual Designer', size: '1.3 MB' },
]

const socialPlatforms = ['Facebook', 'Twitter', 'Instagram', 'Youtube']

export function SettingsPage({
  tab,
}: {
  tab: 'personal' | 'profile' | 'social' | 'account'
}) {
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

        {tab === 'personal' && <PersonalTab />}
        {tab === 'profile' && <ProfileTab />}
        {tab === 'social' && <SocialTab />}
        {tab === 'account' && <AccountTab />}
      </div>
    </DashboardLayout>
  )
}

function PersonalTab() {
  return (
    <div className="flex flex-col gap-10">
      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex flex-col gap-6"
      >
        <h2 className="text-lg font-medium text-ink">Basic Information</h2>
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <div className="flex flex-col gap-2">
            <span className="text-sm text-ink">Profile Picture</span>
            <Dropzone
              className="h-[220px]"
              title={
                <>
                  <span className="font-medium text-ink">Browse photo</span> or
                  drop here
                </>
              }
              hint="A photo larger than 400 pixels work best. Max photo size 5 MB."
            />
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Full name">
              <TextInput />
            </Field>
            <Field label="Tittle/headline">
              <TextInput />
            </Field>
            <Field label="Experience">
              <Select options={['Select...', '1-2 Years', '2-4 Years', '4+ Years']} />
            </Field>
            <Field label="Educations">
              <Select options={['Select...', 'Graduation', 'Master Degree']} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Personal Website">
                <TextInput placeholder="Website url..." icon={<LinkIcon className="size-5" />} />
              </Field>
            </div>
          </div>
        </div>
        <SaveButton />
      </form>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-medium text-ink">Your Cv/Resume</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resumes.map((r) => (
            <div
              key={r.name}
              className="flex items-center justify-between gap-3 rounded-lg bg-surface-alt/60 p-4"
            >
              <span className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded bg-surface text-brand">
                  <FileIcon className="size-5" />
                </span>
                <span className="flex flex-col">
                  <span className="text-sm font-medium text-ink">{r.name}</span>
                  <span className="text-xs text-muted">{r.size}</span>
                </span>
              </span>
              <button type="button" aria-label="Resume options" className="text-muted">
                <MoreIcon className="size-5" />
              </button>
            </div>
          ))}
          <Dropzone
            title={
              <>
                <span className="inline-flex items-center gap-2">
                  <PlusCircleIcon className="size-5 text-brand" /> Add Cv/Resume
                </span>
              </>
            }
            hint="Browse file or drop here. only pdf"
          />
        </div>
      </div>
    </div>
  )
}

function ProfileTab() {
  return (
    <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Nationality">
          <Select options={['Select...', 'Bangladesh', 'United States', 'India']} />
        </Field>
        <Field label="Date of Birth">
          <TextInput placeholder="dd/mm/yyyy" />
        </Field>
        <Field label="Gender">
          <Select options={['Select...', 'Male', 'Female', 'Others']} />
        </Field>
        <Field label="Marital Status">
          <Select options={['Select...', 'Single', 'Married']} />
        </Field>
        <Field label="Education">
          <Select options={['Select...', 'Graduation', 'Master Degree']} />
        </Field>
        <Field label="Experience">
          <Select options={['Select...', '1-2 Years', '2-4 Years', '4+ Years']} />
        </Field>
      </div>
      <Field label="Biography">
        <RichText placeholder="Write down your biography here. Let the employers know who you are..." />
      </Field>
      <SaveButton />
    </form>
  )
}

function SocialTab() {
  return (
    <form onSubmit={(e) => e.preventDefault()} className="flex max-w-[720px] flex-col gap-6">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <span className="text-sm text-ink">Social Link {i + 1}</span>
          <div className="flex items-center gap-3">
            <div className="relative w-[180px] shrink-0">
              <select
                defaultValue={socialPlatforms[i] ?? 'Facebook'}
                className="h-12 w-full appearance-none rounded-md border border-line bg-surface px-4 pr-9 text-sm text-ink outline-none focus:border-brand"
              >
                {socialPlatforms.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
            <input
              type="url"
              placeholder="Profile link/url..."
              className="h-12 flex-1 rounded-md border border-line bg-surface px-4 text-base text-ink outline-none focus:border-brand placeholder:text-muted-400"
            />
            <button
              type="button"
              aria-label="Remove"
              className="grid size-12 shrink-0 place-items-center rounded-md bg-surface-alt text-muted"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="flex items-center justify-center gap-2 rounded-md bg-surface-alt py-3 text-sm font-medium text-ink"
      >
        <PlusCircleIcon className="size-5" />
        Add New Social Link
      </button>
      <SaveButton />
    </form>
  )
}

function AccountTab() {
  return (
    <div className="flex max-w-[720px] flex-col gap-10">
      <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-6">
        <h2 className="text-lg font-medium text-ink">Contact Info</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Map Location">
            <TextInput />
          </Field>
          <Field label="Phone">
            <TextInput placeholder="Phone number.." />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Email">
              <TextInput type="email" placeholder="Email address" />
            </Field>
          </div>
        </div>
        <SaveButton />
      </form>

      <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-6">
        <h2 className="text-lg font-medium text-ink">Change Password</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          <Field label="Current Password">
            <TextInput type="password" />
          </Field>
          <Field label="New Password">
            <TextInput type="password" />
          </Field>
          <Field label="Confirm Password">
            <TextInput type="password" />
          </Field>
        </div>
        <SaveButton />
      </form>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-medium text-ink">Delete Your Account</h2>
        <p className="text-sm text-muted-600">
          If you delete your MyJob account, you will no longer be able to get
          information about the matched jobs, following employers, and job alert,
          shortlisted jobs and more. You will be abandoned from all the services
          of MyJob.com.
        </p>
        <button
          type="button"
          className="flex w-fit items-center gap-2 text-sm font-medium text-danger"
        >
          Close Account
        </button>
      </div>
    </div>
  )
}
