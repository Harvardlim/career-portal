import { useEffect, useId, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { RegWizardLayout, WizardButtons, type WizardStep } from '@/components/wizard/RegWizardLayout'
import { ConsentStep } from '@/components/wizard/ConsentStep'
import { Field, PhoneInput, Select, TextInput } from '@/components/dashboard/form'
import { SelectMenu } from '@/components/app/SelectMenu'
import { GoldCircle } from '@/components/marketing/blocks'
import { experienceRanges } from '@/data/categories'
import { supabase } from '@/lib/supabase'
import { errMessage } from '@/lib/errors'
import { recordReferralAtSignup } from '@/lib/affiliate'
import { lookupEmail, resolveAccountForRegister } from '@/lib/registerAccount'
import { AlreadySignedInNotice, RegisteredEmailDialog } from '@/components/auth/RegisteredEmailDialog'
import { FullyVerifiedBubble } from '@/components/partly/ui'
import { useSession } from '@/lib/useSession'
import { clearDisplayUserCache, useDisplayUser } from '@/lib/useDisplayUser'
import { useCategories } from '@/lib/categories'
import { toStoredPhone, validateCountryPhone } from '@/lib/phone'
import {
  EXPERT_COUNTRIES,
  ID_TYPE_BY_COUNTRY,
  ID_TYPE_EN,
  countryName,
  saveIdentityDigits,
  idLast4Problem,
  ID_LAST4_FORMAT,
  validateEmail,
  type ExpertCountry,
} from '@/lib/partly'
import {
  BriefcaseIcon,
  CheckIcon,
  CircleCheckIcon,
  LinkedinIcon,
  MailIcon,
  UploadIcon,
  UserIcon,
} from '@/components/icons'
import { useT, tr } from '@/lib/i18n'
import { categoryLabel } from '@/lib/categoryNames'

const steps: WizardStep[] = [
  { get label() { return tr('step.about') }, Icon: UserIcon },
  { get label() { return tr('step.expertise') }, Icon: BriefcaseIcon },
  { get label() { return tr('step.identity') }, Icon: CircleCheckIcon },
]

type FormState = {
  fullName: string
  country: ExpertCountry
  contactNumber: string
  email: string
  password: string
  confirmPassword: string
  headline: string
  businessName: string
  linkedin: string
  categories: string[]
  subcategoryIds: string[]
  yearsExperience: string
  pastExperience: string
  last4: string
}

const initialState: FormState = {
  fullName: '',
  country: 'SG',
  contactNumber: '',
  email: '',
  password: '',
  confirmPassword: '',
  headline: '',
  businessName: '',
  linkedin: '',
  categories: [],
  subcategoryIds: [],
  yearsExperience: '',
  pastExperience: '',
  last4: '',
}

function CvUpload({ file, onChange }: { file: File | null; onChange: (file: File | null) => void }) {
  const t = useT()
  const id = useId()
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-cream/60 p-6 text-center hover:border-gold"
    >
      <UploadIcon className="size-8 text-muted" />
      <p className="text-sm font-medium text-ink">
        {file ? (
          file.name
        ) : (
          <>
            <span className="text-brand">{t('ui.browse_file')}</span>{' '}{t('ui.or_drop_here')}</>
        )}
      </p>
      <p className="text-xs text-muted">{t('ui.pdf_or_docx_max_10_mb')}</p>
      <input id={id} type="file" accept=".pdf,.doc,.docx" className="sr-only" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
    </label>
  )
}

/** Expert sign-up: LinkedIn-style profile + the mandatory identity step. */
export function CandidateRegisterPage() {
  const t = useT()
  const { categories: allCategories } = useCategories()
  const navigate = useNavigate()
  const { session } = useSession()
  const { user: existingUser } = useDisplayUser()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(initialState)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [consented, setConsented] = useState(false)
  const [referralOptIn, setReferralOptIn] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<'confirm' | null>(null)
  const [identityDeferred, setIdentityDeferred] = useState(false)
  const [dupRole, setDupRole] = useState<'candidate' | 'employer' | null>(null)

  const signedInEmail = session?.user.email ?? ''
  useEffect(() => {
    if (signedInEmail) setForm((f) => ({ ...f, email: signedInEmail }))
  }, [signedInEmail])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }))

  const MAX_CATEGORIES = 2

  const toggleCategory = (name: string) =>
    setForm((f) => {
      const on = f.categories.includes(name)
      if (!on && f.categories.length >= MAX_CATEGORIES) {
        toast.error(t('ui.pick_up_to_main_categories', { MAX_CATEGORIES }))
        return f
      }
      const cat = allCategories.find((c) => c.name === name)
      const subIds = new Set(cat?.subcategories.map((s) => s.id) ?? [])
      return {
        ...f,
        categories: on ? f.categories.filter((c) => c !== name) : [...f.categories, name],
        subcategoryIds: on ? f.subcategoryIds.filter((id) => !subIds.has(id)) : f.subcategoryIds,
      }
    })

  const toggleSub = (id: string) =>
    setForm((f) => ({
      ...f,
      subcategoryIds: f.subcategoryIds.includes(id) ? f.subcategoryIds.filter((x) => x !== id) : [...f.subcategoryIds, id],
    }))

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (step === 0) {
      const emailErr = validateEmail(form.email)
      if (emailErr) return toast.error(emailErr)
      const phoneErr = validateCountryPhone(form.country, form.contactNumber)
      if (phoneErr) return toast.error(phoneErr)
      if (!session && form.password !== form.confirmPassword) return toast.error(t('ui.passwords_do_not_match'))
      // Catch an already-registered email on the first step, not at the end.
      setSubmitting(true)
      const check = await lookupEmail(form.email).catch(() => ({ role: null }))
      setSubmitting(false)
      if (check.role) return setDupRole(check.role)
    }
    if (step === 1 && form.categories.length === 0) return toast.error(t('ui.pick_at_least_one_area_of'))
    if (step === 1 && !form.yearsExperience) return toast.error(t('ui.select_your_years_of_experience_you'))
    if (step === 1 && !form.pastExperience.trim()) return toast.error(t('ui.add_a_short_experience_summary_businesses'))

    if (step < steps.length - 1) {
      setStep((s) => s + 1)
      setError(null)
      return
    }

    const idProblem = idLast4Problem(form.country, form.last4)
    if (idProblem) {
      setError(idProblem)
      return
    }
    if (!consented) {
      setError(t('ui.please_agree_to_the_consent_terms'))
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const check = await lookupEmail(form.email)
      if (check.role) {
        setDupRole(check.role)
        setSubmitting(false)
        return
      }

      const { userId, needsConfirm } = await resolveAccountForRegister(form.email, form.password)

      const { data: existing } = await supabase.from('candidates').select('id').eq('user_id', userId).maybeSingle()
      if (existing) throw new Error(t('err.expert_exists'))

      let resumePath: string | null = null
      if (resumeFile) {
        resumePath = `${crypto.randomUUID()}-${resumeFile.name}`
        const { error: uploadError } = await supabase.storage.from('resumes').upload(resumePath, resumeFile)
        if (uploadError) throw uploadError
      }

      const { data: inserted, error: insertError } = await supabase
        .from('candidates')
        .insert({
          user_id: userId,
          full_name: form.fullName,
          country_code: form.country,
          id_type: ID_TYPE_EN[form.country],
          resume_path: resumePath,
          headline: form.headline || null,
          business_name: form.businessName.trim() || null,
          linkedin_url: form.linkedin.trim() || null,
          past_experience: form.pastExperience.trim(),
          years_experience: form.yearsExperience || null,
          expertise_field: form.categories,
          contact_number: toStoredPhone(form.country, form.contactNumber),
          email: form.email,
          interests: [],
          referral_opt_in: referralOptIn,
        })
        .select('id')
        .single()
      if (insertError) throw insertError

      if (form.subcategoryIds.length > 0) {
        await supabase
          .from('candidate_subcategories')
          .insert(form.subcategoryIds.map((subcategory_id) => ({ candidate_id: inserted.id, subcategory_id })))
      }

      await recordReferralAtSignup(userId, 'candidate', form.email)

      // The digits are encrypted server-side and saved now, so they're never
      // asked for twice. With email confirmation on there is no session yet;
      // the function then accepts this fresh, unconfirmed account's user id.
      const idSaved = await saveIdentityDigits(form.country, form.last4, needsConfirm ? userId : undefined)
        .then(() => true)
        .catch(() => false)
      setIdentityDeferred(!idSaved)
      if (!needsConfirm) {
        clearDisplayUserCache()
        if (idSaved) {
          toast.success(t('ui.expert_profile_created_you_re_basic'))
          navigate('/dashboard')
        } else {
          toast.error(t('ui.profile_created_but_your_id_digits'))
          navigate('/dashboard/verification')
        }
      } else {
        setDone('confirm')
      }
    } catch (err) {
      const message = errMessage(err)
      if (/email/i.test(message)) {
        toast.error(message)
        setStep(0)
      } else {
        setError(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!done && !submitting && existingUser?.role) {
    return (
      <RegWizardLayout steps={steps} activeStep={0} progress={0}>
        <AlreadySignedInNotice
          email={existingUser.email}
          role={existingUser.role === 'employer' ? 'employer' : 'candidate'}
          dashboardPath={existingUser.dashboardPath}
          onSignOut={() => void supabase.auth.signOut()}
        />
      </RegWizardLayout>
    )
  }

  if (done) {
    return (
      <RegWizardLayout steps={steps} activeStep={steps.length - 1} progress={100}>
        <div className="flex flex-col items-center gap-6 py-20 text-center">
          <GoldCircle size={96}>
            <CheckIcon className="size-10" />
          </GoldCircle>
          <h1 className="text-2xl font-medium text-navy" style={{ fontFamily: 'Georgia, serif' }}>{t('ui.almost_there_confirm_your_email')}</h1>
          <p className="max-w-md text-muted-600">{t('ui.thanks')}{' '}{form.fullName.split(' ')[0] || 'there'}.</p>
          <p className="max-w-md text-sm text-muted">{t('ui.we_ve_sent_a_confirmation_link')}{' '}<b>{form.email}</b>{t('ui.click_it_and_you_ll_land')}{identityDeferred
              ? t('ui.your_id_digits_could_not_be')
              : t('ui.you_re_already_basic_verified_so')}
          </p>
          <Link to="/sign-in" className="rounded-md bg-navy px-6 py-3 text-base font-semibold text-white">{t('ui.go_to_sign_in')}</Link>
        </div>
      </RegWizardLayout>
    )
  }

  const progress = Math.round((step / (steps.length - 1)) * 100)
  const isLastStep = step === steps.length - 1
  const isStep0Filled =
    form.fullName.trim() !== '' &&
    !validateCountryPhone(form.country, form.contactNumber) &&
    !validateEmail(form.email) &&
    (!!session || (form.password.length >= 6 && form.password === form.confirmPassword))

  const pickedCategories = allCategories.filter((c) => form.categories.includes(c.name))

  return (
    <RegWizardLayout steps={steps} activeStep={step} progress={progress}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-medium text-navy" style={{ fontFamily: 'Georgia, serif' }}>
            {step === 0 ? t('ui.create_your_expert_profile') : step === 1 ? t('ui.what_do_you_do') : t('ui.verify_it_s_you')}
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            {step === 0
              ? t('ui.real_leads_real_businesses_you_choose')
              : step === 1
                ? t('ui.businesses_see_this_on_your_match')
                : t('ui.the_free_basic_verified_check_is')}
          </p>
        </div>

        {error && <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        {step === 0 && (
          <>
            {session && (
              <p className="rounded-md bg-brand-50 px-4 py-3 text-sm text-brand">{t('ui.you_re_signed_in_as')}{' '}<b>{signedInEmail}</b>{t('ui.this_finishes_setting_up_your_expert')}</p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('ui.full_name_exactly_as_on_your')}>
                <TextInput required placeholder={t('ui.full_name')} value={form.fullName} onChange={(e) => update('fullName', e.target.value)} />
              </Field>
              <Field label={t('ui.country_you_re_based_in')}>
                <SelectMenu
                  value={form.country}
                  onChange={(v) => update('country', v as ExpertCountry)}
                  options={EXPERT_COUNTRIES.map((c) => ({ value: c, label: countryName(c) }))}
                />
              </Field>
            </div>
            <Field label={t('ui.contact_number')}>
              <PhoneInput required country={form.country} value={form.contactNumber} onChange={(v) => update('contactNumber', v)} invalid={!!form.contactNumber.trim() && !!validateCountryPhone(form.country, form.contactNumber)} />
              {form.contactNumber.trim() && validateCountryPhone(form.country, form.contactNumber) && (
                <p className="mt-1 text-xs text-danger">{validateCountryPhone(form.country, form.contactNumber)}</p>
              )}
            </Field>
            <Field label={t('ui.business_name_optional')}>
              <TextInput placeholder={t('ui.if_you_work_through_your_own')} value={form.businessName} onChange={(e) => update('businessName', e.target.value)} />
            </Field>
            <Field label={t('ui.email')}>
              <TextInput required type="email" placeholder={t('ui.you_example_com')} icon={<MailIcon className="size-5" />} value={form.email} readOnly={!!session} onChange={(e) => update('email', e.target.value)} />
              {!session && form.email.trim() && validateEmail(form.email) && (
                <p className="mt-1 text-xs text-danger">{validateEmail(form.email)}</p>
              )}
            </Field>
            {!session && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('ui.password')}>
                  <TextInput required type="password" minLength={6} placeholder={t('ui.at_least_6_characters')} autoComplete="new-password" value={form.password} onChange={(e) => update('password', e.target.value)} />
                </Field>
                <Field label={t('ui.confirm_password_2')}>
                  <TextInput required type="password" minLength={6} placeholder={t('ui.re_enter_your_password')} autoComplete="new-password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} />
                </Field>
              </div>
            )}
            <p className="text-xs text-muted">{t('ui.experts_on_partly_asia_are_based')}</p>
          </>
        )}

        {step === 1 && (
          <>
            <Field label={t('ui.headline')}>
              <TextInput placeholder={t('ui.e_g_fractional_cfo_series_a')} value={form.headline} onChange={(e) => update('headline', e.target.value)} />
            </Field>
            <div>
              <p className="mb-2 text-sm text-ink">{t('ui.areas_of_expertise_required_to_apply')}</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {allCategories.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => toggleCategory(c.name)}
                    className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                      form.categories.includes(c.name) ? 'border-gold bg-gold-50 font-medium text-navy' : 'border-line text-ink-600 hover:bg-surface-alt'
                    }`}
                  >
                    {categoryLabel(c.name)}
                  </button>
                ))}
              </div>
            </div>
            {pickedCategories.map((c) => (
              <div key={c.id}>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{t('ui.what_you_serve', { name: c.name })}</p>
                <div className="flex flex-wrap gap-2">
                  {c.subcategories.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => toggleSub(s.id)}
                      title={s.notes ?? undefined}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                        form.subcategoryIds.includes(s.id) ? 'border-navy bg-navy text-white' : 'border-line text-ink-600 hover:bg-surface-alt'
                      }`}
                    >
                      {categoryLabel(s.name)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('ui.years_of_experience_required_to_apply')}>
                <Select value={form.yearsExperience} onChange={(v) => update('yearsExperience', v)} options={['Select...', ...experienceRanges]} />
              </Field>
              <Field label={t('ui.linkedin_profile_optional')}>
                <TextInput placeholder={t('ui.https_www_linkedin_com_in')} icon={<LinkedinIcon className="size-5" />} value={form.linkedin} onChange={(e) => update('linkedin', e.target.value)} />
              </Field>
            </div>
            <Field label={t('ui.experience_summary_required_to_apply')}>
              <textarea
                rows={4}
                placeholder={t('ui.roles_outcomes_the_kind_of_problems')}
                className="w-full resize-none rounded-md border border-line bg-surface p-4 text-base text-ink outline-none focus:border-brand placeholder:text-muted-400"
                value={form.pastExperience}
                onChange={(e) => update('pastExperience', e.target.value)}
              />
            </Field>
            <Field label={t('ui.cv_optional')}>
              <CvUpload file={resumeFile} onChange={setResumeFile} />
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <div className="rounded-xl border border-gold/40 bg-gold-50 p-5">
              <Field label={t('ui.last_4_characters_of_your', { v: ID_TYPE_BY_COUNTRY[form.country], country: countryName(form.country) })}>
                <TextInput
                  required
                  placeholder={`e.g. ${ID_LAST4_FORMAT[form.country].example}`}
                  maxLength={4}
                  autoComplete="off"
                  value={form.last4}
                  onChange={(e) => update('last4', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
                />
              </Field>
              <p className="mt-2 text-xs text-ink-600">{t('ui.encrypted_before_it_is_stored_and')}{' '}<b>{t('ui.basic_verified')}</b>{' '}{t('ui.you_can_apply_the_moment_you')}</p>
              <div className="mt-4">
                <FullyVerifiedBubble audience="expert" />
              </div>
            </div>
            <ConsentStep checked={consented} onChange={setConsented} referralOptIn={referralOptIn} onReferralOptInChange={setReferralOptIn} />
          </>
        )}

        <WizardButtons
          onPrev={step > 0 ? () => setStep((s) => s - 1) : undefined}
          nextLabel={isLastStep ? (submitting ? t('ui.creating_profile') : t('ui.create_my_expert_profile')) : t('ui.save_continue')}
          nextDisabled={submitting || (step === 0 && !isStep0Filled) || (isLastStep && (!consented || form.last4.length !== 4))}
        />
      </form>

      {dupRole && (
        <RegisteredEmailDialog email={form.email} existingRole={dupRole} targetRole="candidate" onClose={() => setDupRole(null)} />
      )}
    </RegWizardLayout>
  )
}
