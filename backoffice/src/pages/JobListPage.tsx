import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CompanyBadge } from '../components/CompanyBadge'
import { Checkbox, ListCard, Pagination, SortHead } from '../components/ListShell'
import { Button, StatusPill } from '../components/ui'
import {
  IconBriefcase,
  IconCheckSquare,
  IconClipboard,
  IconPencil,
  IconSearch,
  IconTag,
  IconTrash,
} from '../components/Icons'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { JobApplicantsDialog } from '../components/JobApplicantsDialog'
import {
  createDraftJob,
  deleteJobs,
  fetchJobs,
  isJobLive,
  jobEditPath,
  jobsEnabled,
  type JobRow,
} from '../lib/jobs'
import { adminList, getAdminSession } from '../lib/admin'
import { errMessage } from '../lib/errors'

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : '—'

const JobIcon = ({ seed }: { seed: number }) => (
  <span
    className="grid size-8 place-items-center rounded-full text-white"
    style={{ background: `linear-gradient(135deg, hsl(${(seed * 47) % 360} 80% 60%), #00C2FF)` }}
  >
    <IconBriefcase width={15} height={15} />
  </span>
)

const CheckboxButton = ({
  checked,
  indeterminate,
  onClick,
  label,
}: {
  checked?: boolean
  indeterminate?: boolean
  onClick: () => void
  label: string
}) => (
  <button type="button" onClick={onClick} aria-label={label} aria-pressed={checked} className="inline-flex">
    <Checkbox checked={checked} indeterminate={indeterminate} />
  </button>
)

export const JobListPage = () => {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState<JobRow[]>([])
  const [loading, setLoading] = useState(jobsEnabled)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleteTargets, setDeleteTargets] = useState<JobRow[]>([])
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [viewingApplicants, setViewingApplicants] = useState<JobRow | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [creating, setCreating] = useState(false)
  const [adminNames, setAdminNames] = useState<Record<string, string>>({})

  useEffect(() => {
    adminList()
      .then((rows) => setAdminNames(Object.fromEntries(rows.map((a) => [a.id, a.name]))))
      .catch(() => {})
  }, [])

  async function load() {
    setLoading(true)
    try {
      setJobs(await fetchJobs())
      setError(null)
    } catch (e) {
      setError(errMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!jobsEnabled) return
    void load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return jobs
    return jobs.filter((j) =>
      [j.title, j.company_name, j.category, j.location].some((v) => v?.toLowerCase().includes(q)),
    )
  }, [jobs, query])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))

  useEffect(() => {
    setPage(1)
  }, [query, pageSize])

  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])

  const paged = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  )

  const selectedInView = paged.filter((j) => selected.has(j.id))
  const allSelected = paged.length > 0 && selectedInView.length === paged.length
  const someSelected = selectedInView.length > 0 && !allSelected

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelected) paged.forEach((j) => next.delete(j.id))
      else paged.forEach((j) => next.add(j.id))
      return next
    })

  async function handleAddJob() {
    setCreating(true)
    setError(null)
    try {
      const id = await createDraftJob(getAdminSession()?.id ?? null)
      navigate(jobEditPath(id, null))
    } catch (e) {
      setError(errMessage(e))
    } finally {
      setCreating(false)
    }
  }

  async function confirmDelete() {
    if (deleteTargets.length === 0) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteJobs(deleteTargets.map((j) => j.id))
      setDeleteTargets([])
      setSelected(new Set())
      await load()
    } catch (e) {
      setDeleteError(errMessage(e))
    } finally {
      setDeleting(false)
    }
  }

  const bulkCount = selectedInView.length
  const targetCount = deleteTargets.length
  const targetApplications = deleteTargets.reduce((s, j) => s + j.applications, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-[24px] font-semibold text-ink">Job List</h1>
        <label className="flex min-w-[280px] flex-1 items-center gap-2.5 rounded-xl border border-line bg-surface px-4 py-3">
          <IconSearch width={18} height={18} className="text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, company, category…"
            className="w-full bg-transparent text-[14px] text-ink-200 placeholder:text-muted focus:outline-none"
          />
        </label>
        <Button variant="ghost" className="px-4 py-3" onClick={() => void load()}>
          Refresh
        </Button>
        <Button className="px-5 py-3" disabled={creating} onClick={handleAddJob}>
          {creating ? 'Adding…' : 'Add job'}
        </Button>
      </div>

      {bulkCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-2/40 bg-brand-2/[0.08] px-4 py-3">
          <span className="text-[13px] font-medium text-ink-200">
            {bulkCount} job{bulkCount === 1 ? '' : 's'} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="rounded-lg border border-line px-3 py-1.5 text-[13px] font-semibold text-ink-200 hover:text-ink"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                setDeleteError(null)
                setDeleteTargets(selectedInView)
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-danger px-3 py-1.5 text-[13px] font-semibold text-white hover:brightness-110"
            >
              <IconTrash width={14} height={14} />
              Delete selected
            </button>
          </div>
        </div>
      ) : null}

      {!jobsEnabled ? (
        <div className="rounded-[12px] border border-line bg-surface p-6 text-[14px] text-muted shadow-card">
          Connect Supabase (set the env vars) to see jobs.
        </div>
      ) : (
        <ListCard
          title="All Jobs"
          range={loading ? 'Loading…' : `${filtered.length} of ${jobs.length}`}
        >
          <table className="w-full min-w-[900px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-y border-line text-[12px] text-muted">
                <th className="py-3 pl-6 pr-3 font-medium">
                  <span className="flex items-center gap-3">
                    <CheckboxButton
                      checked={allSelected}
                      indeterminate={someSelected}
                      onClick={toggleAll}
                      label={allSelected ? 'Deselect all' : 'Select all'}
                    />
                    <SortHead icon={<IconBriefcase width={13} height={13} />} label="Job Title" />
                  </span>
                </th>
                <th className="px-3 py-3 font-medium">
                  <SortHead icon={<IconTag width={13} height={13} />} label="Category" />
                </th>
                <th className="px-3 py-3 font-medium">
                  <SortHead icon={<IconClipboard width={13} height={13} />} label="Type" />
                </th>
                <th className="px-3 py-3 font-medium">
                  <SortHead icon={<IconBriefcase width={13} height={13} />} label="Company" />
                </th>
                <th className="px-3 py-3 font-medium">Applications</th>
                <th className="px-3 py-3 font-medium">Posted</th>
                <th className="px-3 py-3 font-medium">
                  <SortHead icon={<IconCheckSquare width={13} height={13} />} label="Status" />
                </th>
                <th className="py-3 pr-6" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-muted">
                    Loading…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-danger">
                    {error}
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-muted">
                    {jobs.length === 0 ? 'No jobs posted yet.' : 'No jobs match your search.'}
                  </td>
                </tr>
              ) : (
                paged.map((j, i) => {
                  const live = isJobLive(j)
                  return (
                    <tr
                      key={j.id}
                      className={`border-b border-line/60 last:border-0 hover:bg-white/[0.02] ${
                        selected.has(j.id) ? 'bg-brand-2/[0.06]' : ''
                      }`}
                    >
                      <td className="py-4 pl-6 pr-3">
                        <span className="flex items-center gap-3">
                          <CheckboxButton
                            checked={selected.has(j.id)}
                            onClick={() => toggleOne(j.id)}
                            label={`Select ${j.title}`}
                          />
                          <JobIcon seed={i + 1} />
                          <Link
                            to={jobEditPath(j.id, j.slug)}
                            className={`text-left font-semibold hover:text-brand-2 hover:underline ${
                              j.title ? 'text-ink' : 'text-muted italic'
                            }`}
                          >
                            {j.title || 'Untitled'}
                          </Link>
                          {j.featured ? (
                            <span className="rounded-md bg-brand/15 px-1.5 py-0.5 text-[11px] text-brand-2">
                              featured
                            </span>
                          ) : null}
                          {j.created_by_admin ? (
                            <span
                              className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[11px] text-muted"
                              title={
                                adminNames[j.created_by_admin]
                                  ? `Created by ${adminNames[j.created_by_admin]}`
                                  : 'Created by an admin'
                              }
                            >
                              admin
                            </span>
                          ) : null}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-muted">{j.category ?? '—'}</td>
                      <td className="px-3 py-4 text-ink-200">{j.job_type ?? '—'}</td>
                      <td className="px-3 py-4">
                        <CompanyBadge name={j.company_name || '—'} />
                      </td>
                      <td className="px-3 py-4">
                        <button
                          type="button"
                          onClick={() => setViewingApplicants(j)}
                          className="text-ink-200 hover:text-brand-2 hover:underline"
                        >
                          {j.applications}
                        </button>
                      </td>
                      <td className="px-3 py-4 text-muted">{fmtDate(j.posted_at ?? j.created_at)}</td>
                      <td className="px-3 py-4">
                        <StatusPill tone={live ? 'in' : 'out'}>
                          {live ? 'Open' : j.status === 'active' ? 'Expired' : j.status}
                        </StatusPill>
                      </td>
                      <td className="py-4 pr-6">
                        <span className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            aria-label={`Edit ${j.title}`}
                            onClick={() => navigate(jobEditPath(j.id, j.slug))}
                            className="inline-flex text-muted hover:text-ink-200"
                          >
                            <IconPencil width={15} height={15} />
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${j.title}`}
                            onClick={() => {
                              setDeleteError(null)
                              setDeleteTargets([j])
                            }}
                            className="inline-flex text-muted hover:text-danger"
                          >
                            <IconTrash width={15} height={15} />
                          </button>
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </ListCard>
      )}

      {!loading && !error && filtered.length > 0 ? (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={filtered.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      ) : null}

      <ConfirmDialog
        open={targetCount > 0}
        title={targetCount > 1 ? `Delete ${targetCount} jobs` : 'Delete job'}
        message={
          targetCount === 1 ? (
            <>
              <strong className="text-ink-200">{deleteTargets[0].title}</strong>
              {deleteTargets[0].company_name ? ` at ${deleteTargets[0].company_name}` : ''} will be
              permanently deleted, along with its {deleteTargets[0].applications} application
              {deleteTargets[0].applications === 1 ? '' : 's'}.
            </>
          ) : (
            <>
              {targetCount} jobs will be permanently deleted, along with{' '}
              {targetApplications} application{targetApplications === 1 ? '' : 's'} across them.
            </>
          )
        }
        confirmLabel={targetCount > 1 ? `Delete ${targetCount} jobs` : 'Delete job'}
        busy={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargets([])}
      />

      <JobApplicantsDialog
        job={viewingApplicants}
        onClose={() => setViewingApplicants(null)}
      />
    </div>
  )
}
