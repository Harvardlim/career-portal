import { useEffect, useState } from 'react'
import { StatCard } from '../components/dashboard/StatCard'
import { RevenueChart } from '../components/dashboard/RevenueChart'
import { ProfitChart, SessionsChart } from '../components/dashboard/SideCharts'
import { DeviceGauge } from '../components/dashboard/DeviceGauge'
import { RecentOrders } from '../components/dashboard/RecentOrders'
import { Card } from '../components/ui'
import { IconBriefcase, IconDollar, IconUsers } from '../components/Icons'
import { useAdminSession } from '../lib/admin'
import { fetchOverview, overviewEnabled, type Overview, type StatDelta } from '../lib/overview'
import { errMessage } from '../lib/errors'

const num = (n: number) => n.toLocaleString()
const money = (n: number) => {
  if (n >= 1000) return `$${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}K`
  return `$${Math.round(n).toLocaleString()}`
}
const dstr = (d?: StatDelta) => (d && d.pct > 0 ? `${d.pct}%` : undefined)
const ddir = (d?: StatDelta) => d?.dir

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

export const DashboardPage = () => {
  const session = useAdminSession()
  const [data, setData] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(overviewEnabled)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!overviewEnabled) return
    let alive = true
    fetchOverview()
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(errMessage(e)))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  const firstName = session?.name?.split(' ')[0] ?? 'Admin'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-semibold text-ink">Welcome back, {firstName}</h1>
        <p className="mt-1 text-[13px] text-muted">
          Live numbers from candidates, employers, jobs and finance.
        </p>
      </div>

      {!overviewEnabled ? (
        <Card className="p-6 text-[14px] text-muted">
          Connect Supabase (set the env vars) to see live data.
        </Card>
      ) : error ? (
        <Card className="p-6 text-[14px] text-danger">{error}</Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<IconUsers width={16} height={16} />}
              label="Candidates"
              value={loading ? '—' : num(data!.totals.candidates)}
              delta={dstr(data?.deltas.candidates)}
              dir={ddir(data?.deltas.candidates)}
            />
            <StatCard
              icon={<IconBriefcase width={16} height={16} />}
              label="Employers"
              value={loading ? '—' : num(data!.totals.employers)}
              delta={dstr(data?.deltas.employers)}
              dir={ddir(data?.deltas.employers)}
            />
            <StatCard
              icon={<IconBriefcase width={16} height={16} />}
              label="Jobs"
              value={loading ? '—' : num(data!.totals.jobs)}
              delta={dstr(data?.deltas.jobs)}
              dir={ddir(data?.deltas.jobs)}
            />
            <StatCard
              icon={<IconDollar width={16} height={16} />}
              label="Revenue"
              value={loading ? '—' : money(data!.totals.revenueUsd)}
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <RevenueChart
              months={data?.months}
              seriesA={data?.employerRevenue}
              seriesB={data?.membershipRevenue}
              labelA="Employer credits"
              labelB="Memberships"
              total={data ? money(data.totals.revenueUsd) : '—'}
              delta={null}
            />
            <div className="space-y-5">
              <ProfitChart
                title="Applications"
                value={loading ? '—' : num(data!.totals.applications)}
                delta={
                  dstr(data?.deltas.applications)
                    ? { value: dstr(data!.deltas.applications)!, dir: data!.deltas.applications.dir }
                    : undefined
                }
                series={data?.applications}
              />
              <SessionsChart
                title="New sign-ups"
                value={
                  loading
                    ? '—'
                    : num((data?.signups ?? []).reduce((s, x) => s + x, 0))
                }
                delta={undefined}
                series={data?.signups}
              />
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <DeviceGauge
              title="Users"
              total={data ? data.totals.candidates + data.totals.employers : 0}
              segments={[
                { label: 'Candidates', value: data?.totals.candidates ?? 0, color: '#CB3CFF' },
                { label: 'Employers', value: data?.totals.employers ?? 0, color: '#00C2FF' },
              ]}
            />
            <RecentOrders
              rows={(data?.recentPurchases ?? []).map((p) => ({
                id: p.id,
                company: p.company,
                date: fmtDateTime(p.date),
                status: p.status,
                total: money(p.amountUsd),
              }))}
            />
          </div>
        </>
      )}
    </div>
  )
}
