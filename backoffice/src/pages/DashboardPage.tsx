import { StatCard } from '../components/dashboard/StatCard'
import { RevenueChart } from '../components/dashboard/RevenueChart'
import { ProfitChart, SessionsChart } from '../components/dashboard/SideCharts'
import { DeviceGauge } from '../components/dashboard/DeviceGauge'
import { RecentOrders } from '../components/dashboard/RecentOrders'
import { UsersByCountry } from '../components/dashboard/UsersByCountry'
import { Button, SectionTitle } from '../components/ui'
import {
  IconCalendar,
  IconChevronDown,
  IconDownload,
  IconEye,
  IconStar,
  IconUsers,
} from '../components/Icons'

const UserPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 20c.7-3.2 3-5 5.5-5 1 0 2 .3 2.8.8M17 8v6M14 11h6" />
  </svg>
)

const HeaderActions = () => (
  <div className="flex items-center gap-3">
    <button className="flex items-center gap-2 text-[13px] font-medium text-ink-200 hover:text-ink">
      Export data <IconDownload width={15} height={15} className="text-muted" />
    </button>
    <Button className="px-4 py-2">Create report</Button>
  </div>
)

export const DashboardPage = () => (
  <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-[26px] font-semibold text-ink">Welcome back, John</h1>
        <p className="mt-1 text-[13px] text-muted">
          Measure your advertising ROI and report website traffic.
        </p>
      </div>
      <HeaderActions />
    </div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard icon={<IconEye width={16} height={16} />} label="Pageviews" value="50.8K" delta="28.4%" dir="up" />
      <StatCard icon={<IconUsers width={16} height={16} />} label="Monthly users" value="23.6K" delta="12.6%" dir="down" />
      <StatCard icon={<UserPlus />} label="New sign ups" value="756" delta="3.1%" dir="up" />
      <StatCard icon={<IconStar width={16} height={16} />} label="Subscriptions" value="2.3K" delta="11.3%" dir="up" />
    </div>

    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <RevenueChart />
      <div className="space-y-5">
        <ProfitChart />
        <SessionsChart />
      </div>
    </div>

    <div className="pt-2">
      <SectionTitle>Reports overview</SectionTitle>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button className="flex items-center gap-2 rounded-lg border border-line bg-surface/50 px-3 py-2 text-[12px] text-ink-200">
          <IconCalendar width={14} height={14} className="text-muted" />
          Select date
          <IconChevronDown width={13} height={13} className="text-muted" />
        </button>
        <HeaderActions />
      </div>
    </div>

    <div className="grid gap-5 lg:grid-cols-2">
      <DeviceGauge />
      <RecentOrders />
    </div>

    <UsersByCountry />
  </div>
)
