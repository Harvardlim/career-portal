import { useId, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  RegWizardLayout,
  WizardButtons,
  type WizardStep,
} from '@/components/wizard/RegWizardLayout'
import { ConsentStep } from '@/components/wizard/ConsentStep'
import { CheckboxGroup } from '@/components/wizard/CheckboxGroup'
import { Field, Select, TextInput } from '@/components/dashboard/form'
import { experienceRanges } from '@/data/categories'
import { supabase } from '@/lib/supabase'
import { errMessage } from '@/lib/errors'
import { recordReferralAtSignup } from '@/lib/affiliate'
import { resolveAccountForRegister } from '@/lib/registerAccount'
import { useCategoryNames } from '@/lib/categories'
import {
  BriefcaseIcon,
  CheckIcon,
  CircleCheckIcon,
  MailIcon,
  PhoneIcon,
  UploadIcon,
  UserIcon,
} from '@/components/icons'

const steps: WizardStep[] = [
  { label: 'Personal Info', Icon: UserIcon },
  { label: 'Job Details', Icon: BriefcaseIcon },
  { label: 'Consent', Icon: CircleCheckIcon },
]

type FormState = {
  fullName: string
  contactNumber: string
  email: string
  password: string
  confirmPassword: string
  expertiseFields: string[]
  yearsExperience: string
  pastExperience: string
  interests: string[]
}

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

const initialState: FormState = {
  fullName: '',
  contactNumber: '',
  email: '',
  password: '',
  confirmPassword: '',
  expertiseFields: [],
  yearsExperience: '',
  pastExperience: '',
  interests: [],
}

function ResumeUpload({
  file,
  onChange,
}: {
  file: File | null
  onChange: (file: File | null) => void
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-surface-alt/40 p-6 text-center hover:border-brand"
      >
        <UploadIcon className="size-8 text-muted" />
        <p className="text-sm font-medium text-ink">
          {file ? file.name : (
            <>
              <span className="text-brand">Browse file</span> or drop here
            </>
          )}
        </p>
        <p className="text-xs text-muted">PDF or DOCX. Max file size 10 MB.</p>
        <input
          id={id}
          type="file"
          accept=".pdf,.doc,.docx"
          className="sr-only"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  )
}

export function CandidateRegisterPage() {
  const categoryOptions = useCategoryNames()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(initialState)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [consented, setConsented] = useState(false)
  const [referralOptIn, setReferralOptIn] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const toggleInterest = (label: string) =>
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(label)
        ? f.interests.filter((i) => i !== label)
        : [...f.interests, label],
    }))

  const toggleExpertise = (label: string) =>
    setForm((f) => ({
      ...f,
      expertiseFields: f.expertiseFields.includes(label)
        ? f.expertiseFields.filter((i) => i !== label)
        : [...f.expertiseFields, label],
    }))

  const handleEmailBlur = () => {
    if (form.email.trim() !== '' && !isValidEmail(form.email)) {
      toast.error('Please enter a valid email address.', { id: 'email-invalid' })
    }
  }

  const handleConfirmPasswordBlur = () => {
    if (
      form.password !== '' &&
      form.confirmPassword !== '' &&
      form.password !== form.confirmPassword
    ) {
      toast.error('Passwords do not match.', { id: 'password-mismatch' })
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (step === 0) {
      if (!isValidEmail(form.email)) {
        toast.error('Please enter a valid email address.')
        return
      }
      if (form.password !== form.confirmPassword) {
        toast.error('Passwords do not match.')
        return
      }
    }

    if (step < steps.length - 1) {
      setStep((s) => s + 1)
      setError(null)
      return
    }

    if (form.expertiseFields.length === 0) {
      setError('Please select at least one Expertise Field.')
      return
    }
    if (!consented) {
      setError('Please agree to the Consent, Terms & Conditions, and Privacy Policy.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const { userId, needsConfirm } = await resolveAccountForRegister(
        form.email,
        form.password,
      )

      const { data: existing } = await supabase
        .from('candidates')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()
      if (existing) {
        throw new Error(
          'This account already has a candidate profile — just sign in.',
        )
      }

      let resumePath: string | null = null
      if (resumeFile) {
        resumePath = `${crypto.randomUUID()}-${resumeFile.name}`
        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(resumePath, resumeFile)
        if (uploadError) throw uploadError
      }

      const { error: insertError } = await supabase.from('candidates').insert({
        user_id: userId,
        full_name: form.fullName,
        resume_path: resumePath,
        past_experience: form.pastExperience || null,
        years_experience: form.yearsExperience || null,
        expertise_field: form.expertiseFields,
        contact_number: form.contactNumber,
        email: form.email,
        interests: form.interests,
        referral_opt_in: referralOptIn,
      })
      if (insertError) throw insertError

      await recordReferralAtSignup(userId, 'candidate', form.email)

      if (needsConfirm) {
        setDone(true)
      } else {
        toast.success('Candidate profile added to your account.')
        navigate('/dashboard')
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
            Thanks for submitting your details,{' '}
            {form.fullName.split(' ')[0] || 'there'}.
          </p>
          <p className="max-w-md text-sm text-muted">
            We&apos;ve sent a confirmation link to <b>{form.email}</b>. Click it to
            activate your account — you&apos;ll be brought back here and can then
            sign in.
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
  const isStep0Filled =
    form.fullName.trim() !== '' &&
    form.contactNumber.trim() !== '' &&
    isValidEmail(form.email) &&
    form.password.length >= 6 &&
    form.password === form.confirmPassword

  return (
    <RegWizardLayout steps={steps} activeStep={step} progress={progress}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {error && (
          <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        {step === 0 && (
          <>
            <Field label="Name as Per IC">
              <TextInput
                required
                placeholder="Full name, exactly as on your IC"
                value={form.fullName}
                onChange={(e) => update('fullName', e.target.value)}
              />
            </Field>
            <Field label="Contact Number">
              <TextInput
                required
                type="tel"
                placeholder="Phone number"
                icon={<PhoneIcon className="size-5" />}
                value={form.contactNumber}
                onChange={(e) => update('contactNumber', e.target.value)}
              />
            </Field>
            <Field label="Email">
              <TextInput
                required
                type="email"
                placeholder="you@example.com"
                icon={<MailIcon className="size-5" />}
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                onBlur={handleEmailBlur}
              />
            </Field>
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
                onBlur={handleConfirmPasswordBlur}
              />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <Field label="Resume / CV (optional)">
              <ResumeUpload file={resumeFile} onChange={setResumeFile} />
            </Field>
            <CheckboxGroup
              label="Expertise Field"
              options={categoryOptions}
              selected={form.expertiseFields}
              onToggle={toggleExpertise}
            />
            <Field label="Years of Experience in Field">
              <Select
                value={form.yearsExperience}
                onChange={(e) => update('yearsExperience', e.target.value)}
                options={['Select...', ...experienceRanges]}
              />
            </Field>
            <Field label="Past Experience">
              <textarea
                rows={4}
                placeholder="Tell us about your past roles and responsibilities..."
                className="w-full resize-none rounded-md border border-line bg-surface p-4 text-base text-ink outline-none focus:border-brand placeholder:text-muted-400"
                value={form.pastExperience}
                onChange={(e) => update('pastExperience', e.target.value)}
              />
            </Field>
            <CheckboxGroup
              label="What are you interested in?"
              options={categoryOptions}
              selected={form.interests}
              onToggle={toggleInterest}
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
          nextDisabled={
            submitting ||
            (step === 0 && !isStep0Filled) ||
            (isLastStep && !consented)
          }
        />
      </form>
    </RegWizardLayout>
  )
}
