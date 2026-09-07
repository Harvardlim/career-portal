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

export function ApplyJobPage() {
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
      toast.success('Resume uploaded and saved to your account')
    } catch (err) {
      toast.error(errMessage(err))
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!candidate || !session) {
      toast.error('Sign in as a candidate to apply.')
      navigate('/sign-in')
      return
    }
    if (!job) return
    if (!resumeId) {
      toast.error('Choose or upload a resume to apply.')
      return
    }
    if (blocked) {
      toast('You have already applied to this job.')
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
            resume_id: resumeId,
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
          resume_id: resumeId,
          cover_letter: cover.trim() || null,
        })
        if (error) {
          if (/duplicate|unique/i.test(error.message)) {
            toast('You have already applied to this job.')
            navigate(`/job/${job.slug}`)
            return
          }
          throw error
        }
      }
      toast.success(canReapply ? 'Re-applied successfully' : 'Application submitted')
      navigate('/dashboard/applied-jobs')
    } catch (err) {
      toast.error(errMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const resumeOptions = [
    { value: '', label: 'Select a resume…' },
    ...resumes.map((r) => ({ value: r.id, label: r.file_name })),
  ]

  return (
    <AppShell>
      <Breadcrumb
        title="Apply Job"
        trail={[
          { label: 'Home', to: '/' },
          { label: 'Find Job', to: '/find-job' },
          { label: job?.title ?? 'Apply' },
        ]}
      />

      <div className="mx-auto w-full max-w-[720px] px-6 py-12 lg:px-10">
        {loading || candidateLoading ? (
          <p className="py-10 text-center text-sm text-muted">Loading…</p>
        ) : !job ? (
          <p className="rounded-lg bg-surface-alt px-4 py-12 text-center text-sm text-muted">
            Job not found.{' '}
            <Link to="/find-job" className="font-medium text-brand">
              Browse jobs
            </Link>
          </p>
        ) : !candidate ? (
          <div className="rounded-xl border border-line p-8 text-center">
            <p className="text-base font-medium text-ink">
              Sign in to apply for {job.title}
            </p>
            <Link
              to="/sign-in"
              className="mt-4 inline-flex items-center gap-2 rounded-[4px] bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600"
            >
              Sign in <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        ) : blocked ? (
          <div className="rounded-xl border border-line p-8 text-center">
            <p className="text-base font-medium text-ink">
              You&apos;ve already applied to {job.title}
            </p>
            <p className="mt-1 text-sm text-muted">
              Current status:{' '}
              <span className="font-medium capitalize text-ink">
                {existingApp?.status === 'active'
                  ? 'submitted'
                  : existingApp?.status}
              </span>
              . You can apply again only if this application is rejected.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Link
                to="/dashboard/applied-jobs"
                className="rounded-[4px] bg-brand-50 px-6 py-3 text-sm font-semibold text-brand"
              >
                View my applications
              </Link>
              <Link
                to={`/job/${job.slug}`}
                className="rounded-[4px] border border-line px-6 py-3 text-sm font-semibold text-ink-600"
              >
                Back to job
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6 rounded-xl border border-line p-8"
          >
            <div>
              <h1 className="text-xl font-medium text-ink">
                {canReapply ? 'Re-apply for ' : 'Apply for '}
                {job.title}
              </h1>
              <p className="mt-1 text-sm text-muted">
                {job.company_name}
                {job.location ? ` · ${job.location}` : ''}
              </p>
            </div>

            {canReapply && (
              <p className="rounded-md bg-star/10 px-4 py-3 text-sm text-ink-600">
                Your previous application was rejected — submit an updated one
                below.
              </p>
            )}

            <div className="flex flex-col gap-2 text-sm text-ink">
              <span>
                Resume <span className="text-danger">*</span>
              </span>
              {resumes.length > 0 && (
                <SelectMenu
                  value={resumeId}
                  onChange={setResumeId}
                  options={resumeOptions}
                  placeholder="Select a resume…"
                />
              )}
              <label className="flex w-fit cursor-pointer items-center gap-2 rounded-md border border-line px-4 py-2 text-sm font-medium text-ink-600 hover:bg-surface-alt">
                {uploading
                  ? 'Uploading…'
                  : resumes.length
                    ? 'Upload another resume'
                    : 'Upload your resume'}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="sr-only"
                  disabled={uploading}
                  onChange={(e) => handleUpload(e.target.files?.[0] ?? null)}
                />
              </label>
              <span className="text-xs text-muted">
                PDF or DOCX. Uploads are saved to your account and reusable next time.
              </span>
            </div>

            <label className="flex flex-col gap-2 text-sm text-ink">
              Cover Letter
              <textarea
                rows={12}
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                placeholder="Tell the employer why you're a great fit for this role…"
                className="w-full resize-y rounded-md border border-line bg-surface p-4 text-base leading-7 text-ink outline-none focus:border-brand placeholder:text-muted-400"
              />
            </label>

            <div className="flex items-center justify-between">
              <Link
                to={`/job/${job.slug}`}
                className="rounded-[4px] bg-brand-50 px-6 py-3 text-sm font-semibold text-brand"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || uploading || !resumeId}
                className="flex items-center gap-2 rounded-[4px] bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Apply Now'}
                <ArrowRightIcon className="size-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  )
}
