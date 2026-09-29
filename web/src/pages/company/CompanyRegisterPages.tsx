import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { EmployerDashboardLayout } from '@/components/dashboard/EmployerDashboardLayout'
import { Field, PhoneInput, TextInput } from '@/components/dashboard/form'
import { SelectMenu, type Option } from '@/components/app/SelectMenu'
import { CheckboxGroup } from '@/components/wizard/CheckboxGroup'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { LinkIcon, MailIcon } from '@/components/icons'
import { errMessage } from '@/lib/errors'
import { nationalFromStored, toStoredPhone, validateCountryPhone } from '@/lib/phone'
import { COUNTRY_NAMES_EN, MIN_BUSINESS_TEXT, plainTextLength, validateBusinessRegNo } from '@/lib/partly'
import { useCategoryNames } from '@/lib/categories'
import { clearDisplayUserCache } from '@/lib/useDisplayUser'
import {
  updateMyEmployer,
  uploadEmployerLogo,
  useEmployer,
} from '@/lib/employers'
import { useT } from '@/lib/i18n'
import { optionLabel } from '@/lib/optionLabels'

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
// Every country a business can register from (same list as the sign-up wizard).
const LOCATIONS = Object.values(COUNTRY_NAMES_EN)

/** Keeps an unknown existing value selectable (backoffice's withCurrent). */
const withCurrent = (base: string[], current: string, placeholder: string): Option[] => {
  return ([
  { value: '', label: placeholder },
  ...base.map((v) => ({ value: v, label: optionLabel(v) })),
  ...(current && !base.includes(current) ? [{ value: current, label: current }] : []),
])
}

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
  const t = useT()
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
      phone: nationalFromStored(employer.country_code, employer.phone),
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
      toast.success(t('ui.logo_uploaded_remember_to_save_changes'))
    } catch (err) {
      toast.error(errMessage(err))
    } finally {
      setLogoBusy(false)
    }
  }

  // Save stays disabled until every required field is filled and valid.
  const missing: string[] = []
  if (!form.company_name.trim()) missing.push(t('miss.company'))
  if (!form.reg_no.trim()) missing.push(t('miss.reg'))
  if (!form.industry) missing.push(t('miss.industry'))
  if (!form.size) missing.push(t('miss.size'))
  if (!form.location) missing.push(t('miss.location'))
  if (form.field.length === 0) missing.push(t('miss.field'))
  if (form.looking_for.length === 0) missing.push(t('miss.looking'))
  if (!form.phone.trim()) missing.push(t('miss.phone'))
  if (!form.business_details.trim()) missing.push(t('miss.details'))
  if (plainTextLength(form.about) === 0) missing.push(t('miss.about'))

  const problems: string[] = []
  if (form.phone.trim()) {
    const phoneErr = validateCountryPhone(employer?.country_code, form.phone)
    if (phoneErr) problems.push(phoneErr)
  }
  if (
    (form.business_details.trim() && form.business_details.trim().length < MIN_BUSINESS_TEXT) ||
    (plainTextLength(form.about) > 0 && plainTextLength(form.about) < MIN_BUSINESS_TEXT)
  ) {
    problems.push(t('miss.min_chars', { min: MIN_BUSINESS_TEXT }))
  }
  if (employer && form.reg_no.trim()) {
    const regErr = validateBusinessRegNo(employer.country_code ?? '', form.reg_no.trim())
    if (regErr) problems.push(regErr)
  }
  const canSave = !!employer && missing.length === 0 && problems.length === 0

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!employer || !canSave) return
    setSaving(true)
    try {
      await updateMyEmployer(employer.id, {
        company_name: form.company_name.trim(),
        reg_no: form.reg_no.trim(),
        industry: form.industry || null,
        size: form.size || null,
        location: form.location || null,
        website: form.website || null,
        phone: toStoredPhone(employer.country_code, form.phone),
        founded: form.founded || null,
        logo_url: form.logo_url || null,
        field: form.field,
        looking_for: form.looking_for,
        business_details: form.business_details.trim(),
        about: form.about,
      })
      toast.success(t('ui.company_profile_saved'))
      clearDisplayUserCache()
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
        <h1 className="text-2xl font-medium text-ink">{t('ui.company_profile')}</h1>

        {!loading && !employer && (
          <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{t('ui.no_employer_account_found_for_this')}</p>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label={t('ui.company_name_2')}>
            <TextInput
              value={form.company_name}
              onChange={(e) => set('company_name', e.target.value)}
            />
          </Field>
          <Field label={t('ui.registration_no')}>
            <TextInput
              value={form.reg_no}
              onChange={(e) => set('reg_no', e.target.value)}
            />
          </Field>
        </div>

        <Field label={t('ui.business_email')}>
          <TextInput
            type="email"
            icon={<MailIcon className="size-5" />}
            value={form.business_email}
            disabled
            readOnly
            title={t('ui.this_is_the_email_you_sign')}
          />
          <p className="mt-1 text-xs text-muted">{t('ui.this_is_your_sign_in_email')}</p>
        </Field>

        <div className="grid gap-6 sm:grid-cols-3">
          <Field label={t('ui.industry')}>
            <SelectMenu
              options={withCurrent(INDUSTRIES, form.industry, t('ui.select_3'))}
              value={form.industry}
              onChange={(v) => set('industry', v)}
            />
          </Field>
          <Field label={t('ui.team_size_2')}>
            <SelectMenu
              options={withCurrent(SIZES, form.size, t('ui.select_3'))}
              value={form.size}
              onChange={(v) => set('size', v)}
            />
          </Field>
          <Field label={t('ui.location_2')}>
            <SelectMenu
              options={withCurrent(LOCATIONS, form.location, t('ui.select_3'))}
              value={form.location}
              onChange={(v) => set('location', v)}
            />
          </Field>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label={t('ui.website')}>
            <TextInput
              type="url"
              placeholder="https://company.com"
              icon={<LinkIcon className="size-5" />}
              value={form.website}
              onChange={(e) => set('website', e.target.value)}
            />
          </Field>
          <Field label={t('ui.phone_2')}>
            <PhoneInput
              country={employer?.country_code}
              value={form.phone}
              onChange={(v) => set('phone', v)}
              invalid={!!form.phone.trim() && !!validateCountryPhone(employer?.country_code, form.phone)}
            />
            {form.phone.trim() && validateCountryPhone(employer?.country_code, form.phone) && (
              <p className="mt-1 text-xs text-danger">{validateCountryPhone(employer?.country_code, form.phone)}</p>
            )}
          </Field>
          <Field label={t('ui.founded')}>
            <TextInput
              placeholder="e.g. 2015"
              value={form.founded}
              onChange={(e) => set('founded', e.target.value)}
            />
          </Field>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm text-ink">{t('ui.company_logo')}</span>
          <div className="flex items-center gap-4">
            {form.logo_url ? (
              <img
                src={form.logo_url}
                alt={t('ui.company_logo_2')}
                className="size-16 shrink-0 rounded-md border border-line object-cover"
              />
            ) : (
              <span className="grid size-16 shrink-0 place-items-center rounded-md border border-dashed border-line text-xs text-muted">{t('ui.logo')}</span>
            )}
            <label className="cursor-pointer rounded-md border border-line px-4 py-2 text-sm font-medium text-ink-600 hover:bg-surface-alt">
              {logoBusy ? t('ui.uploading') : form.logo_url ? t('ui.replace_image') : t('ui.upload_image')}
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
              >{t('ui.remove')}</button>
            )}
          </div>
        </div>

        <CheckboxGroup
          label={t('ui.business_field')}
          options={categoryNames}
          selected={form.field}
          onToggle={(v) => toggle('field', v)}
        />
        <CheckboxGroup
          label={t('ui.looking_to_hire')}
          options={categoryNames}
          selected={form.looking_for}
          onToggle={(v) => toggle('looking_for', v)}
        />

        <Field label={t('ui.business_details')}>
          <textarea
            rows={4}
            placeholder={t('ui.short_summary_of_the_company_for')}
            className="w-full resize-none rounded-md border border-line bg-surface p-4 text-base text-ink outline-none focus:border-brand placeholder:text-muted-400"
            value={form.business_details}
            onChange={(e) => set('business_details', e.target.value)}
          />
        </Field>

        <Field label={t('ui.about_us_2')}>
          {employer ? (
            <RichTextEditor
              key={employer.id}
              value={employer.about ?? ''}
              onChange={(html) => set('about', html)}
              placeholder={t('ui.what_the_company_does_mission_notable')}
            />
          ) : (
            <div className="h-44 rounded-md border border-line bg-surface-alt/40" />
          )}
        </Field>

        <div className="flex flex-col gap-2">
          <button
            type="submit"
            disabled={saving || !canSave}
            className="w-fit rounded-[4px] bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? t('ui.saving_2') : t('ui.save_changes')}
          </button>
          {employer && missing.length > 0 && (
            <span className="text-xs text-muted">{t('ui.missing_to_save', { v: missing.join(', ') })}</span>
          )}
          {employer && missing.length === 0 && problems.length > 0 && (
            <span className="text-xs text-danger">{problems[0]}</span>
          )}
        </div>
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
