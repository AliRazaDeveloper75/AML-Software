import { motion } from 'framer-motion'
import {
  Users, AlertTriangle, Shield, TrendingUp,
  DollarSign, Activity, FileText, Eye,
  BarChart3, PieChart as PieIcon,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAlertSummary, useOrgStats, useUnreviewedCount } from '../hooks/useDashboard'
import { useAlerts } from '../hooks/useAML'
import StatsCard from '../components/dashboard/StatsCard'
import RecentActivity from '../components/dashboard/RecentActivity'
import ComplianceStatus from '../components/dashboard/ComplianceStatus'
import Card from '../components/common/Card'
import Badge from '../components/common/Badge'
import Button from '../components/common/Button'
import { timeAgo } from '../utils/helpers'
import clsx from 'clsx'

function EmptyChart({ icon: Icon = BarChart3, label = 'No data yet', sub = 'Data will appear once activity begins' }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-10 text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-navy-750 flex items-center justify-center mb-3">
        <Icon size={20} className="text-slate-300 dark:text-slate-600" />
      </div>
      <p className="text-sm font-medium text-slate-400 dark:text-slate-500">{label}</p>
      <p className="text-xs text-slate-300 dark:text-slate-600 mt-0.5">{sub}</p>
    </div>
  )
}

const severityConfig = {
  critical: { label: 'Critical', variant: 'critical' },
  high: { label: 'High', variant: 'high' },
  medium: { label: 'Medium', variant: 'medium' },
  low: { label: 'Low', variant: 'low' },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: alertSummary } = useAlertSummary()
  const { data: orgStats } = useOrgStats()
  const { data: unreviewedData } = useUnreviewedCount()
  const { data: recentAlertsData } = useAlerts({ page_size: 5, ordering: '-created_at' })

  const openAlerts = alertSummary?.open_alerts ?? 0
  const criticalAlerts = alertSummary?.by_severity?.critical ?? 0
  const highAlerts = alertSummary?.by_severity?.high ?? 0
  const kycUsed = orgStats?.kyc?.used ?? 0
  const unreviewedCount = unreviewedData?.unreviewed_count ?? 0

  const recentAlerts = recentAlertsData?.results ?? recentAlertsData?.data ?? []

  const stats = [
    {
      label: 'Total Customers',
      value: kycUsed.toLocaleString(),
      subvalue: orgStats?.kyc?.limit ? `Limit: ${orgStats.kyc.limit}/month` : '',
      icon: Users, color: 'blue', trend: 'neutral', trendValue: orgStats?.plan ?? '',
    },
    {
      label: 'High Risk Customers',
      value: alertSummary?.high_risk_customers ?? 0,
      subvalue: 'Requires enhanced due diligence',
      icon: Shield, color: 'red', trend: 'neutral', trendValue: '',
    },
    {
      label: 'Active AML Alerts',
      value: openAlerts,
      subvalue: `${criticalAlerts} critical, ${highAlerts} high`,
      icon: AlertTriangle, color: 'amber',
      trend: openAlerts > 0 ? 'up' : 'down',
      trendValue: openAlerts > 0 ? `${openAlerts} open` : 'All clear',
    },
    {
      label: 'Monthly Revenue',
      value: orgStats?.revenue ? `AED ${Number(orgStats.revenue).toLocaleString()}` : 'AED 0',
      subvalue: 'From accounting GL',
      icon: TrendingUp, color: 'green', trend: 'neutral', trendValue: '',
    },
    {
      label: 'Unreviewed Alerts',
      value: unreviewedCount,
      subvalue: 'Transaction monitoring',
      icon: DollarSign, color: 'purple',
      trend: unreviewedCount > 0 ? 'up' : 'neutral',
      trendValue: unreviewedCount > 0 ? 'Needs review' : 'All reviewed',
    },
    {
      label: 'API Calls',
      value: orgStats?.api_calls?.used?.toLocaleString() ?? 0,
      subvalue: `Limit: ${orgStats?.api_calls?.limit ?? '—'}`,
      icon: Activity, color: 'blue', trend: 'neutral', trendValue: orgStats?.plan ?? '',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Welcome back, {user?.first_name ?? 'there'}. Here's what's happening today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-950/30 rounded-lg">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-green-700 dark:text-green-400">Live Monitoring</span>
          </div>
          <Button icon={FileText} onClick={() => navigate('/reports')} size="sm">
            Generate Report
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, i) => (
          <div key={stat.label} className="xl:col-span-2">
            <StatsCard {...stat} index={i} />
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue Chart — placeholder until accounting data exists */}
        <Card padding={false} className="lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-navy-700">
            <div>
              <h3 className="section-title">Revenue Analytics</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Revenue vs expenses from accounting GL</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/accounting/invoices')}>
              View Invoices
            </Button>
          </div>
          <div style={{ height: 260 }}>
            <EmptyChart icon={BarChart3} label="No revenue data yet" sub="Create invoices and expenses to see analytics" />
          </div>
        </Card>

        {/* Risk Distribution */}
        <Card padding={false} className="overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-navy-700">
            <h3 className="section-title">Risk Overview</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Customer risk distribution</p>
          </div>
          <div style={{ height: 260 }}>
            {kycUsed > 0 ? (
              <div className="p-5 space-y-3">
                {[
                  { label: 'Low Risk', color: '#10b981', count: alertSummary?.risk?.low ?? 0 },
                  { label: 'Medium Risk', color: '#f59e0b', count: alertSummary?.risk?.medium ?? 0 },
                  { label: 'High Risk', color: '#ef4444', count: alertSummary?.risk?.high ?? 0 },
                  { label: 'Critical', color: '#7c3aed', count: alertSummary?.risk?.critical ?? 0 },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
                      <span className="text-xs text-slate-600 dark:text-slate-400">{r.label}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{r.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyChart icon={PieIcon} label="No customers yet" sub="Add customers to see risk distribution" />
            )}
          </div>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* AML Alerts — real data */}
        <Card padding={false} className="lg:col-span-3 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-navy-700">
            <div>
              <h3 className="section-title">Active AML Alerts</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Requiring immediate attention</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/aml/alerts')}>
              View All
            </Button>
          </div>
          {recentAlerts.length === 0 ? (
            <EmptyChart icon={AlertTriangle} label="No active alerts" sub="AML alerts will appear here when triggered" />
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-navy-700">
              {recentAlerts.slice(0, 5).map((alert) => {
                const sev = severityConfig[alert.severity] || severityConfig.medium
                return (
                  <motion.div
                    key={alert.id}
                    whileHover={{ backgroundColor: 'rgba(248,250,252,0.8)' }}
                    onClick={() => navigate('/aml/alerts')}
                    className="flex items-center gap-4 px-5 py-3.5 cursor-pointer dark:hover:bg-navy-750 transition-colors"
                  >
                    <div className={clsx(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                      alert.severity === 'critical' ? 'bg-purple-100 dark:bg-purple-950/40' :
                      alert.severity === 'high' ? 'bg-red-100 dark:bg-red-950/40' :
                      alert.severity === 'medium' ? 'bg-amber-100 dark:bg-amber-950/40' :
                      'bg-green-100 dark:bg-green-950/40'
                    )}>
                      <AlertTriangle size={14} className={
                        alert.severity === 'critical' ? 'text-purple-600' :
                        alert.severity === 'high' ? 'text-red-600' :
                        alert.severity === 'medium' ? 'text-amber-600' :
                        'text-green-600'
                      } />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {alert.customer_name ?? alert.customer ?? '—'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {alert.alert_type ?? alert.rule_name ?? alert.description ?? ''}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge variant={sev.variant}>{sev.label}</Badge>
                      <p className="text-xs text-slate-400 mt-1">{timeAgo(alert.created_at ?? alert.detected_at)}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-5">
          <Card padding={false} className="overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-navy-700">
              <h3 className="section-title">Recent Activity</h3>
            </div>
            <div className="p-3">
              <RecentActivity />
            </div>
          </Card>
        </div>
      </div>

      {/* Compliance Status */}
      <Card padding={false} className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-navy-700">
          <div>
            <h3 className="section-title">Compliance Status</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Regulatory compliance checklist</p>
          </div>
          <Button variant="outline" size="sm" icon={Eye} onClick={() => navigate('/reports')}>
            View Report
          </Button>
        </div>
        <div className="p-5">
          <ComplianceStatus />
        </div>
      </Card>
    </div>
  )
}
