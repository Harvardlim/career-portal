import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Card } from '../components/ui'
import {
  ListCard,
  Pagination,
  PAGE_SIZES,
  TableSearch,
  lc,
  useTableView,
} from '../components/ListShell'
import { IconBriefcase, IconEye, IconHeart, IconUsers } from '../components/Icons'
import {
  activeMembership,
  fetchCandidates,
  fetchEmployers,
  registrationsEnabled,
  type Candidate,
  type Employer,
} from '../lib/registrations'

type Tab = 'candidates' | 'employers'

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—'

const Chips = ({ items, all }: { items: string[]; all?: boolean }) => {
  if (!items || items.length === 0) return <span className="text-muted">—</span>
  const shown = all ? items : items.slice(0, 3)
  return (
    <span className="flex flex-wrap gap-1">
      {shown.map((it) => (
        <span
          key={it}
          className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[11px] text-ink-200"
        >
          {it}
        </span>
      ))}
      {!all && items.length > shown.length ? (
        <span className="text-[11px] text-muted">+{items.length - shown.length}</span>
      ) : null}
    </span>
  )
}

const EyeButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button
    type="button"
    aria-label={label}
    onClick={onClick}
    className="grid size-8 place-items-center rounded-md text-muted hover:bg-white/[0.05] hover:text-ink"
  >
    <IconEye width={16} height={16} />
  </button>
)

const Avatar = ({
  label,
  tint,
  src,
}: {
  label: string
  tint: string
  src?: string | null
}) => {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="size-8 shrink-0 rounded-full object-cover ring-1 ring-line"
        onError={(ev) => {
          ev.currentTarget.style.display = 'none'
        }}
      />
    )
  }
  return (
    <span
      className={`grid size-8 shrink-0 place-items-center rounded-full text-[12px] font-semibold text-white ${tint}`}
    >
      {label.slice(0, 1).toUpperCase() || '?'}
    </span>
  )
}

const StatCard = ({
  icon,
  label,
  value,
  tint,
}: {
  icon: ReactNode
  label: string
  value: number
  tint: string
}) => (
  <Card className="p-5">
    <div className="flex items-center gap-3">
      <span className={`grid size-11 place-items-center rounded-full ${tint}`}>{icon}</span>
      <div>
        <p className="text-[20px] font-semibold text-ink">{value}</p>
        <p className="text-[13px] text-muted">{label}</p>
      </div>
    </div>
  </Card>
)

const thCls = 'px-3 py-3 font-medium first:pl-6 last:pr-6'
const tdCls = 'px-3 py-4 align-top first:pl-6 last:pr-6'

export const UsersPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const tab: Tab = location.pathname.endsWith('/employers') ? 'employers' : 'candidates'
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [employers, setEmployers] = useState<Employer[]>([])
  const [loading, setLoading] = useState(registrationsEnabled)
  const [error, setError] = useState<string | null>(null)

  const candidatesView = useTableView(candidates, (c, q) =>
    [c.full_name, c.email, c.contact_number, ...c.expertise_field].some((v) => lc(v).includes(q)),
  )
  const employersView = useTableView(employers, (e, q) =>
    [e.company_name, e.business_email, e.reg_no, ...e.field].some((v) => lc(v).includes(q)),
  )

  useEffect(() => {
    if (!registrationsEnabled) return
    let alive = true
    Promise.all([fetchCandidates(), fetchEmployers()])
      .then(([c, e]) => {
        if (!alive) return
        setCandidates(c)
        setEmployers(e)
      })
      .catch((e: unknown) => alive && setError(errMessage(e)))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  const referrals = useMemo(
    () =>
      candidates.filter((c) => c.referral_opt_in).length +
      employers.filter((e) => e.referral_opt_in).length,
    [candidates, employers],
  )

  const view = tab === 'candidates' ? candidatesView : employersView
  const total = tab === 'candidates' ? candidates.length : employers.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold text-ink">Users</h1>
        <p className="mt-1 text-[13px] text-muted">
          Candidates and employers from the public sign-up flows.
        </p>
      </div>

      {!registrationsEnabled ? (
        <Card className="p-6 text-[13px] text-ink-200">
          <p className="font-semibold text-ink">Connect Supabase to see registrations</p>
          <p className="mt-1 text-muted">
            Set <code className="text-ink-200">VITE_SUPABASE_URL</code> and{' '}
            <code className="text-ink-200">VITE_SUPABASE_PUBLISHABLE_KEY</code> in{' '}
            <code className="text-ink-200">backoffice/.env.local</code>.
          </p>
        </Card>
      ) : (
        <>
          {error ? (
            <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-[13px] text-danger">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<IconUsers width={18} height={18} />}
              label="Total registrations"
              value={candidates.length + employers.length}
              tint="bg-brand/15 text-brand"
            />
            <StatCard
              icon={<IconUsers width={18} height={18} />}
              label="Candidates"
              value={candidates.length}
              tint="bg-cyan/15 text-cyan"
            />
            <StatCard
              icon={<IconBriefcase width={18} height={18} />}
              label="Employers"
              value={employers.length}
              tint="bg-success/15 text-success"
            />
            <StatCard
              icon={<IconHeart width={18} height={18} />}
              label="Referral opt-ins"
              value={referrals}
              tint="bg-white/[0.05] text-ink-200"
            />
          </div>

          <div className="inline-flex rounded-lg border border-line bg-surface-2 p-1 text-[13px]">
            {(['candidates', 'employers'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => navigate(`/users/${t}`)}
                className={`rounded-md px-3.5 py-1.5 font-medium capitalize transition ${
                  tab === t
                    ? 'bg-white/[0.06] text-ink'
                    : 'text-muted hover:text-ink-200'
                }`}
              >
                {t}
                <span className="ml-1.5 text-[11px] text-muted">
                  {t === 'candidates' ? candidates.length : employers.length}
                </span>
              </button>
            ))}
          </div>

          <ListCard
            title={tab === 'candidates' ? 'All Candidates' : 'All Employers'}
            range={loading ? 'Loading…' : `${view.filtered.length} of ${total}`}
            toolbar={
              <TableSearch
                value={view.query}
                onChange={view.setQuery}
                placeholder={tab === 'candidates' ? 'Search name, email…' : 'Search company, email…'}
              />
            }
          >
            <table className="w-full min-w-[960px] border-collapse text-left text-[13px]">
              {tab === 'candidates' ? (
                <>
                  <thead>
                    <tr className="border-y border-line text-[12px] text-muted">
                      <th className={thCls}>Name</th>
                      <th className={thCls}>Contact</th>
                      <th className={thCls}>Expertise</th>
                      <th className={thCls}>Experience</th>
                      <th className={thCls}>Interests</th>
                      <th className={thCls}>Submitted</th>
                      <th className={thCls} aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {!loading && candidatesView.paged.length === 0 ? (
                      <EmptyRow
                        span={7}
                        label={candidates.length === 0 ? 'No candidate registrations yet.' : 'No matches.'}
                      />
                    ) : (
                      candidatesView.paged.map((c) => (
                        <tr
                          key={c.id}
                          className="border-b border-line/60 last:border-0 hover:bg-white/[0.02]"
                        >
                          <td className={tdCls}>
                            <span className="flex items-center gap-3">
                              <Avatar label={c.full_name} tint="bg-brand/70" src={c.avatar_path} />
                              <span className="flex flex-col gap-1">
                                <span className="font-semibold text-ink">{c.full_name}</span>
                                {activeMembership(c) || c.referral_opt_in ? (
                                  <span className="flex flex-wrap gap-1">
                                    {activeMembership(c) ? (
                                      <span className="rounded bg-success/15 px-1.5 py-0.5 text-[10px] font-medium text-success">
                                        Subscribed
                                      </span>
                                    ) : null}
                                    {c.referral_opt_in ? (
                                      <span className="rounded bg-brand/15 px-1.5 py-0.5 text-[10px] font-medium text-brand">
                                        Referral
                                      </span>
                                    ) : null}
                                  </span>
                                ) : null}
                              </span>
                            </span>
                          </td>
                          <td className={tdCls}>
                            <span className="block text-ink-200">{c.email}</span>
                            <span className="block text-[12px] text-muted">
                              {c.contact_number}
                            </span>
                          </td>
                          <td className={tdCls}>
                            <Chips items={c.expertise_field} />
                          </td>
                          <td className={`${tdCls} text-ink-200`}>
                            {c.years_experience || '—'}
                          </td>
                          <td className={tdCls}>
                            <Chips items={c.interests} />
                          </td>
                          <td className={`${tdCls} whitespace-nowrap text-muted`}>
                            {fmtDate(c.created_at)}
                          </td>
                          <td className={`${tdCls} text-right`}>
                            <EyeButton
                              label={`View ${c.full_name}`}
                              onClick={() => navigate(`/users/candidates/${c.id}`)}
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </>
              ) : (
                <>
                  <thead>
                    <tr className="border-y border-line text-[12px] text-muted">
                      <th className={thCls}>Company</th>
                      <th className={thCls}>Business email</th>
                      <th className={thCls}>Field</th>
                      <th className={thCls}>Reg. no</th>
                      <th className={thCls}>Looking for</th>
                      <th className={thCls}>Submitted</th>
                      <th className={thCls} aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {!loading && employersView.paged.length === 0 ? (
                      <EmptyRow
                        span={7}
                        label={employers.length === 0 ? 'No employer registrations yet.' : 'No matches.'}
                      />
                    ) : (
                      employersView.paged.map((e) => (
                        <tr
                          key={e.id}
                          className="border-b border-line/60 last:border-0 hover:bg-white/[0.02]"
                        >
                          <td className={tdCls}>
                            <span className="flex items-center gap-3">
                              <Avatar label={e.company_name} tint="bg-cyan/70" src={e.logo_url} />
                              <span className="font-semibold text-ink">
                                {e.company_name}
                              </span>
                              {e.referral_opt_in ? (
                                <span className="rounded bg-brand/15 px-1.5 py-0.5 text-[10px] font-medium text-brand">
                                  referral
                                </span>
                              ) : null}
                            </span>
                          </td>
                          <td className={`${tdCls} text-ink-200`}>{e.business_email}</td>
                          <td className={tdCls}>
                            <Chips items={e.field} />
                          </td>
                          <td className={`${tdCls} text-ink-200`}>{e.reg_no}</td>
                          <td className={tdCls}>
                            <Chips items={e.looking_for} />
                          </td>
                          <td className={`${tdCls} whitespace-nowrap text-muted`}>
                            {fmtDate(e.created_at)}
                          </td>
                          <td className={`${tdCls} text-right`}>
                            <EyeButton
                              label={`View ${e.company_name}`}
                              onClick={() => navigate(`/users/employers/${e.id}`)}
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </>
              )}
            </table>
          </ListCard>
          {!loading && view.filtered.length > 0 ? (
            <Pagination
              page={view.page}
              pageSize={view.pageSize}
              total={view.filtered.length}
              onPageChange={view.setPage}
              onPageSizeChange={view.setPageSize}
              pageSizeOptions={PAGE_SIZES}
            />
          ) : null}
        </>
      )}
    </div>
  )
}

const EmptyRow = ({ span, label }: { span: number; label: string }) => (
  <tr>
    <td colSpan={span} className="px-6 py-10 text-center text-[13px] text-muted">
      {label}
    </td>
  </tr>
)

function errMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === 'object' && e && 'message' in e)
    return String((e as { message: unknown }).message)
  return 'Something went wrong'
}
