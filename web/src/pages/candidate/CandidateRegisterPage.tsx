import { useEffect, useId, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { RegWizardLayout, WizardButtons, type WizardStep } from '@/components/wizard/RegWizardLayout'
import { ConsentStep } from '@/components/wizard/ConsentStep'
import { Field, Select, TextInput } from '@/components/dashboard/form'
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
import {
  EXPERT_COUNTRIES,
  ID_TYPE_BY_COUNTRY,
  countryName,
  saveIdentityDigits,
  type ExpertCountry,
} from '@/lib/partly'
import {
  BriefcaseIcon,
  CheckIcon,
  CircleCheckIcon,
  LinkedinIcon,
  MailIcon,
  PhoneIcon,
  UploadIcon,
  UserIcon,
} from '@/components/icons'

const steps: WizardStep[] = [
  { label: 'About you', Icon: UserIcon },
  { label: 'Your expertise', Icon: BriefcaseIcon },
  { label: 'Identity & consent', Icon: CircleCheckIcon },
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

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

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
            <span className="text-brand">Browse file</span> or drop here
          </>
        )}
      </p>
      <p className="text-xs text-muted">PDF or DOCX, max 10 MB. Optional — your profile is what businesses see.</p>
      <input id={id} type="file" accept=".pdf,.doc,.docx" className="sr-only" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
    </label>
  )
}

/** Expert sign-up: LinkedIn-style profile + the mandatory identity step. */
export function CandidateRegisterPage() {
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
        toast.error(`Pick up to ${MAX_CATEGORIES} main categories.`)
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
      if (!isValidEmail(form.email)) return toast.error('Please enter a valid email address.')
      if (!session && form.password !== form.confirmPassword) return toast.error('Passwords do not match.')
    }
    if (step === 1 && form.categories.length === 0) return toast.error('Pick at least one area of expertise.')
    if (step === 1 && !form.yearsExperience) return toast.error('Select your years of experience — you can\u2019t apply without it.')

    if (step < steps.length - 1) {
      setStep((s) => s + 1)
      setError(null)
      return
    }

    if (!/^[A-Z0-9]{4}$/.test(form.last4)) {
      setError(`Enter exactly the last 4 characters of your ${ID_TYPE_BY_COUNTRY[form.country]}.`)
      return
    }
    if (!consented) {
      setError('Please agree to the Consent, Terms & Conditions, and Privacy Policy.')
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
      if (existing) throw new Error('This email already has an expert account — just sign in.')

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
          id_type: ID_TYPE_BY_COUNTRY[form.country],
          resume_path: resumePath,
          headline: form.headline || null,
          business_name: form.businessName.trim() || null,
          linkedin_url: form.linkedin.trim() || null,
          past_experience: form.pastExperience || null,
          years_experience: form.yearsExperience || null,
          expertise_field: form.categories,
          contact_number: form.contactNumber,
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

      // The digits are encrypted server-side, which needs a signed-in session.
      // With email confirmation on there is none yet, so they are collected
      // again (never stored in the browser) right after the first sign-in.
      if (!needsConfirm) {
        await saveIdentityDigits(form.country, form.last4).catch(() => setIdentityDeferred(true))
        clearDisplayUserCache()
        toast.success('Expert profile created — you\u2019re Basic verified. Get Fully verified to attract more interested leads.')
        navigate('/dashboard')
      } else {
        setIdentityDeferred(true)
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
          <h1 className="text-2xl font-medium text-navy" style={{ fontFamily: 'Georgia, serif' }}>
            Almost there — confirm your email
          </h1>
          <p className="max-w-md text-muted-600">Thanks, {form.fullName.split(' ')[0] || 'there'}.</p>
          <p className="max-w-md text-sm text-muted">
            We&apos;ve sent a confirmation link to <b>{form.email}</b>. Click it and you&apos;ll land on the sign-in
            page — sign in and finish the 30-second identity check {identityDeferred ? '(your ID digits are asked for again then — we never keep them in the browser)' : ''}{' '}
            so you can start applying.
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
    form.fullName.trim() !== '' &&
    form.contactNumber.trim() !== '' &&
    isValidEmail(form.email) &&
    (!!session || (form.password.length >= 6 && form.password === form.confirmPassword))

  const pickedCategories = allCategories.filter((c) => form.categories.includes(c.name))

  return (
    <RegWizardLayout steps={steps} activeStep={step} progress={progress}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-medium text-navy" style={{ fontFamily: 'Georgia, serif' }}>
            {step === 0 ? 'Create your expert profile' : step === 1 ? 'What do you do?' : 'Verify it’s you'}
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            {step === 0
              ? 'Real leads. Real businesses. You choose — and you only pay when a business shows real interest.'
              : step === 1
                ? 'Businesses see this on your match card. Pick the categories and sub-categories you serve.'
                : 'The free Basic verified check is just these digits — you can apply right away. The paid Fully verified badge later adds a document review on top.'}
          </p>
        </div>

        {error && <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        {step === 0 && (
          <>
            {session && (
              <p className="rounded-md bg-brand-50 px-4 py-3 text-sm text-brand">
                You&apos;re signed in as <b>{signedInEmail}</b>. This finishes setting up your expert account.
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name, exactly as on your ID">
                <TextInput required placeholder="Full name" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} />
              </Field>
              <Field label="Country you’re based in">
                <SelectMenu
                  value={form.country}
                  onChange={(v) => update('country', v as ExpertCountry)}
                  options={EXPERT_COUNTRIES.map((c) => ({ value: c, label: countryName(c) }))}
                />
              </Field>
            </div>
            <Field label="Contact number">
              <TextInput required type="tel" placeholder="Phone number" icon={<PhoneIcon className="size-5" />} value={form.contactNumber} onChange={(e) => update('contactNumber', e.target.value)} />
            </Field>
            <Field label="Email">
              <TextInput required type="email" placeholder="you@example.com" icon={<MailIcon className="size-5" />} value={form.email} readOnly={!!session} onChange={(e) => update('email', e.target.value)} />
            </Field>
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
            <p className="text-xs text-muted">Experts on partly.asia are based in Singapore, Malaysia, Indonesia, Thailand, Vietnam or the Philippines. Businesses can be anywhere.</p>
          </>
        )}

        {step === 1 && (
          <>
            <Field label="Headline">
              <TextInput placeholder="e.g. Fractional CFO · Series A–B fundraising · SaaS" value={form.headline} onChange={(e) => update('headline', e.target.value)} />
            </Field>
            <Field label="Business name (optional)">
              <TextInput placeholder="If you work through your own company, e.g. Lim Advisory Pte Ltd" value={form.businessName} onChange={(e) => update('businessName', e.target.value)} />
            </Field>
            <div>
              <p className="mb-2 text-sm text-ink">Areas of expertise (required to apply)</p>
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
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
            {pickedCategories.map((c) => (
              <div key={c.id}>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{c.name} — what you serve</p>
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
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Years of experience (required to apply)">
                <Select value={form.yearsExperience} onChange={(v) => update('yearsExperience', v)} options={['Select...', ...experienceRanges]} />
              </Field>
              <Field label="LinkedIn profile (optional)">
                <TextInput placeholder="https://www.linkedin.com/in/…" icon={<LinkedinIcon className="size-5" />} value={form.linkedin} onChange={(e) => update('linkedin', e.target.value)} />
              </Field>
            </div>
            <Field label="Experience summary">
              <textarea
                rows={4}
                placeholder="Roles, outcomes, the kind of problems you solve…"
                className="w-full resize-none rounded-md border border-line bg-surface p-4 text-base text-ink outline-none focus:border-brand placeholder:text-muted-400"
                value={form.pastExperience}
                onChange={(e) => update('pastExperience', e.target.value)}
              />
            </Field>
            <Field label="CV (optional)">
              <CvUpload file={resumeFile} onChange={setResumeFile} />
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <div className="rounded-xl border border-gold/40 bg-gold-50 p-5">
              <Field label={`Last 4 characters of your ${ID_TYPE_BY_COUNTRY[form.country]} (${countryName(form.country)})`}>
                <TextInput
                  required
                  placeholder="e.g. 1234A"
                  maxLength={4}
                  autoComplete="off"
                  value={form.last4}
                  onChange={(e) => update('last4', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
                />
              </Field>
              <p className="mt-2 text-xs text-ink-600">
                Encrypted before it is stored and never displayed back — not to you, not to any business, not to any
                third party. This makes you <b>Basic verified</b> — you can apply the moment you sign in.
              </p>
              <div className="mt-4">
                <FullyVerifiedBubble audience="expert" />
              </div>
            </div>
            <ConsentStep checked={consented} onChange={setConsented} referralOptIn={referralOptIn} onReferralOptInChange={setReferralOptIn} />
          </>
        )}

        <WizardButtons
          onPrev={step > 0 ? () => setStep((s) => s - 1) : undefined}
          nextLabel={isLastStep ? (submitting ? 'Creating profile…' : 'Create my expert profile') : 'Save & continue'}
          nextDisabled={submitting || (step === 0 && !isStep0Filled) || (isLastStep && (!consented || form.last4.length !== 4))}
        />
      </form>

      {dupRole && (
        <RegisteredEmailDialog email={form.email} existingRole={dupRole} targetRole="candidate" onClose={() => setDupRole(null)} />
      )}
    </RegWizardLayout>
  )
}
