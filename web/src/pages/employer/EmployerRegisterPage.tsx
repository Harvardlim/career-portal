import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  RegWizardLayout,
  WizardButtons,
  type WizardStep,
} from '@/components/wizard/RegWizardLayout'
import { ConsentStep } from '@/components/wizard/ConsentStep'
import { CheckboxGroup } from '@/components/wizard/CheckboxGroup'
import { Field, TextInput } from '@/components/dashboard/form'
import { supabase } from '@/lib/supabase'
import { useCategoryNames } from '@/lib/categories'
import { errMessage } from '@/lib/errors'
import { recordReferralAtSignup } from '@/lib/affiliate'
import { lookupEmail, resolveAccountForRegister } from '@/lib/registerAccount'
import { RegisteredEmailDialog } from '@/components/auth/RegisteredEmailDialog'
import { useSession } from '@/lib/useSession'
import {
  BriefcaseIcon,
  BuildingIcon,
  CheckIcon,
  CircleCheckIcon,
  MailIcon,
} from '@/components/icons'

const steps: WizardStep[] = [
  { label: 'Company Info', Icon: BuildingIcon },
  { label: 'Job Details', Icon: BriefcaseIcon },
  { label: 'Consent', Icon: CircleCheckIcon },
]

type FormState = {
  companyName: string
  regNo: string
  businessEmail: string
  password: string
  confirmPassword: string
  field: string[]
  businessDetails: string
  lookingFor: string[]
}

const initialState: FormState = {
  companyName: '',
  regNo: '',
  businessEmail: '',
  password: '',
  confirmPassword: '',
  field: [],
  businessDetails: '',
  lookingFor: [],
}

export function EmployerRegisterPage() {
  const categoryOptions = useCategoryNames()
  const navigate = useNavigate()
  const { session } = useSession()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(initialState)
  const [consented, setConsented] = useState(false)
  const [referralOptIn, setReferralOptIn] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [dupRole, setDupRole] = useState<'candidate' | 'employer' | null>(null)

  // Already signed in — adding an employer profile to the same account.
  const signedInEmail = session?.user.email ?? ''
  useEffect(() => {
    if (signedInEmail) setForm((f) => ({ ...f, businessEmail: signedInEmail }))
  }, [signedInEmail])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const toggleLookingFor = (label: string) =>
    setForm((f) => ({
      ...f,
      lookingFor: f.lookingFor.includes(label)
        ? f.lookingFor.filter((i) => i !== label)
        : [...f.lookingFor, label],
    }))

  const toggleField = (label: string) =>
    setForm((f) => ({
      ...f,
      field: f.field.includes(label)
        ? f.field.filter((i) => i !== label)
        : [...f.field, label],
    }))

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (step === 0 && !session && form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (step < steps.length - 1) {
      setStep((s) => s + 1)
      setError(null)
      return
    }

    if (form.field.length === 0) {
      setError('Please select at least one Field.')
      return
    }
    if (form.lookingFor.length === 0) {
      setError('Please select at least one field you are looking to hire for.')
      return
    }
    if (!consented) {
      setError('Please agree to the Consent, Terms & Conditions, and Privacy Policy.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      // If this email already belongs to a different account, stop and ask the
      // person to sign in there first so the credentials stay the same.
      const check = await lookupEmail(form.businessEmail)
      if (check.role && !check.signedInSameUser) {
        setDupRole(check.role)
        setSubmitting(false)
        return
      }

      const { userId, needsConfirm } = await resolveAccountForRegister(
        form.businessEmail,
        form.password,
      )

      const { data: existing } = await supabase
        .from('employers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()
      if (existing) {
        throw new Error(
          'This account already has an employer profile — just sign in.',
        )
      }

      const { error: insertError } = await supabase.from('employers').insert({
        user_id: userId,
        company_name: form.companyName,
        reg_no: form.regNo,
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
        toast.success('Employer profile added to your account.')
        navigate('/employer/dashboard')
      }
    } catch (err) {
      setError(errMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <RegWizardLayout steps={steps} activeStep={steps.length - 1} progress={100}>
        <div className="flex flex-col items-center gap-6 py-20 text-center">
          <span className="grid size-24 place-items-center rounded-full bg-brand-50 text-brand">
            <CheckIcon className="size-10" />
          </span>
          <h1 className="text-2xl font-medium text-ink">
            🎉 Almost there — confirm your email
          </h1>
          <p className="max-w-md text-muted-600">
            Thanks for submitting {form.companyName}&apos;s details.
          </p>
          <p className="max-w-md text-sm text-muted">
            We&apos;ve sent a confirmation link to <b>{form.businessEmail}</b>.
            Click it to activate your account — you&apos;ll be brought back here
            and can then sign in.
          </p>
          <Link
            to="/sign-in"
            className="rounded-[4px] bg-brand px-6 py-3 text-base font-semibold text-white"
          >
            Go to Sign In
          </Link>
        </div>
      </RegWizardLayout>
    )
  }

  const progress = Math.round((step / (steps.length - 1)) * 100)
  const isLastStep = step === steps.length - 1

  return (
    <RegWizardLayout steps={steps} activeStep={step} progress={progress}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {error && (
          <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        {step === 0 && (
          <>
            {session && (
              <p className="rounded-md bg-brand-50 px-4 py-3 text-sm text-brand">
                You&apos;re signed in as <b>{signedInEmail}</b>. This will add an
                employer profile to your existing account — no new password
                needed.
              </p>
            )}
            <Field label="Company Name">
              <TextInput
                required
                placeholder="Registered company name"
                value={form.companyName}
                onChange={(e) => update('companyName', e.target.value)}
              />
            </Field>
            <Field label="Reg No">
              <TextInput
                required
                placeholder="Business registration number"
                value={form.regNo}
                onChange={(e) => update('regNo', e.target.value)}
              />
            </Field>
            <Field label="Business Email">
              <TextInput
                required
                type="email"
                placeholder="you@company.com"
                icon={<MailIcon className="size-5" />}
                value={form.businessEmail}
                readOnly={!!session}
                onChange={(e) => update('businessEmail', e.target.value)}
              />
            </Field>
            {!session && (
              <>
                <Field label="Password">
                  <TextInput
                    required
                    type="password"
                    minLength={6}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                  />
                </Field>
                <Field label="Confirm Password">
                  <TextInput
                    required
                    type="password"
                    minLength={6}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={(e) => update('confirmPassword', e.target.value)}
                  />
                </Field>
              </>
            )}
          </>
        )}

        {step === 1 && (
          <>
            <CheckboxGroup
              label="Field"
              options={categoryOptions}
              selected={form.field}
              onToggle={toggleField}
            />
            <Field label="Business Details">
              <textarea
                required
                rows={5}
                placeholder="Tell us what your company does..."
                className="w-full resize-none rounded-md border border-line bg-surface p-4 text-base text-ink outline-none focus:border-brand placeholder:text-muted-400"
                value={form.businessDetails}
                onChange={(e) => update('businessDetails', e.target.value)}
              />
            </Field>
            <CheckboxGroup
              label="Who are you looking for?"
              options={categoryOptions}
              selected={form.lookingFor}
              onToggle={toggleLookingFor}
            />
          </>
        )}

        {step === 2 && (
          <ConsentStep
            checked={consented}
            onChange={setConsented}
            referralOptIn={referralOptIn}
            onReferralOptInChange={setReferralOptIn}
          />
        )}

        <WizardButtons
          onPrev={step > 0 ? () => setStep((s) => s - 1) : undefined}
          nextLabel={isLastStep ? (submitting ? 'Submitting...' : 'Submit') : 'Save & Next'}
          nextDisabled={submitting || (isLastStep && !consented)}
        />
      </form>

      {dupRole && (
        <RegisteredEmailDialog
          email={form.businessEmail}
          existingRole={dupRole}
          targetRole="employer"
          onClose={() => setDupRole(null)}
        />
      )}
    </RegWizardLayout>
  )
}
