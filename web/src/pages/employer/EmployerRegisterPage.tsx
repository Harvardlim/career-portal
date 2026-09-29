import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { RegWizardLayout, WizardButtons, type WizardStep } from '@/components/wizard/RegWizardLayout'
import { ConsentStep } from '@/components/wizard/ConsentStep'
import { CheckboxGroup } from '@/components/wizard/CheckboxGroup'
import { Field, PhoneInput, TextInput } from '@/components/dashboard/form'
import { SelectMenu } from '@/components/app/SelectMenu'
import { GoldCircle } from '@/components/marketing/blocks'
import { supabase } from '@/lib/supabase'
import { useCategoryNames } from '@/lib/categories'
import { errMessage } from '@/lib/errors'
import { toStoredPhone, validateCountryPhone } from '@/lib/phone'
import { recordReferralAtSignup } from '@/lib/affiliate'
import { lookupEmail, resolveAccountForRegister } from '@/lib/registerAccount'
import { AlreadySignedInNotice, RegisteredEmailDialog } from '@/components/auth/RegisteredEmailDialog'
import { FullyVerifiedBubble } from '@/components/partly/ui'
import { useSession } from '@/lib/useSession'
import { clearDisplayUserCache, useDisplayUser } from '@/lib/useDisplayUser'
import {
  BUSINESS_REG_FORMATS,
  COUNTRY_NAMES,
  MIN_BUSINESS_TEXT,
  validateBusinessEmail,
  validateBusinessRegNo,
} from '@/lib/partly'
import { BriefcaseIcon, BuildingIcon, CheckIcon, CircleCheckIcon, MailIcon } from '@/components/icons'
import { useT, tr } from '@/lib/i18n'

const steps: WizardStep[] = [
  { get label() { return tr('step.business') }, Icon: BuildingIcon },
  { get label() { return tr('step.need') }, Icon: BriefcaseIcon },
  { get label() { return tr('step.consent') }, Icon: CircleCheckIcon },
]

type FormState = {
  companyName: string
  country: string
  regNo: string
  website: string
  businessEmail: string
  phone: string
  password: string
  confirmPassword: string
  field: string[]
  businessDetails: string
  lookingFor: string[]
}

const initialState: FormState = {
  companyName: '',
  country: 'SG',
  regNo: '',
  website: '',
  businessEmail: '',
  phone: '',
  password: '',
  confirmPassword: '',
  field: [],
  businessDetails: '',
  lookingFor: [],
}

/** Business sign-up: registration number (validated per country) + what they need. */
export function EmployerRegisterPage() {
  const t = useT()
  const categoryOptions = useCategoryNames()
  const navigate = useNavigate()
  const { session } = useSession()
  const { user: existingUser } = useDisplayUser()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(initialState)
  const [consented, setConsented] = useState(false)
  const [referralOptIn, setReferralOptIn] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [dupRole, setDupRole] = useState<'candidate' | 'employer' | null>(null)

  const signedInEmail = session?.user.email ?? ''
  useEffect(() => {
    if (signedInEmail) setForm((f) => ({ ...f, businessEmail: signedInEmail }))
  }, [signedInEmail])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }))
  const toggle = (key: 'field' | 'lookingFor') => (label: string) =>
    setForm((f) => ({ ...f, [key]: f[key].includes(label) ? f[key].filter((i) => i !== label) : [...f[key], label] }))

  const regFormat = BUSINESS_REG_FORMATS[form.country]
  const regError = form.regNo ? validateBusinessRegNo(form.country, form.regNo) : null
  const emailError = form.businessEmail ? validateBusinessEmail(form.businessEmail) : null
  const phoneError = form.phone ? validateCountryPhone(form.country, form.phone) : null

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (step === 0) {
      const err = validateBusinessRegNo(form.country, form.regNo)
      if (err) return setError(err)
      const emailErr = validateBusinessEmail(form.businessEmail)
      if (emailErr) return setError(emailErr)
      const phoneErr = validateCountryPhone(form.country, form.phone)
      if (phoneErr) return setError(phoneErr)
      if (!session && form.password !== form.confirmPassword) return setError(t('ui.passwords_do_not_match'))
      // Catch an already-registered email here, not three steps later.
      setSubmitting(true)
      const check = await lookupEmail(form.businessEmail).catch(() => ({ role: null }))
      setSubmitting(false)
      if (check.role) return setDupRole(check.role)
    }
    if (step === 1 && form.lookingFor.length === 0) return setError(t('ui.pick_at_least_one_area_you'))
    if (step === 1 && form.field.length === 0) return setError(t('ui.pick_your_industry_field'))
    if (step === 1 && form.businessDetails.trim().length < MIN_BUSINESS_TEXT)
      return setError(t('ui.tell_us_about_your_business_at', { MIN_BUSINESS_TEXT }))

    if (step < steps.length - 1) {
      setStep((s) => s + 1)
      setError(null)
      return
    }
    if (!consented) return setError(t('ui.please_agree_to_the_consent_terms'))

    setSubmitting(true)
    setError(null)
    try {
      const check = await lookupEmail(form.businessEmail)
      if (check.role) {
        setDupRole(check.role)
        setSubmitting(false)
        return
      }

      const { userId, needsConfirm } = await resolveAccountForRegister(form.businessEmail, form.password)

      const { data: existing } = await supabase.from('employers').select('id').eq('user_id', userId).maybeSingle()
      if (existing) throw new Error(t('err.business_exists'))

      const { error: insertError } = await supabase.from('employers').insert({
        user_id: userId,
        company_name: form.companyName.trim(),
        country_code: form.country,
        reg_no: form.regNo.trim(),
        website: form.website.trim() || null,
        field: form.field,
        business_email: form.businessEmail.trim(),
        phone: toStoredPhone(form.country, form.phone),
        business_details: form.businessDetails.trim(),
        looking_for: form.lookingFor,
        referral_opt_in: referralOptIn,
      })
      if (insertError) throw insertError

      await recordReferralAtSignup(userId, 'employer', form.businessEmail)

      if (needsConfirm) {
        setDone(true)
      } else {
        clearDisplayUserCache()
        toast.success(t('ui.business_profile_created_you_re_basic'))
        navigate('/employer/dashboard')
      }
    } catch (err) {
      setError(errMessage(err))
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
          <p className="max-w-md text-muted-600">{t('ui.thanks_for_registering', { companyName: form.companyName })}</p>
          <p className="max-w-md text-sm text-muted">{t('ui.we_ve_sent_a_confirmation_link')}{' '}<b>{form.businessEmail}</b>{t('ui.click_it_and_you_ll_land_2')}</p>
          <Link to="/sign-in" className="rounded-md bg-navy px-6 py-3 text-base font-semibold text-white">{t('ui.go_to_sign_in')}</Link>
        </div>
      </RegWizardLayout>
    )
  }

  const progress = Math.round((step / (steps.length - 1)) * 100)
  const isLastStep = step === steps.length - 1
  const isStep0Filled =
    form.companyName.trim() !== '' &&
    form.regNo.trim() !== '' &&
    !regError &&
    !validateBusinessEmail(form.businessEmail) &&
    !validateCountryPhone(form.country, form.phone) &&
    (!!session || (form.password.length >= 6 && form.password === form.confirmPassword))

  return (
    <RegWizardLayout steps={steps} activeStep={step} progress={progress}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-medium text-navy" style={{ fontFamily: 'Georgia, serif' }}>
            {step === 0 ? t('ui.register_your_business') : step === 1 ? t('ui.what_do_you_need_help_with') : t('ui.one_last_thing')}
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            {step === 0
              ? t('ui.post_your_project_meet_your_expert')
              : step === 1
                ? t('ui.this_helps_us_route_the_right')
                : t('ui.your_registration_number_gets_you_the')}
          </p>
        </div>

        {error && <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        {step === 0 && (
          <>
            {session && (
              <p className="rounded-md bg-brand-50 px-4 py-3 text-sm text-brand">{t('ui.you_re_signed_in_as')}{' '}<b>{signedInEmail}</b>{t('ui.this_finishes_setting_up_your_business')}</p>
            )}
            <Field label={t('ui.registered_company_name')}>
              <TextInput required placeholder={t('ui.company_name_as_registered')} value={form.companyName} onChange={(e) => update('companyName', e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('ui.country_of_registration')}>
                <SelectMenu
                  value={form.country}
                  onChange={(v) => update('country', v)}
                  options={Object.entries(COUNTRY_NAMES).map(([code, name]) => ({ value: code, label: name }))}
                />
              </Field>
              <Field label={regFormat ? `${regFormat.label}` : t('ui.business_registration_number')}>
                <TextInput
                  required
                  placeholder={regFormat?.placeholder ?? t('ui.registration_number')}
                  value={form.regNo}
                  onChange={(e) => update('regNo', e.target.value)}
                  className={regError ? 'border-danger' : ''}
                />
              </Field>
            </div>
            <p className={`-mt-3 text-xs ${regError ? 'text-danger' : 'text-muted'}`}>
              {regError ?? regFormat?.hint ?? t('ui.enter_it_exactly_as_it_appears')}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('ui.business_email_2')}>
                <TextInput required type="email" placeholder={t('ui.you_company_com')} icon={<MailIcon className="size-5" />} value={form.businessEmail} readOnly={!!session} onChange={(e) => update('businessEmail', e.target.value)} className={emailError ? 'border-danger' : ''} />
                {emailError && <p className="mt-1 text-xs text-danger">{emailError}</p>}
              </Field>
              <Field label={t('ui.business_phone')}>
                <PhoneInput required country={form.country} value={form.phone} onChange={(v) => update('phone', v)} invalid={!!phoneError} />
                {phoneError && <p className="mt-1 text-xs text-danger">{phoneError}</p>}
              </Field>
            </div>
            <Field label={t('ui.website_optional')}>
              <TextInput placeholder="https://" value={form.website} onChange={(e) => update('website', e.target.value)} />
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
          </>
        )}

        {step === 1 && (
          <>
            <CheckboxGroup label={t('ui.which_functions_do_you_need_expert')} options={categoryOptions} selected={form.lookingFor} onToggle={toggle('lookingFor')} />
            <Field label={t('ui.about_your_business')}>
              <textarea
                required
                minLength={MIN_BUSINESS_TEXT}
                rows={5}
                placeholder={t('ui.what_you_do_your_size_and')}
                className="w-full resize-none rounded-md border border-line bg-surface p-4 text-base text-ink outline-none focus:border-brand placeholder:text-muted-400"
                value={form.businessDetails}
                onChange={(e) => update('businessDetails', e.target.value)}
              />
            </Field>
            <CheckboxGroup label={t('ui.your_industry_field')} options={categoryOptions} selected={form.field} onToggle={toggle('field')} />
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex flex-col gap-4 rounded-xl border border-gold/40 bg-gold-50 p-5 text-sm text-ink-600">
              <p>{t('ui.your_business_starts_as')}{' '}<b>{t('ui.basic_verified')}</b>{' '}{t('ui.the_registration_number_you_just_gave')}{' '}<b>{t('ui.fully_verified')}</b>{t('ui.upload_a_copy_of_your_business')}</p>
              <FullyVerifiedBubble audience="business" />
            </div>
            <ConsentStep checked={consented} onChange={setConsented} referralOptIn={referralOptIn} onReferralOptInChange={setReferralOptIn} />
          </>
        )}

        <WizardButtons
          onPrev={step > 0 ? () => setStep((s) => s - 1) : undefined}
          nextLabel={isLastStep ? (submitting ? t('ui.creating_profile') : t('ui.create_my_business_profile')) : t('ui.save_continue')}
          nextDisabled={submitting || (step === 0 && !isStep0Filled) || (isLastStep && !consented)}
        />
      </form>

      {dupRole && (
        <RegisteredEmailDialog email={form.businessEmail} existingRole={dupRole} targetRole="employer" onClose={() => setDupRole(null)} />
      )}
    </RegWizardLayout>
  )
}
