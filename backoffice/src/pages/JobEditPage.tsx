import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { JobEditForm } from '../components/JobEditForm'
import { JobApplicantsDialog } from '../components/JobApplicantsDialog'
import { Card } from '../components/ui'
import { IconChevronLeft } from '../components/Icons'
import { fetchJob, isPlaceholderSlug, jobEditPath, jobsEnabled, type JobRow } from '../lib/jobs'
import { adminList } from '../lib/admin'
import { errMessage } from '../lib/errors'

export const JobEditPage = () => {
  const { jobId, jobSlug } = useParams<{ jobId: string; jobSlug?: string }>()
  const navigate = useNavigate()
  const [job, setJob] = useState<JobRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showApplicants, setShowApplicants] = useState(false)
  const [adminNames, setAdminNames] = useState<Record<string, string>>({})

  useEffect(() => {
    adminList()
      .then((rows) => setAdminNames(Object.fromEntries(rows.map((a) => [a.id, a.name]))))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!jobsEnabled || !jobId) {
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    fetchJob(jobId)
      .then((j) => {
        if (!alive) return
        setJob(j)
        if (!j) {
          setError('Job not found.')
          return
        }
        // Keep the URL's name segment in sync with the job's real slug.
        const canonical = jobEditPath(jobId, j.slug)
        if (`/jobs/edit/${jobId}/${jobSlug ?? ''}`.replace(/\/$/, '') !== canonical) {
          navigate(canonical, { replace: true })
        }
      })
      .catch((e) => alive && setError(errMessage(e)))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1 text-[13px] font-medium text-muted hover:text-ink-200"
          >
            <IconChevronLeft width={14} height={14} />
            Job list
          </Link>
          <h1 className="mt-1 flex items-center gap-2 text-[24px] font-semibold text-ink">
            {job ? job.title || 'New job' : 'Edit job'}
            {job?.created_by_admin ? (
              <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[12px] font-medium text-muted">
                Created by {adminNames[job.created_by_admin] ?? 'admin'}
              </span>
            ) : null}
          </h1>
          {job ? (
            <p className="text-[13px] text-muted">
              {isPlaceholderSlug(job.slug) ? 'Draft — URL is set on save' : `/${job.slug}`}
              {' · '}
              <button
                type="button"
                onClick={() => setShowApplicants(true)}
                className="text-brand-2 hover:underline"
              >
                {job.applications} applicant{job.applications === 1 ? '' : 's'}
              </button>
            </p>
          ) : null}
        </div>
      </div>

      {!jobsEnabled ? (
        <Card className="p-6 text-[14px] text-muted">
          Connect Supabase (set the env vars) to edit jobs.
        </Card>
      ) : loading ? (
        <Card className="p-6 text-[14px] text-muted">Loading…</Card>
      ) : error || !job ? (
        <Card className="p-6 text-[14px] text-danger">{error ?? 'Job not found.'}</Card>
      ) : (
        <JobEditForm
          job={job}
          onSaved={() => navigate('/jobs')}
          onCancel={() => navigate('/jobs')}
        />
      )}

      {job ? (
        <JobApplicantsDialog
          job={showApplicants ? job : null}
          onClose={() => setShowApplicants(false)}
        />
      ) : null}
    </div>
  )
}
