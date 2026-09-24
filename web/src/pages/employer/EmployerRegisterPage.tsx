import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { RegWizardLayout, WizardButtons, type WizardStep } from '@/components/wizard/RegWizardLayout'
import { ConsentStep } from '@/components/wizard/ConsentStep'
import { CheckboxGroup } from '@/components/wizard/CheckboxGroup'
import { Field, TextInput } from '@/components/dashboard/form'
import { SelectMenu } from '@/components/app/SelectMenu'
import { GoldCircle } from '@/components/marketing/blocks'
import { supabase } from '@/lib/supabase'
import { useCategoryNames } from '@/lib/categories'
import { errMessage } from '@/lib/errors'
import { recordReferralAtSignup } from '@/lib/affiliate'
import { lookupEmail, resolveAccountForRegister } from '@/lib/registerAccount'
import { AlreadySignedInNotice, RegisteredEmailDialog } from '@/components/auth/RegisteredEmailDialog'
import { FullyVerifiedBubble } from '@/components/partly/ui'
import { useSession } from '@/lib/useSession'
import { clearDisplayUserCache, useDisplayUser } from '@/lib/useDisplayUser'
import { BUSINESS_REG_FORMATS, COUNTRY_NAMES, validateBusinessRegNo } from '@/lib/partly'
import { BriefcaseIcon, BuildingIcon, CheckIcon, CircleCheckIcon, MailIcon } from '@/components/icons'

const steps: WizardStep[] = [
  { label: 'Your business', Icon: BuildingIcon },
  { label: 'What you need', Icon: BriefcaseIcon },
  { label: 'Consent', Icon: CircleCheckIcon },
]

type FormState = {
  companyName: string
  country: string
  regNo: string
  website: string
  businessEmail: string
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
  password: '',
  confirmPassword: '',
  field: [],
  businessDetails: '',
  lookingFor: [],
}

/** Business sign-up: registration number (validated per country) + what they need. */
export function EmployerRegisterPage() {
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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (step === 0) {
      const err = validateBusinessRegNo(form.country, form.regNo)
      if (err) return setError(err)
      if (!session && form.password !== form.confirmPassword) return setError('Passwords do not match.')
    }
    if (step === 1 && form.lookingFor.length === 0) return setError('Pick at least one area you need help in.')

    if (step < steps.length - 1) {
      setStep((s) => s + 1)
      setError(null)
      return
    }
    if (!consented) return setError('Please agree to the Consent, Terms & Conditions, and Privacy Policy.')

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
      if (existing) throw new Error('This email already has a business account — just sign in.')

      const { error: insertError } = await supabase.from('employers').insert({
        user_id: userId,
        company_name: form.companyName,
        country_code: form.country,
        reg_no: form.regNo.trim(),
        website: form.website.trim() || null,
        field: form.field,
        business_email: form.businessEmail,
        business_details: form.businessDetails,
        looking_for: form.lookingFor,
        referral_opt_in: referralOptIn,
      })
      if (insertError) throw insertError

      await recordReferralAtSignup(userId, 'employer', form.businessEmail)

      if (needsConfirm) {
        setDone(true)
      } else {
        clearDisplayUserCache()
        toast.success('Business profile created — you\u2019re Basic verified. Get Fully verified to attract better experts.')
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
          <h1 className="text-2xl font-medium text-navy" style={{ fontFamily: 'Georgia, serif' }}>
            Almost there — confirm your email
          </h1>
          <p className="max-w-md text-muted-600">Thanks for registering {form.companyName}.</p>
          <p className="max-w-md text-sm text-muted">
            We&apos;ve sent a confirmation link to <b>{form.businessEmail}</b>. Click it and you&apos;ll land on the
            sign-in page. Once you&apos;re in you&apos;re Basic verified and can post your first project free — upload
            your registration document and activate the badge to become Fully verified.
          </p>
          <Link to="/sign-in" className="rounded-md bg-navy px-6 py-3 text-base font-semibold text-white">
            Go to Sign In
          </Link>
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
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.businessEmail) &&
    (!!session || (form.password.length >= 6 && form.password === form.confirmPassword))

  return (
    <RegWizardLayout steps={steps} activeStep={step} progress={progress}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-medium text-navy" style={{ fontFamily: 'Georgia, serif' }}>
            {step === 0 ? 'Register your business' : step === 1 ? 'What do you need help with?' : 'One last thing'}
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            {step === 0
              ? 'Post your project. Meet your expert. Solve your problems — posting is completely free.'
              : step === 1
                ? 'This helps us route the right experts to you. You can be based anywhere in the world.'
                : 'Your registration number gets you the Basic verified mark straight away.'}
          </p>
        </div>

        {error && <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        {step === 0 && (
          <>
            {session && (
              <p className="rounded-md bg-brand-50 px-4 py-3 text-sm text-brand">
                You&apos;re signed in as <b>{signedInEmail}</b>. This finishes setting up your business account.
              </p>
            )}
            <Field label="Registered company name">
              <TextInput required placeholder="Company name as registered" value={form.companyName} onChange={(e) => update('companyName', e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Country of registration">
                <SelectMenu
                  value={form.country}
                  onChange={(v) => update('country', v)}
                  options={Object.entries(COUNTRY_NAMES).map(([code, name]) => ({ value: code, label: name }))}
                />
              </Field>
              <Field label={regFormat ? `${regFormat.label}` : 'Business registration number'}>
                <TextInput
                  required
                  placeholder={regFormat?.placeholder ?? 'Registration number'}
                  value={form.regNo}
                  onChange={(e) => update('regNo', e.target.value)}
                  className={regError ? 'border-danger' : ''}
                />
              </Field>
            </div>
            <p className={`-mt-3 text-xs ${regError ? 'text-danger' : 'text-muted'}`}>
              {regError ?? regFormat?.hint ?? 'Enter it exactly as it appears on your registration; the format varies by country.'}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Business email">
                <TextInput required type="email" placeholder="you@company.com" icon={<MailIcon className="size-5" />} value={form.businessEmail} readOnly={!!session} onChange={(e) => update('businessEmail', e.target.value)} />
              </Field>
              <Field label="Website (optional)">
                <TextInput placeholder="https://" value={form.website} onChange={(e) => update('website', e.target.value)} />
              </Field>
            </div>
            {!session && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Password">
                  <TextInput required type="password" minLength={6} placeholder="At least 6 characters" autoComplete="new-password" value={form.password} onChange={(e) => update('password', e.target.value)} />
                </Field>
                <Field label="Confirm password">
                  <TextInput required type="password" minLength={6} placeholder="Re-enter your password" autoComplete="new-password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} />
                </Field>
              </div>
            )}
          </>
        )}

        {step === 1 && (
          <>
            <CheckboxGroup label="Which functions do you need expert help in?" options={categoryOptions} selected={form.lookingFor} onToggle={toggle('lookingFor')} />
            <Field label="About your business">
              <textarea
                required
                rows={5}
                placeholder="What you do, your size, and the kind of problems you’re looking to solve…"
                className="w-full resize-none rounded-md border border-line bg-surface p-4 text-base text-ink outline-none focus:border-brand placeholder:text-muted-400"
                value={form.businessDetails}
                onChange={(e) => update('businessDetails', e.target.value)}
              />
            </Field>
            <CheckboxGroup label="Your industry / field (optional)" options={categoryOptions} selected={form.field} onToggle={toggle('field')} />
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex flex-col gap-4 rounded-xl border border-gold/40 bg-gold-50 p-5 text-sm text-ink-600">
              <p>
                Your business starts as <b>Basic verified</b> — the registration number you just gave us is enough to
                post. To become <b>Fully verified</b>, upload a copy of your business registration after sign-in and
                activate the annual badge: our team confirms it by hand and your profile carries the Fully verified
                mark. Every expert you match with is identity-verified too.
              </p>
              <FullyVerifiedBubble audience="business" />
            </div>
            <ConsentStep checked={consented} onChange={setConsented} referralOptIn={referralOptIn} onReferralOptInChange={setReferralOptIn} />
          </>
        )}

        <WizardButtons
          onPrev={step > 0 ? () => setStep((s) => s - 1) : undefined}
          nextLabel={isLastStep ? (submitting ? 'Creating profile…' : 'Create my business profile') : 'Save & continue'}
          nextDisabled={submitting || (step === 0 && !isStep0Filled) || (isLastStep && !consented)}
        />
      </form>

      {dupRole && (
        <RegisteredEmailDialog email={form.businessEmail} existingRole={dupRole} targetRole="employer" onClose={() => setDupRole(null)} />
      )}
    </RegWizardLayout>
  )
}
