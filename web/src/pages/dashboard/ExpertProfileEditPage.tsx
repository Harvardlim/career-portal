import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Field, PhoneInput, Select, TextInput } from '@/components/dashboard/form'
import { SelectMenu } from '@/components/app/SelectMenu'
import { FileIcon, LinkedinIcon, MailIcon, PlusCircleIcon, TrashIcon } from '@/components/icons'
import { Avatar, Card, Notice, PrimaryButton, SecondaryButton, VerifiedChips } from '@/components/partly/ui'
import {
  birthMonthProblem,
  deleteResume,
  fetchMyResumes,
  MIN_EXPERT_AGE,
  formatFileSize,
  updateMyCandidate,
  uploadCandidateAvatar,
  uploadResume,
  type ResumeRow,
} from '@/lib/candidateProfile'
import { useCategories } from '@/lib/categories'
import { useCandidate } from '@/lib/dashboard'
import { clearDisplayUserCache } from '@/lib/useDisplayUser'
import { experienceRanges } from '@/data/categories'
import { supabase } from '@/lib/supabase'
import { nationalFromStored, toStoredPhone, validateCountryPhone } from '@/lib/phone'
import { intlLocale, tr, useT } from '@/lib/i18n'
import { categoryLabel } from '@/lib/categoryNames'

type Portfolio = { label: string; url: string }

const educationOptions = ['Select...', 'High School', 'Diploma', 'Bachelor Degree', 'Master Degree', 'PhD']
const nationalityOptions = ['Select...', 'Malaysia', 'Singapore', 'Indonesia', 'Thailand', 'Vietnam', 'Philippines', 'India', 'United States', 'United Kingdom', 'Other']
const genderOptions = ['Select...', 'Male', 'Female', 'Other']
// Only month + year of birth is kept (never the day) ,  enough to confirm age.
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
function getMonthOptions() {
  const fmt = new Intl.DateTimeFormat(intlLocale(), { month: 'long' })
  return [
    { value: '', label: tr('opt.month') },
    ...MONTHS.map((_, i) => ({ value: String(i + 1).padStart(2, '0'), label: fmt.format(new Date(2000, i, 1)) })),
  ]
}
const THIS_YEAR = new Date().getFullYear()
function getYearOptions() {
  return [
    { value: '', label: tr('opt.year') },
    ...Array.from({ length: 60 }, (_, i) => String(THIS_YEAR - MIN_EXPERT_AGE - i)).map((y) => ({ value: y, label: y })),
  ]
}

function ResumeList({ candidateId, resumes, onChange }: { candidateId: string; resumes: ResumeRow[]; onChange: () => void }) {
  const t = useT()
  const id = useId()
  const [busy, setBusy] = useState(false)

  async function handleAdd(file: File | null) {
    if (!file) return
    setBusy(true)
    try {
      await uploadResume(candidateId, file)
      toast.success(t('ui.resume_uploaded'))
      onChange()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('ui.upload_failed'))
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(row: ResumeRow) {
    try {
      await deleteResume(row)
      toast.success(t('ui.resume_removed'))
      onChange()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('ui.could_not_remove'))
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
          <button type="button" aria-label={t('ui.remove_2', { file_name: r.file_name })} onClick={() => handleDelete(r)} className="shrink-0 text-muted hover:text-danger">
            <TrashIcon className="size-5" />
          </button>
        </div>
      ))}
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-surface-alt/40 p-6 text-center hover:border-brand">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-ink">
          <PlusCircleIcon className="size-5 text-brand" />
          {busy ? t('ui.uploading_2') : t('ui.add_cv_resume')}
        </span>
        <span className="text-xs text-muted">{t('ui.browse_file_or_drop_here_pdf')}</span>
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
  const t = useT()
  const { candidate, session, loading, reload } = useCandidate()
  const { categories } = useCategories()
  const [fullName, setFullName] = useState('')
  const [headline, setHeadline] = useState('')
  const [title, setTitle] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [years, setYears] = useState('')
  const [bio, setBio] = useState('')
  const [experience, setExperience] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [nationality, setNationality] = useState('')
  const [dobMonth, setDobMonth] = useState('')
  const [dobYear, setDobYear] = useState('')
  const [gender, setGender] = useState('')
  const [phone, setPhone] = useState('')
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
    setBusinessName(candidate.business_name ?? '')
    setYears(candidate.years_experience ?? '')
    setBio(candidate.biography ?? '')
    setExperience(candidate.past_experience ?? '')
    setLinkedin(candidate.linkedin_url ?? '')
    setNationality(candidate.nationality ?? '')
    setDobYear(candidate.date_of_birth?.slice(0, 4) ?? '')
    setDobMonth(candidate.date_of_birth?.slice(5, 7) ?? '')
    setGender(candidate.gender ?? '')
    setPhone(nationalFromStored(candidate.country_code, candidate.contact_number))
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

  const MAX_CATEGORIES = 2

  const toggleCat = (name: string) => {
    const cat = categories.find((c) => c.name === name)
    const ids = new Set(cat?.subcategories.map((s) => s.id) ?? [])
    if (!cats.includes(name) && cats.length >= MAX_CATEGORIES) {
      toast.error(t('ui.pick_up_to_main_categories', { MAX_CATEGORIES }))
      return
    }
    setCats((c) => (c.includes(name) ? c.filter((x) => x !== name) : [...c, name]))
    if (cats.includes(name)) setSubIds((s) => s.filter((id) => !ids.has(id)))
  }
  const toggleSub = (id: string) => setSubIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  async function save() {
    if (!candidate || !session) return
    // Both are required to apply to anything, so a saved profile can't be missing them.
    if (!years) return toast.error(t('ui.select_your_years_of_experience'))
    if (!experience.trim()) return toast.error(t('ui.add_your_experience_summary_businesses_read'))
    if (cats.length === 0) return toast.error(t('ui.pick_at_least_one_expert_category'))
    if (!phone.trim()) return toast.error(t('ui.add_a_phone_number_it_s'))
    const phoneErr = validateCountryPhone(candidate?.country_code, phone)
    if (phoneErr) return toast.error(phoneErr)
    const dobProblem = birthMonthProblem(dobYear, dobMonth)
    if (dobProblem) return toast.error(dobProblem)
    setSaving(true)
    try {
      await updateMyCandidate(session.user.id, {
        full_name: fullName.trim() || candidate.full_name,
        headline: headline.trim() || null,
        title: title.trim() || null,
        business_name: businessName.trim() || null,
        years_experience: years || null,
        biography: bio.trim() || null,
        past_experience: experience.trim(),
        linkedin_url: linkedin.trim() || null,
        nationality: nationality || null,
        date_of_birth: dobYear && dobMonth ? `${dobYear}-${dobMonth}-01` : null,
        gender: gender || null,
        contact_number: toStoredPhone(candidate?.country_code, phone),
        marital_status: null,
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
      toast.success(t('ui.profile_saved'))
      clearDisplayUserCache()
      await reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('ui.could_not_save'))
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
      clearDisplayUserCache()
      await reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('ui.upload_failed'))
    } finally {
      setUploading(false)
    }
  }

  if (loading || !candidate) {
    return (
      <DashboardLayout>
        <p className="text-sm text-muted">{t('ui.loading_2')}</p>
      </DashboardLayout>
    )
  }

  const badgeLive = !!candidate.verified_badge_until && new Date(candidate.verified_badge_until) > new Date()

  return (
    <DashboardLayout>
      <div className="flex max-w-3xl flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">{t('ui.expert_profile')}</h1>
          <p className="mt-1 text-sm text-muted">{t('ui.what_a_business_sees_on_your')}<Link to="/dashboard/hire-me" className="text-brand underline">{t('ui.hire_me_page')}</Link>{t('ui.your_email_and_phone_are_never')}</p>
        </div>

        <Card className="flex items-center gap-4">
          <Avatar name={candidate.full_name} src={candidate.avatar_path} size={72} />
          <div className="flex-1">
            <p className="font-medium text-ink">{fullName || candidate.full_name}</p>
            <p className="text-sm text-muted">{headline || t('ui.add_a_headline_below')}</p>
            <div className="mt-1">
              <VerifiedChips identity={candidate.identity_verified} badge={badgeLive} />
            </div>
          </div>
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
            <span className="inline-flex h-10 items-center rounded-md border border-line px-4 text-sm font-medium text-ink hover:bg-surface-alt">
              {uploading ? t('ui.uploading') : t('ui.change_photo')}
            </span>
          </label>
        </Card>

        <Card className="flex flex-col gap-4">
          <Field label={t('ui.full_name_exactly_as_on_your')}>
            <TextInput value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field label={t('ui.headline')}>
            <TextInput value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder={t('ui.e_g_fractional_cfo_series_a')} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('ui.current_title')}>
              <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('ui.e_g_independent_hr_consultant')} />
            </Field>
            <Field label={t('ui.years_of_experience')}>
              <Select value={years} onChange={setYears} options={['Select...', ...experienceRanges]} />
            </Field>
          </div>
          <Field label={t('ui.business_name_optional')}>
            <TextInput value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder={t('ui.if_you_work_through_your_own')} />
          </Field>
          <Field label={t('ui.experience_summary_required')}>
            <textarea
              rows={5}
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder={t('ui.roles_outcomes_the_kind_of_problems')}
              className="w-full resize-none rounded-md border border-line bg-surface p-4 text-base text-ink outline-none focus:border-brand placeholder:text-muted-400"
            />
          </Field>
          <Field label={t('ui.about_you')}>
            <textarea
              rows={5}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t('ui.a_little_about_you_and_how')}
              className="w-full resize-none rounded-md border border-line bg-surface p-4 text-base text-ink outline-none focus:border-brand placeholder:text-muted-400"
            />
          </Field>
          <Field label={t('ui.linkedin_profile')}>
            <TextInput value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder={t('ui.https_www_linkedin_com_in')} icon={<LinkedinIcon className="size-5" />} />
          </Field>
        </Card>

        <Card className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium text-ink">{t('ui.categories_you_serve')}</p>
            <p className="text-xs text-muted">{t('ui.businesses_post_needs_under_one_main')}</p>
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
                {categoryLabel(c.name)}
              </button>
            ))}
          </div>
          {categories
            .filter((c) => cats.includes(c.name))
            .map((c) => (
              <div key={c.id}>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{categoryLabel(c.name)}</p>
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
                      {categoryLabel(s.name)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
        </Card>

        <Card className="flex flex-col gap-3">
          <p className="text-sm font-medium text-ink">{t('ui.portfolio_links')}</p>
          {links.map((l, i) => (
            <div key={i} className="flex gap-2">
              <TextInput placeholder={t('ui.label')} value={l.label} onChange={(e) => setLinks((ls) => ls.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} className="max-w-[180px]" />
              <TextInput placeholder="https://" value={l.url} onChange={(e) => setLinks((ls) => ls.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
              <button type="button" onClick={() => setLinks((ls) => ls.filter((_, j) => j !== i))} className="text-muted hover:text-danger" aria-label={t('ui.remove_link')}>
                <TrashIcon className="size-5" />
              </button>
            </div>
          ))}
          <SecondaryButton className="w-fit" onClick={() => setLinks((ls) => [...ls, { label: '', url: '' }])}>{t('ui.add_a_link')}</SecondaryButton>
        </Card>

        <Card className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium text-ink">{t('ui.contact_details')}</p>
            <p className="text-xs text-muted">{t('ui.never_shown_on_your_profile_a')}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('ui.phone')}>
              <PhoneInput
                country={candidate?.country_code}
                value={phone}
                onChange={setPhone}
                invalid={!!phone.trim() && !!validateCountryPhone(candidate?.country_code, phone)}
              />
              {phone.trim() && validateCountryPhone(candidate?.country_code, phone) && (
                <p className="mt-1 text-xs text-danger">{validateCountryPhone(candidate?.country_code, phone)}</p>
              )}
            </Field>
            <Field label={t('ui.email')}>
              <TextInput
                type="email"
                icon={<MailIcon className="size-5" />}
                value={candidate?.email ?? session?.user.email ?? ''}
                disabled
                title={t('ui.this_is_the_email_you_sign_2')}
              />
              <p className="mt-1 text-xs text-muted">{t('ui.this_is_your_sign_in_email_2')}</p>
            </Field>
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <p className="text-sm font-medium text-ink">{t('ui.personal_details')}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('ui.nationality')}>
              <Select value={nationality} onChange={setNationality} options={nationalityOptions} />
            </Field>
            <Field label={t('ui.month_year_of_birth', { MIN_EXPERT_AGE })}>
              <div className="grid grid-cols-2 gap-2">
                <SelectMenu value={dobMonth} onChange={setDobMonth} options={getMonthOptions()} />
                <SelectMenu value={dobYear} onChange={setDobYear} options={getYearOptions()} />
              </div>
            </Field>
            <Field label={t('ui.gender')}>
              <Select value={gender} onChange={setGender} options={genderOptions} />
            </Field>
            <Field label={t('ui.education')}>
              <Select value={education} onChange={setEducation} options={educationOptions} />
            </Field>
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium text-ink">{t('ui.cv_resume')}</p>
            <p className="mt-0.5 text-xs text-muted">{t('ui.shared_with_a_business_only_after')}</p>
          </div>
          <ResumeList candidateId={candidate.id} resumes={resumes} onChange={() => loadResumes(candidate.id)} />
        </Card>

        {!candidate.identity_verified && (
          <Notice tone="warning">{t('ui.you_can_t_apply_to_needs')}<Link to="/dashboard/verification" className="font-medium underline">{t('ui.finish_verification')}</Link>
            .
          </Notice>
        )}

        <PrimaryButton onClick={save} disabled={saving} className="w-fit">
          {saving ? t('ui.saving') : t('ui.save_profile')}
        </PrimaryButton>
      </div>
    </DashboardLayout>
  )
}
