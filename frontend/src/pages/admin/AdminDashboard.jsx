import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Building2, Users, UserCheck, TrendingUp,
  ShieldAlert, CheckCircle,
} from 'lucide-react'
import api from '../../lib/api'

function StatCard({ label, value, sub, icon: Icon, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-white/5 rounded-2xl p-5"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-0.5">
        {value ?? <span className="text-slate-300 dark:text-slate-600 animate-pulse">—</span>}
      </p>
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">{sub}</p>}
    </motion.div>
  )
}

function PlanBadge({ plan }) {
  const styles = {
    starter: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
    professional: 'bg-blue-50 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300',
    enterprise: 'bg-violet-50 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[plan] ?? styles.starter}`}>
      {plan}
    </span>
  )
}

function StatusDot({ status }) {
  const styles = {
    active: 'bg-emerald-500',
    trial: 'bg-amber-400',
    suspended: 'bg-red-400',
    cancelled: 'bg-slate-400',
  }
  return (
    <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 capitalize">
      <span className={`w-1.5 h-1.5 rounded-full ${styles[status] ?? 'bg-slate-400'}`} />
      {status}
    </span>
  )
}

export default function AdminDashboard() {
  const { data: statsRes, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/platform-admin/stats/').then(r => r.data.data),
    staleTime: 30_000,
  })

  const { data: orgsRes } = useQuery({
    queryKey: ['admin-orgs-recent'],
    queryFn: () => api.get('/platform-admin/organizations/?').then(r => r.data.data?.slice(0, 5)),
    staleTime: 30_000,
  })

  const s = statsRes

  const statCards = [
    {
      label: 'Total Organizations',
      value: s?.organizations.total,
      sub: `+${s?.organizations.new_this_month ?? 0} this month`,
      icon: Building2,
      color: 'bg-violet-600',
    },
    {
      label: 'Active Organizations',
      value: s?.organizations.active,
      sub: `${s?.organizations.trial ?? 0} on trial`,
      icon: CheckCircle,
      color: 'bg-emerald-600',
    },
    {
      label: 'Total Users',
      value: s?.users.total,
      sub: `${s?.users.active ?? 0} active`,
      icon: Users,
      color: 'bg-blue-600',
    },
    {
      label: 'KYC Customers',
      value: s?.customers.total,
      sub: `${s?.customers.verified ?? 0} verified · ${s?.customers.pending ?? 0} pending`,
      icon: UserCheck,
      color: 'bg-amber-600',
    },
    {
      label: 'Suspended Orgs',
      value: s?.organizations.suspended,
      sub: 'Require attention',
      icon: ShieldAlert,
      color: 'bg-red-600',
    },
    {
      label: 'Revenue This Month',
      value: s ? `AED ${Number(s.revenue_this_month).toLocaleString()}` : undefined,
      sub: 'Paid invoices',
      icon: TrendingUp,
      color: 'bg-teal-600',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Platform Overview</h2>
        <p className="text-slate-500 text-sm mt-0.5">Real-time metrics across all tenants</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, i) => (
          <StatCard key={card.label} {...card} delay={i * 0.05} />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Recent Organizations</h3>
          <a href="/admin/organizations" className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors">
            View all
          </a>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {isLoading && (
            <div className="px-5 py-8 text-center text-slate-400 dark:text-slate-600 text-sm">Loading…</div>
          )}
          {!isLoading && (!orgsRes || orgsRes.length === 0) && (
            <div className="px-5 py-8 text-center text-slate-400 dark:text-slate-600 text-sm">No organizations yet</div>
          )}
          {orgsRes?.map(org => (
            <div key={org.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-white/2 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/40 border border-violet-200 dark:border-violet-800/40 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-violet-600 dark:text-violet-300">{org.name[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{org.name}</p>
                <p className="text-xs text-slate-400 truncate">{org.primary_email}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <PlanBadge plan={org.plan} />
                <StatusDot status={org.status} />
                <span className="text-xs text-slate-400 hidden sm:block">
                  {org.user_count} users · {org.customer_count} customers
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
