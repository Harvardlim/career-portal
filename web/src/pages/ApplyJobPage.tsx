import { isOutsideExpertise } from '@/lib/partly'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AppShell } from '@/layouts/AppShell'
import { Breadcrumb } from '@/components/app/Breadcrumb'
import { SelectMenu } from '@/components/app/SelectMenu'
import { ArrowRightIcon } from '@/components/icons'
import { supabase } from '@/lib/supabase'
import { errMessage } from '@/lib/errors'
import { fetchJobBySlug, type JobRow } from '@/lib/jobs'
import {
  fetchMyResumes,
  uploadResume,
  type ResumeRow,
} from '@/lib/candidateProfile'
import { useCandidate } from '@/lib/dashboard'
import { missingApplyProfile } from '@/lib/partly'
import { useT } from '@/lib/i18n'

export function ApplyJobPage() {
  const t = useT()
  const [params] = useSearchParams()
  const slug = params.get('job')
  const navigate = useNavigate()
  const { candidate, session, loading: candidateLoading } = useCandidate()

  const [job, setJob] = useState<JobRow | null>(null)
  const [resumes, setResumes] = useState<ResumeRow[]>([])
  const [resumeId, setResumeId] = useState('')
  const [cover, setCover] = useState('')
  const [existingApp, setExistingApp] = useState<{
    id: string
    status: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    let alive = true
    ;(slug ? fetchJobBySlug(slug) : Promise.resolve(null))
      .then((j) => alive && setJob(j))
      .catch((err) => console.error('apply: job', err))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [slug])

  useEffect(() => {
    if (!candidate) return
    let alive = true
    fetchMyResumes(candidate.id)
      .then((r) => alive && setResumes(r))
      .catch((err) => console.error('apply: resumes', err))
    return () => {
      alive = false
    }
  }, [candidate])

  // Has this candidate already applied to this job?
  useEffect(() => {
    if (!candidate || !job) return
    let alive = true
    supabase
      .from('job_applications')
      .select('id, status')
      .eq('job_id', job.id)
      .eq('candidate_id', candidate.id)
      .maybeSingle()
      .then(({ data }) => alive && setExistingApp(data ?? null))
    return () => {
      alive = false
    }
  }, [candidate, job])

  // A rejected applicant may re-apply (updates the same row).
  const canReapply = existingApp?.status === 'rejected'
  const blocked = !!existingApp && !canReapply

  async function handleUpload(file: File | null) {
    if (!file || !candidate) return
    setUploading(true)
    try {
      const row = await uploadResume(candidate.id, file)
      setResumes((prev) => [row, ...prev])
      setResumeId(row.id)
      toast.success(t('ui.resume_uploaded_and_saved_to_your'))
    } catch (err) {
      toast.error(errMessage(err))
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!candidate || !session) {
      toast.error(t('ui.sign_in_as_a_candidate_to_2'))
      navigate('/sign-in')
      return
    }
    if (!job) return
    const missing = missingApplyProfile(candidate)
    if (missing.length > 0) {
      toast.error(t('ui.complete_your_profile_before_applying_add', { v: missing.join(t('ui.and')) }))
      navigate('/dashboard/expert-profile')
      return
    }
    if (isOutsideExpertise(job.category, candidate.expertise_field)) {
      toast.error(t('ui.this_need_is_in_which_isn', { category: job.category ?? '' }))
      return
    }
    if (!candidate.identity_verified) {
      toast.error(t('ui.finish_basic_verification_the_last_4'))
      navigate('/dashboard/verification')
      return
    }
    if (blocked) {
      toast(t('apply.already'))
      navigate(`/job/${job.slug}`)
      return
    }
    setSubmitting(true)
    try {
      if (canReapply && existingApp) {
        // Re-open the previously rejected application.
        const { error } = await supabase
          .from('job_applications')
          .update({
            status: 'active',
            resume_id: resumeId || null,
            cover_letter: cover.trim() || null,
            applied_at: new Date().toISOString(),
          })
          .eq('id', existingApp.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('job_applications').insert({
          job_id: job.id,
          candidate_id: candidate.id,
          user_id: session.user.id,
          resume_id: resumeId || null,
          cover_letter: cover.trim() || null,
        })
        if (error) {
          if (/duplicate|unique/i.test(error.message)) {
            toast(t('apply.already'))
            navigate(`/job/${job.slug}`)
            return
          }
          throw error
        }
      }
      toast.success(canReapply ? t('ui.re_applied_successfully') : t('ui.application_submitted'))
      navigate('/dashboard/applied-jobs')
    } catch (err) {
      toast.error(errMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const resumeOptions = [
    { value: '', label: t('ui.select_a_resume') },
    ...resumes.map((r) => ({ value: r.id, label: r.file_name })),
  ]

  return (
    <AppShell>
      <Breadcrumb
        title={t('ui.apply_job_2')}
        trail={[
          { label: t('ui.home'), to: '/' },
          { label: t('ui.find_job'), to: '/find-job' },
          { label: job?.title ?? 'Apply' },
        ]}
      />

      <div className="mx-auto w-full max-w-[720px] px-6 py-12 lg:px-10">
        {loading || candidateLoading ? (
          <p className="py-10 text-center text-sm text-muted">{t('ui.loading_2')}</p>
        ) : !job ? (
          <p className="rounded-lg bg-surface-alt px-4 py-12 text-center text-sm text-muted">{t('ui.job_not_found')}<Link to="/find-job" className="font-medium text-brand">{t('ui.browse_jobs')}</Link>
          </p>
        ) : !candidate ? (
          <div className="rounded-xl border border-line p-8 text-center">
            <p className="text-base font-medium text-ink">{t('ui.sign_in_to_apply_for', { title: job.title })}</p>
            <Link
              to="/sign-in"
              className="mt-4 inline-flex items-center gap-2 rounded-[4px] bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600"
            >{t('ui.sign_in')}{' '}<ArrowRightIcon className="size-4" />
            </Link>
          </div>
        ) : blocked ? (
          <div className="rounded-xl border border-line p-8 text-center">
            <p className="text-base font-medium text-ink">{t('ui.you_ve_already_applied_to', { title: job.title })}</p>
            <p className="mt-1 text-sm text-muted">{t('ui.current_status')}<span className="font-medium capitalize text-ink">
                {existingApp?.status === 'active'
                  ? 'submitted'
                  : existingApp?.status}
              </span>{t('ui.you_can_apply_again_only_if')}</p>
            <div className="mt-5 flex justify-center gap-3">
              <Link
                to="/dashboard/applied-jobs"
                className="rounded-[4px] bg-brand-50 px-6 py-3 text-sm font-semibold text-brand"
              >{t('ui.view_my_applications')}</Link>
              <Link
                to={`/job/${job.slug}`}
                className="rounded-[4px] border border-line px-6 py-3 text-sm font-semibold text-ink-600"
              >{t('ui.back_to_job')}</Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6 rounded-xl border border-line p-8"
          >
            <div>
              <h1 className="text-xl font-medium text-ink">
                {canReapply ? t('ui.re_apply_for') : t('ui.apply_for')}
                {job.title}
              </h1>
              <p className="mt-1 text-sm text-muted">
                {job.company_name}
                {job.location ? ` · ${job.location}` : ''}
              </p>
            </div>

            {canReapply && (
              <p className="rounded-md bg-star/10 px-4 py-3 text-sm text-ink-600">{t('ui.your_previous_application_was_rejected_submit')}</p>
            )}

            <div className="flex flex-col gap-2 text-sm text-ink">
              <span>{t('ui.resume')}{' '}<span className="text-muted">{t('ui.optional')}</span>
              </span>
              {resumes.length > 0 && (
                <SelectMenu
                  value={resumeId}
                  onChange={setResumeId}
                  options={resumeOptions}
                  placeholder={t('ui.select_a_resume')}
                />
              )}
              <label className="flex w-fit cursor-pointer items-center gap-2 rounded-md border border-line px-4 py-2 text-sm font-medium text-ink-600 hover:bg-surface-alt">
                {uploading
                  ? t('ui.uploading')
                  : resumes.length
                    ? t('ui.upload_another_resume')
                    : t('ui.upload_your_resume')}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="sr-only"
                  disabled={uploading}
                  onChange={(e) => handleUpload(e.target.files?.[0] ?? null)}
                />
              </label>
              <span className="text-xs text-muted">{t('ui.pdf_or_docx_not_required_your')}</span>
            </div>

            <label className="flex flex-col gap-2 text-sm text-ink">{t('ui.cover_letter')}<textarea
                rows={12}
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                placeholder={t('ui.tell_the_employer_why_you_re')}
                className="w-full resize-y rounded-md border border-line bg-surface p-4 text-base leading-7 text-ink outline-none focus:border-brand placeholder:text-muted-400"
              />
            </label>

            <div className="flex items-center justify-between">
              <Link
                to={`/job/${job.slug}`}
                className="rounded-[4px] bg-brand-50 px-6 py-3 text-sm font-semibold text-brand"
              >{t('ui.cancel')}</Link>
              <button
                type="submit"
                disabled={submitting || uploading}
                className="flex items-center gap-2 rounded-[4px] bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? t('ui.submitting') : t('ui.apply_now')}
                <ArrowRightIcon className="size-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  )
}
