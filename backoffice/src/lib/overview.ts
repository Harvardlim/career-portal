import { supabase, isSupabaseConfigured } from './supabase'

export const overviewEnabled = isSupabaseConfigured

const client = () => {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

export type MonthPoint = { key: string; label: string }
export type StatDelta = { pct: number; dir: 'up' | 'down' }

export type Overview = {
  totals: {
    candidates: number
    employers: number
    jobs: number
    applications: number
    memberships: number
    revenueUsd: number
  }
  deltas: {
    candidates: StatDelta
    employers: StatDelta
    jobs: StatDelta
    applications: StatDelta
  }
  months: string[]
  /** Employer spend (credit packages) per month, last 12 months. */
  employerRevenue: number[]
  /** Candidate spend (memberships) per month, last 12 months. */
  membershipRevenue: number[]
  /** New sign-ups (candidates + employers) per month. */
  signups: number[]
  /** Job applications per month. */
  applications: number[]
  recentPurchases: {
    id: string
    company: string
    date: string
    status: string
    amountUsd: number
  }[]
}

/* ---------- helpers ---------- */

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function lastTwelveMonths(): { keys: string[]; labels: string[] } {
  const keys: string[] = []
  const labels: string[] = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    labels.push(MONTH_LABELS[d.getMonth()])
  }
  return { keys, labels }
}

const monthKey = (iso: string) => iso.slice(0, 7)

function bucketByMonth(rows: { at: string; value?: number }[], keys: string[]): number[] {
  const map = new Map(keys.map((k) => [k, 0]))
  for (const row of rows) {
    const k = monthKey(row.at)
    if (map.has(k)) map.set(k, (map.get(k) ?? 0) + (row.value ?? 1))
  }
  return keys.map((k) => map.get(k) ?? 0)
}

function delta(rows: string[], now = Date.now()): StatDelta {
  const DAY = 86_400_000
  let recent = 0
  let prior = 0
  for (const iso of rows) {
    const age = now - new Date(iso).getTime()
    if (age <= 30 * DAY) recent++
    else if (age <= 60 * DAY) prior++
  }
  if (prior === 0) {
    return { pct: recent > 0 ? 100 : 0, dir: 'up' }
  }
  const pct = ((recent - prior) / prior) * 100
  return { pct: Math.abs(Math.round(pct * 10) / 10), dir: pct >= 0 ? 'up' : 'down' }
}

async function count(table: string, column = 'id'): Promise<number> {
  const { count, error } = await client()
    .from(table)
    .select(column, { count: 'exact', head: true })
  if (error) throw error
  return count ?? 0
}

/* ---------- main ---------- */

export async function fetchOverview(): Promise<Overview> {
  const sb = client()
  const { keys: months, labels: monthLabels } = lastTwelveMonths()

  const [
    candidatesCount,
    employersCount,
    jobsCount,
    applicationsCount,
    membershipsCount,
    candidateRows,
    employerRows,
    jobRows,
    applicationRows,
    purchaseRows,
    membershipRows,
    recent,
  ] = await Promise.all([
    count('candidates'),
    count('employers'),
    count('jobs'),
    count('job_applications'),
    count('memberships'),
    sb.from('candidates').select('created_at'),
    sb.from('employers').select('created_at'),
    sb.from('jobs').select('created_at'),
    sb.from('job_applications').select('applied_at'),
    sb.from('credit_purchases').select('amount_usd, status, created_at'),
    sb.from('memberships').select('amount_usd, status, started_at'),
    sb
      .from('credit_purchases')
      .select('id, amount_usd, status, created_at, employer:employers ( company_name )')
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  for (const r of [candidateRows, employerRows, jobRows, applicationRows, purchaseRows, membershipRows, recent]) {
    if (r.error) throw r.error
  }

  const candidateDates = (candidateRows.data ?? []).map((r) => r.created_at as string)
  const employerDates = (employerRows.data ?? []).map((r) => r.created_at as string)
  const jobDates = (jobRows.data ?? []).map((r) => r.created_at as string)
  const applicationDates = (applicationRows.data ?? []).map((r) => r.applied_at as string)

  // Revenue counts only money actually collected: paid credit purchases and
  // active (subscribed) memberships — pending checkouts are excluded.
  const paidPurchases = (purchaseRows.data ?? []).filter(
    (r) => (r.status as string) === 'paid',
  )
  const paidMemberships = (membershipRows.data ?? []).filter(
    (r) => (r.status as string) === 'active',
  )
  const employerRevenueTotal = paidPurchases.reduce((s, r) => s + Number(r.amount_usd ?? 0), 0)
  const membershipRevenueTotal = paidMemberships.reduce(
    (s, r) => s + Number(r.amount_usd ?? 0),
    0,
  )

  return {
    totals: {
      candidates: candidatesCount,
      employers: employersCount,
      jobs: jobsCount,
      applications: applicationsCount,
      memberships: membershipsCount,
      revenueUsd: employerRevenueTotal + membershipRevenueTotal,
    },
    deltas: {
      candidates: delta(candidateDates),
      employers: delta(employerDates),
      jobs: delta(jobDates),
      applications: delta(applicationDates),
    },
    months: monthLabels,
    employerRevenue: bucketByMonth(
      paidPurchases.map((r) => ({ at: r.created_at as string, value: Number(r.amount_usd ?? 0) })),
      months,
    ),
    membershipRevenue: bucketByMonth(
      paidMemberships.map((r) => ({
        at: r.started_at as string,
        value: Number(r.amount_usd ?? 0),
      })),
      months,
    ),
    signups: bucketByMonth(
      [...candidateDates, ...employerDates].map((at) => ({ at })),
      months,
    ),
    applications: bucketByMonth(
      applicationDates.map((at) => ({ at })),
      months,
    ),
    recentPurchases: (recent.data ?? []).map((r) => {
      const employer = r.employer as { company_name?: string } | null
      return {
        id: r.id as string,
        company: employer?.company_name ?? 'Unknown',
        date: r.created_at as string,
        status: (r.status as string) ?? 'paid',
        amountUsd: Number(r.amount_usd ?? 0),
      }
    }),
  }
}
