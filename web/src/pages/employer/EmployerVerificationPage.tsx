import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { EmployerDashboardLayout } from '@/components/dashboard/EmployerDashboardLayout'
import { Field, TextInput } from '@/components/dashboard/form'
import { VerificationDocs } from '@/components/partly/VerificationDocs'
import { Card, Notice, PrimaryButton, VerifiedChips } from '@/components/partly/ui'
import { updateMyEmployer, useEmployer } from '@/lib/employers'
import { COUNTRY_NAMES } from '@/lib/partly'

export function EmployerVerificationPage() {
  const { employer, session, loading, reload } = useEmployer()
  const [regNo, setRegNo] = useState('')
  const [country, setCountry] = useState('SG')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (employer) {
      setRegNo(employer.reg_no ?? '')
      setCountry(employer.country_code ?? 'SG')
    }
  }, [employer])

  async function save() {
    if (!employer || !regNo.trim()) return
    setSaving(true)
    try {
      await updateMyEmployer(employer.id, { reg_no: regNo.trim(), country_code: country })
      toast.success('Saved.')
      await reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <EmployerDashboardLayout>
      <div className="flex max-w-3xl flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">Business verification</h1>
          <p className="mt-1 text-sm text-muted">
            Every business on partly.asia registers with a valid business registration number, confirmed
            before any project can be posted. You can be based anywhere in the world.
          </p>
        </div>

        {!loading && employer && (
          <Notice tone={employer.registration_verified ? 'success' : 'brand'}>
            <span className="flex flex-wrap items-center gap-2">
              {employer.registration_verified ? 'Your business is verified.' : 'Verification pending — upload your registration document below.'}
              <VerifiedChips registration={employer.registration_verified} />
            </span>
          </Notice>
        )}

        <Card className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Registration details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Country of registration">
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="h-12 w-full rounded-md border border-line bg-surface px-4 text-base text-ink outline-none focus:border-brand"
              >
                {Object.entries(COUNTRY_NAMES).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Business registration number">
              <TextInput value={regNo} onChange={(e) => setRegNo(e.target.value)} placeholder="e.g. 202412345K (UEN), 1234567-X (SSM)…" />
            </Field>
          </div>
          <p className="text-xs text-muted">The format varies by country — enter it exactly as it appears on your registration.</p>
          <PrimaryButton className="w-fit" onClick={save} disabled={saving || !regNo.trim()}>
            {saving ? 'Saving…' : 'Save details'}
          </PrimaryButton>
        </Card>

        {employer && session && (
          <Card>
            <VerificationDocs
              userId={session.user.id}
              ownerKind="employer"
              ownerId={employer.id}
              docType="business_registration"
              hint="A copy of your business registration certificate or company profile (PDF or image)."
              onChange={reload}
            />
          </Card>
        )}
      </div>
    </EmployerDashboardLayout>
  )
}
