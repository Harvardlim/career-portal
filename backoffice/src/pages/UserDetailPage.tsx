import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Card } from '../components/ui'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { IconChevronLeft, IconEye, IconTrash } from '../components/Icons'
import {
  activeMembership,
  deleteCandidate,
  deleteEmployer,
  fetchCandidate,
  fetchCandidateResumes,
  fetchEmployer,
  fetchReferredBy,
  getResumeLinks,
  membershipStatusLabel,
  registrationsEnabled,
  type Candidate,
  type Employer,
  type ReferredBy as ReferredByRow,
  type ResumeLinks,
} from '../lib/registrations'

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : '—'

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)

function errMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === 'object' && e && 'message' in e) return String((e as { message: unknown }).message)
  return 'Something went wrong'
}

const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition'

const Chips = ({ items }: { items: string[] }) => {
  if (!items || items.length === 0) return <span className="text-muted">—</span>
  return (
    <span className="flex flex-wrap gap-1">
      {items.map((it) => (
        <span key={it} className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[11px] text-ink-200">
          {it}
        </span>
      ))}
    </span>
  )
}

const DField = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="grid grid-cols-[140px_1fr] gap-3 border-b border-line/60 py-2.5 text-[13px] last:border-0">
    <dt className="text-muted">{label}</dt>
    <dd className="min-w-0 whitespace-pre-wrap break-words text-ink-200">{children}</dd>
  </div>
)

const YesNo = ({ value }: { value: boolean }) => (
  <span className={value ? 'text-success' : 'text-muted'}>{value ? 'Yes' : 'No'}</span>
)

/** Shared 64px round picture — used for both candidate photo and company logo. */
const Portrait = ({ src }: { src: string | null }) =>
  src ? (
    <img
      src={src}
      alt=""
      className="size-16 rounded-full object-cover ring-1 ring-line"
      onError={(ev) => {
        ev.currentTarget.style.display = 'none'
      }}
    />
  ) : null

const fmtSize = (bytes: number | null) => {
  if (!bytes) return null
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

const ResumeRow = ({ path, name, size }: { path: string; name: string; size?: string | null }) => {
  const [links, setLinks] = useState<ResumeLinks | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    getResumeLinks(path)
      .then((l) => alive && setLinks(l))
      .catch((e: unknown) => alive && setErr(errMessage(e)))
    return () => {
      alive = false
    }
  }, [path])

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface-2 p-3">
      <div className="min-w-0">
        <p className="truncate text-[13px] text-ink-200">{name}</p>
        {size ? <p className="text-[12px] text-muted">{size}</p> : null}
      </div>
      {err ? (
        <p className="text-[12px] text-danger">Link failed: {err}</p>
      ) : !links ? (
        <p className="text-[12px] text-muted">Preparing link…</p>
      ) : (
        <div className="flex gap-2">
          <a
            href={links.view}
            target="_blank"
            rel="noreferrer"
            className={`${btnBase} gradient-brand text-white shadow-pop hover:brightness-110`}
          >
            <IconEye width={15} height={15} /> View
          </a>
          <a
            href={links.download}
            className={`${btnBase} border border-line bg-surface/50 text-ink-200 hover:text-ink`}
          >
            Download
          </a>
        </div>
      )}
    </div>
  )
}

const ReferredBy = ({ userId, email }: { userId: string | null; email: string | null }) => {
  const [row, setRow] = useState<ReferredByRow | null | undefined>(undefined)
  useEffect(() => {
    let alive = true
    fetchReferredBy(userId, email)
      .then((r) => alive && setRow(r))
      .catch(() => alive && setRow(null))
    return () => {
      alive = false
    }
  }, [userId, email])

  if (row === undefined) return <span className="text-muted">…</span>
  if (row === null) return <span className="text-muted">Direct sign-up</span>
  return (
    <span>
      {row.affiliate_name ?? 'Affiliate'}{' '}
      <span className="font-mono text-[12px] text-muted">({row.affiliate_code})</span>
      <span className="ml-2 text-[12px] text-muted">
        · via {row.via_invite ? 'invitation' : 'referral link'} · commission {row.commission_status}
      </span>
    </span>
  )
}

const CandidateResumes = ({ candidateId, legacyPath }: { candidateId: string; legacyPath: string | null }) => {
  const [items, setItems] = useState<{ path: string; name: string; size?: string | null }[] | null>(
    null,
  )

  useEffect(() => {
    let alive = true
    fetchCandidateResumes(candidateId)
      .then((rows) => {
        if (!alive) return
        const list = rows.map((r) => ({
          path: r.storage_path,
          name: r.file_name,
          size: fmtSize(r.size_bytes),
        }))
        if (legacyPath) {
          list.push({ path: legacyPath, name: legacyPath.split('/').pop() ?? 'resume', size: null })
        }
        setItems(list)
      })
      .catch(() => alive && setItems(legacyPath ? [{ path: legacyPath, name: legacyPath.split('/').pop() ?? 'resume' }] : []))
    return () => {
      alive = false
    }
  }, [candidateId, legacyPath])

  return (
    <div className="mt-4">
      <p className="mb-2 text-[12px] font-medium text-muted">Resume / CV</p>
      {items === null ? (
        <p className="text-[12px] text-muted">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-[12px] text-muted">No resume uploaded.</p>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <ResumeRow key={it.path} path={it.path} name={it.name} size={it.size} />
          ))}
        </div>
      )}
    </div>
  )
}

const CandidateBody = ({ c }: { c: Candidate }) => {
  const m = activeMembership(c)
  return (
    <>
      <dl>
        <DField label="Full name">{c.full_name}</DField>
        <DField label="Email">
          <a href={`mailto:${c.email}`} className="text-brand-2 hover:underline">
            {c.email}
          </a>
        </DField>
        <DField label="Contact">{c.contact_number}</DField>
        <DField label="Expertise">
          {c.expertise_field.length ? <Chips items={c.expertise_field} /> : '—'}
        </DField>
        <DField label="Experience">{c.years_experience || '—'}</DField>
        <DField label="Past experience">{c.past_experience || '—'}</DField>
        <DField label="Interests">{c.interests.length ? <Chips items={c.interests} /> : '—'}</DField>
        <DField label="Referral opt-in">
          <YesNo value={c.referral_opt_in} />
        </DField>
        <DField label="Referred by">
          <ReferredBy userId={c.user_id} email={c.email} />
        </DField>
        <DField label="Submitted">{fmtDate(c.created_at)}</DField>
        {m ? (
          <>
            <DField label="Membership">
              {m.plan}
              {m.period ? ` · ${usd(m.amount_usd)}/${m.period}` : ` · ${usd(m.amount_usd)}`}
            </DField>
            <DField label="Membership status">{membershipStatusLabel(m.status)}</DField>
            <DField label="Subscribed on">{fmtDate(m.started_at)}</DField>
            <DField label="Expires">{fmtDate(m.expires_at)}</DField>
          </>
        ) : (
          <DField label="Membership">Free — not subscribed</DField>
        )}
      </dl>
      <CandidateResumes candidateId={c.id} legacyPath={c.resume_path} />
    </>
  )
}

const EmployerBody = ({ e }: { e: Employer }) => (
  <dl>
    <DField label="Company">{e.company_name}</DField>
    <DField label="Reg. no">{e.reg_no}</DField>
    <DField label="Field">{e.field.length ? <Chips items={e.field} /> : '—'}</DField>
    <DField label="Business email">
      <a href={`mailto:${e.business_email}`} className="text-brand-2 hover:underline">
        {e.business_email}
      </a>
    </DField>
    <DField label="Details">{e.business_details || '—'}</DField>
    <DField label="Looking for">{e.looking_for.length ? <Chips items={e.looking_for} /> : '—'}</DField>
    <DField label="Referral opt-in">
      <YesNo value={e.referral_opt_in} />
    </DField>
    <DField label="Referred by">
      <ReferredBy userId={e.user_id} email={e.business_email} />
    </DField>
    <DField label="Submitted">{fmtDate(e.created_at)}</DField>
  </dl>
)

export const UserDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const kind: 'candidate' | 'employer' = pathname.includes('/employers/') ? 'employer' : 'candidate'
  const listPath = kind === 'employer' ? '/users/employers' : '/users/candidates'

  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [employer, setEmployer] = useState<Employer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    if (!registrationsEnabled || !id) {
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    const load = kind === 'employer' ? fetchEmployer(id) : fetchCandidate(id)
    load
      .then((row) => {
        if (!alive) return
        if (kind === 'employer') setEmployer(row as Employer | null)
        else setCandidate(row as Candidate | null)
        if (!row) setError(`${kind === 'employer' ? 'Employer' : 'Candidate'} not found.`)
      })
      .catch((e) => alive && setError(errMessage(e)))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [id, kind])

  const name = kind === 'employer' ? employer?.company_name : candidate?.full_name
  const picture = kind === 'employer' ? (employer?.logo_url ?? null) : (candidate?.avatar_path ?? null)
  const found = kind === 'employer' ? employer : candidate

  async function handleDelete() {
    if (!id) return
    setDeleting(true)
    setDeleteError(null)
    try {
      if (kind === 'employer') await deleteEmployer(id)
      else await deleteCandidate(id, candidate?.resume_path || undefined)
      navigate(listPath)
    } catch (e) {
      setDeleteError(errMessage(e))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={listPath}
          className="inline-flex items-center gap-1 text-[13px] font-medium text-muted hover:text-ink-200"
        >
          <IconChevronLeft width={14} height={14} />
          {kind === 'employer' ? 'Employers' : 'Candidates'}
        </Link>
        <div className="mt-2 flex items-center gap-4">
          <Portrait src={picture} />
          <div>
            <h1 className="text-[24px] font-semibold text-ink">{name ?? 'Details'}</h1>
            <p className="text-[13px] text-muted">
              {kind === 'employer' ? 'Employer registration' : 'Candidate registration'}
            </p>
          </div>
        </div>
      </div>

      {!registrationsEnabled ? (
        <Card className="p-6 text-[14px] text-muted">Connect Supabase to view registrations.</Card>
      ) : loading ? (
        <Card className="p-6 text-[14px] text-muted">Loading…</Card>
      ) : error || !found ? (
        <Card className="p-6 text-[14px] text-danger">{error ?? 'Not found.'}</Card>
      ) : (
        <Card className="p-6">
          {kind === 'employer' ? <EmployerBody e={employer!} /> : <CandidateBody c={candidate!} />}

          <div className="mt-6 border-t border-line pt-4">
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="inline-flex items-center gap-2 text-[13px] font-semibold text-danger hover:underline"
            >
              <IconTrash width={15} height={15} />
              Delete {kind === 'employer' ? 'employer' : 'candidate'}
            </button>
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={confirming}
        title={`Delete ${kind === 'employer' ? 'employer' : 'candidate'}`}
        message={
          <>
            <strong className="text-ink-200">{name}</strong> and their registration data will be
            permanently removed.
          </>
        }
        confirmLabel="Delete"
        busy={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => setConfirming(false)}
      />
    </div>
  )
}
