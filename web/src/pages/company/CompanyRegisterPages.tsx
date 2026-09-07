import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { EmployerDashboardLayout } from '@/components/dashboard/EmployerDashboardLayout'
import { Field, TextInput } from '@/components/dashboard/form'
import { SelectMenu, type Option } from '@/components/app/SelectMenu'
import { CheckboxGroup } from '@/components/wizard/CheckboxGroup'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { LinkIcon, MailIcon, PhoneIcon } from '@/components/icons'
import { errMessage } from '@/lib/errors'
import { useCategoryNames } from '@/lib/categories'
import {
  updateMyEmployer,
  uploadEmployerLogo,
  useEmployer,
} from '@/lib/employers'

const INDUSTRIES = [
  'Technology',
  'Fintech / Payments',
  'Finance',
  'Healthcare',
  'Retail',
  'Education',
  'Manufacturing',
  'Media',
  'Other',
]
const SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001+']
// Same list as the backoffice job editor.
const LOCATIONS = ['Malaysia', 'Singapore']

/** Keeps an unknown existing value selectable (backoffice's withCurrent). */
const withCurrent = (base: string[], current: string): Option[] => [
  { value: '', label: 'Select…' },
  ...base.map((v) => ({ value: v, label: v })),
  ...(current && !base.includes(current) ? [{ value: current, label: current }] : []),
]

type FormState = {
  company_name: string
  reg_no: string
  business_email: string
  industry: string
  size: string
  location: string
  website: string
  phone: string
  founded: string
  logo_url: string
  field: string[]
  looking_for: string[]
  business_details: string
  about: string
}

const empty: FormState = {
  company_name: '',
  reg_no: '',
  business_email: '',
  industry: '',
  size: '',
  location: '',
  website: '',
  phone: '',
  founded: '',
  logo_url: '',
  field: [],
  looking_for: [],
  business_details: '',
  about: '',
}

export function EmployerProfilePage() {
  const { employer, session, loading, reload } = useEmployer()
  const categoryNames = useCategoryNames()
  const [form, setForm] = useState<FormState>(empty)
  const [saving, setSaving] = useState(false)
  const [logoBusy, setLogoBusy] = useState(false)

  useEffect(() => {
    if (!employer) return
    setForm({
      company_name: employer.company_name ?? '',
      reg_no: employer.reg_no ?? '',
      business_email: employer.business_email ?? '',
      industry: employer.industry ?? '',
      size: employer.size ?? '',
      location: employer.location ?? '',
      website: employer.website ?? '',
      phone: employer.phone ?? '',
      founded: employer.founded ?? '',
      logo_url: employer.logo_url ?? '',
      field: employer.field ?? [],
      looking_for: employer.looking_for ?? [],
      business_details: employer.business_details ?? '',
      about: employer.about ?? '',
    })
  }, [employer])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const toggle = (key: 'field' | 'looking_for', value: string) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value)
        ? f[key].filter((v) => v !== value)
        : [...f[key], value],
    }))

  async function handleLogo(file: File | null) {
    if (!file || !session) return
    setLogoBusy(true)
    try {
      const url = await uploadEmployerLogo(session.user.id, file)
      set('logo_url', url)
      toast.success('Logo uploaded — remember to Save Changes')
    } catch (err) {
      toast.error(errMessage(err))
    } finally {
      setLogoBusy(false)
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!employer) return
    setSaving(true)
    try {
      await updateMyEmployer(employer.id, {
        company_name: form.company_name.trim() || employer.company_name,
        reg_no: form.reg_no.trim() || employer.reg_no,
        business_email: form.business_email.trim() || employer.business_email,
        industry: form.industry || null,
        size: form.size || null,
        location: form.location || null,
        website: form.website || null,
        phone: form.phone || null,
        founded: form.founded || null,
        logo_url: form.logo_url || null,
        field: form.field,
        looking_for: form.looking_for,
        business_details: form.business_details || null,
        about: form.about || null,
      })
      toast.success('Company profile saved')
      await reload()
    } catch (err) {
      toast.error(errMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <EmployerDashboardLayout>
      <form onSubmit={handleSubmit} className="flex max-w-[760px] flex-col gap-6">
        <h1 className="text-2xl font-medium text-ink">Company Profile</h1>

        {!loading && !employer && (
          <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
            No employer account found for this login.
          </p>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Company name">
            <TextInput
              value={form.company_name}
              onChange={(e) => set('company_name', e.target.value)}
            />
          </Field>
          <Field label="Registration No.">
            <TextInput
              value={form.reg_no}
              onChange={(e) => set('reg_no', e.target.value)}
            />
          </Field>
        </div>

        <Field label="Business Email">
          <TextInput
            type="email"
            icon={<MailIcon className="size-5" />}
            value={form.business_email}
            onChange={(e) => set('business_email', e.target.value)}
          />
        </Field>

        <div className="grid gap-6 sm:grid-cols-3">
          <Field label="Industry">
            <SelectMenu
              options={withCurrent(INDUSTRIES, form.industry)}
              value={form.industry}
              onChange={(v) => set('industry', v)}
            />
          </Field>
          <Field label="Team size">
            <SelectMenu
              options={withCurrent(SIZES, form.size)}
              value={form.size}
              onChange={(v) => set('size', v)}
            />
          </Field>
          <Field label="Location">
            <SelectMenu
              options={withCurrent(LOCATIONS, form.location)}
              value={form.location}
              onChange={(v) => set('location', v)}
            />
          </Field>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Website">
            <TextInput
              type="url"
              placeholder="https://company.com"
              icon={<LinkIcon className="size-5" />}
              value={form.website}
              onChange={(e) => set('website', e.target.value)}
            />
          </Field>
          <Field label="Phone">
            <TextInput
              placeholder="+1 202 555 0178"
              icon={<PhoneIcon className="size-5" />}
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
            />
          </Field>
          <Field label="Founded">
            <TextInput
              placeholder="e.g. 2015"
              value={form.founded}
              onChange={(e) => set('founded', e.target.value)}
            />
          </Field>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm text-ink">Company Logo</span>
          <div className="flex items-center gap-4">
            {form.logo_url ? (
              <img
                src={form.logo_url}
                alt="Company logo"
                className="size-16 shrink-0 rounded-md border border-line object-cover"
              />
            ) : (
              <span className="grid size-16 shrink-0 place-items-center rounded-md border border-dashed border-line text-xs text-muted">
                Logo
              </span>
            )}
            <label className="cursor-pointer rounded-md border border-line px-4 py-2 text-sm font-medium text-ink-600 hover:bg-surface-alt">
              {logoBusy ? 'Uploading…' : form.logo_url ? 'Replace image' : 'Upload image'}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={logoBusy || !employer}
                onChange={(e) => handleLogo(e.target.files?.[0] ?? null)}
              />
            </label>
            {form.logo_url && (
              <button
                type="button"
                onClick={() => set('logo_url', '')}
                className="text-sm text-muted hover:text-danger"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        <CheckboxGroup
          label="Business Field"
          options={categoryNames}
          selected={form.field}
          onToggle={(v) => toggle('field', v)}
        />
        <CheckboxGroup
          label="Looking to Hire"
          options={categoryNames}
          selected={form.looking_for}
          onToggle={(v) => toggle('looking_for', v)}
        />

        <Field label="Business Details">
          <textarea
            rows={4}
            placeholder="Short summary of the company for the registration record…"
            className="w-full resize-none rounded-md border border-line bg-surface p-4 text-base text-ink outline-none focus:border-brand placeholder:text-muted-400"
            value={form.business_details}
            onChange={(e) => set('business_details', e.target.value)}
          />
        </Field>

        <Field label="About us">
          {employer ? (
            <RichTextEditor
              key={employer.id}
              value={employer.about ?? ''}
              onChange={(html) => set('about', html)}
              placeholder="What the company does, mission, notable customers…"
            />
          ) : (
            <div className="h-44 rounded-md border border-line bg-surface-alt/40" />
          )}
        </Field>

        <button
          type="submit"
          disabled={saving || !employer}
          className="w-fit rounded-[4px] bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </EmployerDashboardLayout>
  )
}

// The old multi-step onboarding flow is now a single profile page. Keep the
// export names so the router keeps resolving.
export const CompanyInfoStep = EmployerProfilePage
export const FoundingInfoStep = EmployerProfilePage
export const CompanySocialStep = EmployerProfilePage
export const CompanyContactStep = EmployerProfilePage
export const CompanyRegisterSuccess = EmployerProfilePage
