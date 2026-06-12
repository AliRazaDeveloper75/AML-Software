import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, Building2, CheckCircle, XCircle, PauseCircle, RefreshCw } from 'lucide-react'
import api from '../../lib/api'

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'trial', label: 'Trial' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'cancelled', label: 'Cancelled' },
]

const PLAN_OPTIONS = [
  { value: '', label: 'All Plans' },
  { value: 'starter', label: 'Starter' },
  { value: 'professional', label: 'Professional' },
  { value: 'enterprise', label: 'Enterprise' },
]

function PlanBadge({ plan }) {
  const styles = {
    starter: 'bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600',
    professional: 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    enterprise: 'bg-violet-50 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800',
  }
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${styles[plan] ?? styles.starter}`}>
      {plan}
    </span>
  )
}

function StatusBadge({ status }) {
  const cfg = {
    active: { cls: 'bg-emerald-50 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', icon: CheckCircle },
    trial: { cls: 'bg-amber-50 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800', icon: RefreshCw },
    suspended: { cls: 'bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800', icon: PauseCircle },
    cancelled: { cls: 'bg-slate-100 dark:bg-slate-700/80 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600', icon: XCircle },
  }
  const { cls, icon: Icon } = cfg[status] ?? cfg.cancelled
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${cls}`}>
      <Icon size={10} />
      {status}
    </span>
  )
}

function StatusMenu({ org, onUpdate }) {
  const [open, setOpen] = useState(false)
  const options = ['active', 'trial', 'suspended', 'cancelled'].filter(s => s !== org.status)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="text-xs text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
      >
        Change
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-20">
          {options.map(s => (
            <button
              key={s}
              onClick={() => { onUpdate(org.id, s); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 capitalize first:rounded-t-xl last:rounded-b-xl"
            >
              Set {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const inputCls = "w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/5 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:border-violet-400 dark:focus:border-violet-500/50 transition-colors"
const selectCls = "px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/5 rounded-xl text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-violet-400 dark:focus:border-violet-500/50 transition-colors"

export default function AdminOrganizations() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const qc = useQueryClient()

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (statusFilter) params.set('status', statusFilter)
  if (planFilter) params.set('plan', planFilter)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-orgs', search, statusFilter, planFilter],
    queryFn: () => api.get(`/platform-admin/organizations/?${params}`).then(r => r.data.data ?? []),
    staleTime: 20_000,
  })

  const updateOrg = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/platform-admin/organizations/${id}/`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-orgs'] }),
  })

  const orgs = data ?? []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Organizations</h2>
          <p className="text-slate-500 text-sm mt-0.5">{orgs.length} tenants registered on the platform</p>
        </div>
        <button onClick={refetch} className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-52">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search organizations…" className={inputCls} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectCls}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={planFilter} onChange={e => setPlanFilter(e.target.value)} className={selectCls}>
          {PLAN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900/40">
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Organization</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Plan</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Emirate</th>
                <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">Users</th>
                <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">Customers</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {isLoading && (
                <tr>
                  <td colSpan={8} className="text-center text-slate-400 py-12 text-sm">Loading…</td>
                </tr>
              )}
              {!isLoading && orgs.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <Building2 size={24} className="text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                    <p className="text-slate-400 dark:text-slate-600 text-sm">No organizations found</p>
                  </td>
                </tr>
              )}
              {orgs.map(org => (
                <tr key={org.id} className="hover:bg-slate-50 dark:hover:bg-white/2 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-violet-600 dark:text-violet-300">{org.name[0]}</span>
                      </div>
                      <div>
                        <p className="text-slate-800 dark:text-slate-200 font-medium">{org.name}</p>
                        <p className="text-xs text-slate-400">{org.primary_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5"><PlanBadge plan={org.plan} /></td>
                  <td className="px-4 py-3.5"><StatusBadge status={org.status} /></td>
                  <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 text-xs">{org.emirate || '—'}</td>
                  <td className="px-4 py-3.5 text-right text-slate-700 dark:text-slate-300 font-medium">{org.user_count}</td>
                  <td className="px-4 py-3.5 text-right text-slate-700 dark:text-slate-300 font-medium">{org.customer_count}</td>
                  <td className="px-4 py-3.5 text-slate-400 text-xs">
                    {org.created_at ? new Date(org.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <StatusMenu org={org} onUpdate={(id, status) => updateOrg.mutate({ id, status })} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
