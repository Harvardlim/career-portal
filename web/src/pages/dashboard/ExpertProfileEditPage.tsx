import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Field, Select, TextInput } from '@/components/dashboard/form'
import { FileIcon, LinkedinIcon, PlusCircleIcon, TrashIcon } from '@/components/icons'
import { Avatar, Card, Notice, PrimaryButton, SecondaryButton, VerifiedChips } from '@/components/partly/ui'
import {
  deleteResume,
  fetchMyResumes,
  formatFileSize,
  updateMyCandidate,
  uploadCandidateAvatar,
  uploadResume,
  type ResumeRow,
} from '@/lib/candidateProfile'
import { useCategories } from '@/lib/categories'
import { useCandidate } from '@/lib/dashboard'
import { experienceRanges } from '@/data/categories'
import { supabase } from '@/lib/supabase'

type Portfolio = { label: string; url: string }

const educationOptions = ['Select...', 'High School', 'Diploma', 'Bachelor Degree', 'Master Degree', 'PhD']
const nationalityOptions = ['Select...', 'Malaysia', 'Singapore', 'Indonesia', 'India', 'United States', 'United Kingdom', 'Other']
const genderOptions = ['Select...', 'Male', 'Female', 'Other']
const maritalOptions = ['Select...', 'Single', 'Married', 'Other']

function ResumeList({ candidateId, resumes, onChange }: { candidateId: string; resumes: ResumeRow[]; onChange: () => void }) {
  const id = useId()
  const [busy, setBusy] = useState(false)

  async function handleAdd(file: File | null) {
    if (!file) return
    setBusy(true)
    try {
      await uploadResume(candidateId, file)
      toast.success('Resume uploaded')
      onChange()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(row: ResumeRow) {
    try {
      await deleteResume(row)
      toast.success('Resume removed')
      onChange()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not remove')
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {resumes.map((r) => (
        <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-alt/60 p-4">
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded bg-surface text-brand">
              <FileIcon className="size-5" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium text-ink">{r.file_name}</span>
              <span className="text-xs text-muted">{formatFileSize(r.size_bytes)}</span>
            </span>
          </span>
          <button type="button" aria-label={`Remove ${r.file_name}`} onClick={() => handleDelete(r)} className="shrink-0 text-muted hover:text-danger">
            <TrashIcon className="size-5" />
          </button>
        </div>
      ))}
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-surface-alt/40 p-6 text-center hover:border-brand">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-ink">
          <PlusCircleIcon className="size-5 text-brand" />
          {busy ? 'Uploading...' : 'Add CV / Resume'}
        </span>
        <span className="text-xs text-muted">Browse file or drop here. PDF or DOCX.</span>
        <input id={id} type="file" accept=".pdf,.doc,.docx" className="sr-only" onChange={(e) => handleAdd(e.target.files?.[0] ?? null)} />
      </label>
    </div>
  )
}

/**
 * The LinkedIn-style profile a business sees on the match card and the public
 * "Hire me" page: photo, headline, categories + sub-categories served,
 * experience, portfolio links. Contact details are never part of it.
 */
export function ExpertProfileEditPage() {
  const { candidate, session, loading, reload } = useCandidate()
  const { categories } = useCategories()
  const [fullName, setFullName] = useState('')
  const [headline, setHeadline] = useState('')
  const [title, setTitle] = useState('')
  const [years, setYears] = useState('')
  const [bio, setBio] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [nationality, setNationality] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')
  const [marital, setMarital] = useState('')
  const [education, setEducation] = useState('')
  const [cats, setCats] = useState<string[]>([])
  const [subIds, setSubIds] = useState<string[]>([])
  const [links, setLinks] = useState<Portfolio[]>([])
  const [resumes, setResumes] = useState<ResumeRow[]>([])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const loadResumes = (candidateId: string) => {
    fetchMyResumes(candidateId)
      .then(setResumes)
      .catch((err) => console.error('resumes', err))
  }

  useEffect(() => {
    if (!candidate) return
    setFullName(candidate.full_name ?? '')
    setHeadline(candidate.headline ?? '')
    setTitle(candidate.title ?? '')
    setYears(candidate.years_experience ?? '')
    setBio(candidate.biography ?? '')
    setLinkedin(candidate.linkedin_url ?? '')
    setNationality(candidate.nationality ?? '')
    setDob(candidate.date_of_birth ?? '')
    setGender(candidate.gender ?? '')
    setMarital(candidate.marital_status ?? '')
    setEducation(candidate.education ?? '')
    setCats(candidate.expertise_field ?? [])
    setLinks(Array.isArray(candidate.portfolio_links) ? candidate.portfolio_links : [])
    loadResumes(candidate.id)
    supabase
      .from('candidate_subcategories')
      .select('subcategory_id')
      .eq('candidate_id', candidate.id)
      .then(({ data }) => setSubIds((data ?? []).map((r) => r.subcategory_id as string)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidate])

  const toggleCat = (name: string) => {
    const cat = categories.find((c) => c.name === name)
    const ids = new Set(cat?.subcategories.map((s) => s.id) ?? [])
    setCats((c) => (c.includes(name) ? c.filter((x) => x !== name) : [...c, name]))
    if (cats.includes(name)) setSubIds((s) => s.filter((id) => !ids.has(id)))
  }
  const toggleSub = (id: string) => setSubIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  async function save() {
    if (!candidate || !session) return
    setSaving(true)
    try {
      await updateMyCandidate(session.user.id, {
        full_name: fullName.trim() || candidate.full_name,
        headline: headline.trim() || null,
        title: title.trim() || null,
        years_experience: years || null,
        biography: bio.trim() || null,
        linkedin_url: linkedin.trim() || null,
        nationality: nationality || null,
        date_of_birth: dob || null,
        gender: gender || null,
        marital_status: marital || null,
        education: education || null,
        expertise_field: cats,
        portfolio_links: links.filter((l) => l.url.trim()),
      })
      await supabase.from('candidate_subcategories').delete().eq('candidate_id', candidate.id)
      if (subIds.length > 0) {
        const { error } = await supabase
          .from('candidate_subcategories')
          .insert(subIds.map((subcategory_id) => ({ candidate_id: candidate.id, subcategory_id })))
        if (error) throw error
      }
      toast.success('Profile saved.')
      await reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  async function onPhoto(file: File | undefined) {
    if (!file || !session) return
    setUploading(true)
    try {
      const url = await uploadCandidateAvatar(session.user.id, file)
      await updateMyCandidate(session.user.id, { avatar_path: url })
      await reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  if (loading || !candidate) {
    return (
      <DashboardLayout>
        <p className="text-sm text-muted">Loading…</p>
      </DashboardLayout>
    )
  }

  const badgeLive = !!candidate.verified_badge_until && new Date(candidate.verified_badge_until) > new Date()

  return (
    <DashboardLayout>
      <div className="flex max-w-3xl flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">Expert profile</h1>
          <p className="mt-1 text-sm text-muted">
            What a business sees on your match card and your public{' '}
            <Link to="/dashboard/hire-me" className="text-brand underline">
              Hire-me page
            </Link>
            . Your email and phone are never shown — they're exchanged only after a paid unlock.
          </p>
        </div>

        <Card className="flex items-center gap-4">
          <Avatar name={candidate.full_name} src={candidate.avatar_path} size={72} />
          <div className="flex-1">
            <p className="font-medium text-ink">{fullName || candidate.full_name}</p>
            <p className="text-sm text-muted">{headline || 'Add a headline below'}</p>
            <div className="mt-1">
              <VerifiedChips identity={candidate.identity_verified} badge={badgeLive} />
            </div>
          </div>
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
            <span className="inline-flex h-10 items-center rounded-md border border-line px-4 text-sm font-medium text-ink hover:bg-surface-alt">
              {uploading ? 'Uploading…' : 'Change photo'}
            </span>
          </label>
        </Card>

        <Card className="flex flex-col gap-4">
          <Field label="Full name, exactly as on your ID">
            <TextInput value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field label="Headline">
            <TextInput value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Fractional CFO · Series A–B fundraising · SaaS" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Current title">
              <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Independent HR consultant" />
            </Field>
            <Field label="Years of experience">
              <Select value={years} onChange={(e) => setYears(e.target.value)} options={['Select...', ...experienceRanges]} />
            </Field>
          </div>
          <Field label="About you">
            <textarea
              rows={5}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Roles, outcomes, the kind of problems you solve…"
              className="w-full resize-none rounded-md border border-line bg-surface p-4 text-base text-ink outline-none focus:border-brand placeholder:text-muted-400"
            />
          </Field>
          <Field label="LinkedIn profile">
            <TextInput value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://www.linkedin.com/in/…" icon={<LinkedinIcon className="size-5" />} />
          </Field>
        </Card>

        <Card className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium text-ink">Categories you serve</p>
            <p className="text-xs text-muted">Businesses post needs under one main category; matching rewards overlap with the sub-categories you list.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {categories.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => toggleCat(c.name)}
                className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                  cats.includes(c.name) ? 'border-brand bg-brand-50 font-medium text-brand' : 'border-line text-ink-600 hover:bg-surface-alt'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
          {categories
            .filter((c) => cats.includes(c.name))
            .map((c) => (
              <div key={c.id}>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{c.name}</p>
                <div className="flex flex-wrap gap-2">
                  {c.subcategories.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => toggleSub(s.id)}
                      title={s.notes ?? undefined}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                        subIds.includes(s.id) ? 'border-brand bg-brand text-white' : 'border-line text-ink-600 hover:bg-surface-alt'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
        </Card>

        <Card className="flex flex-col gap-3">
          <p className="text-sm font-medium text-ink">Portfolio links</p>
          {links.map((l, i) => (
            <div key={i} className="flex gap-2">
              <TextInput placeholder="Label" value={l.label} onChange={(e) => setLinks((ls) => ls.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} className="max-w-[180px]" />
              <TextInput placeholder="https://" value={l.url} onChange={(e) => setLinks((ls) => ls.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
              <button type="button" onClick={() => setLinks((ls) => ls.filter((_, j) => j !== i))} className="text-muted hover:text-danger" aria-label="Remove link">
                <TrashIcon className="size-5" />
              </button>
            </div>
          ))}
          <SecondaryButton className="w-fit" onClick={() => setLinks((ls) => [...ls, { label: '', url: '' }])}>
            Add a link
          </SecondaryButton>
        </Card>

        <Card className="flex flex-col gap-4">
          <p className="text-sm font-medium text-ink">Personal details</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nationality">
              <Select value={nationality} onChange={(e) => setNationality(e.target.value)} options={nationalityOptions} />
            </Field>
            <Field label="Date of birth">
              <TextInput type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
            </Field>
            <Field label="Gender">
              <Select value={gender} onChange={(e) => setGender(e.target.value)} options={genderOptions} />
            </Field>
            <Field label="Marital status">
              <Select value={marital} onChange={(e) => setMarital(e.target.value)} options={maritalOptions} />
            </Field>
            <Field label="Education">
              <Select value={education} onChange={(e) => setEducation(e.target.value)} options={educationOptions} />
            </Field>
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <p className="text-sm font-medium text-ink">CV / Resume</p>
          <ResumeList candidateId={candidate.id} resumes={resumes} onChange={() => loadResumes(candidate.id)} />
        </Card>

        {!candidate.identity_verified && (
          <Notice tone="warning">
            You can't apply to needs until your identity is verified.{' '}
            <Link to="/dashboard/verification" className="font-medium underline">
              Finish verification
            </Link>
            .
          </Notice>
        )}

        <PrimaryButton onClick={save} disabled={saving} className="w-fit">
          {saving ? 'Saving…' : 'Save profile'}
        </PrimaryButton>
      </div>
    </DashboardLayout>
  )
}
