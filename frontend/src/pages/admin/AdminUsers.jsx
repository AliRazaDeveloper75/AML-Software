import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, Users, RefreshCw, UserCheck, UserX, Trash2, AlertTriangle, X } from 'lucide-react'
import api from '../../lib/api'

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'compliance_officer', label: 'Compliance Officer' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'analyst', label: 'Analyst' },
  { value: 'viewer', label: 'Viewer' },
]

function RoleBadge({ role }) {
  const styles = {
    owner: 'bg-violet-50 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800',
    admin: 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    compliance_officer: 'bg-teal-50 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    accountant: 'bg-amber-50 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    analyst: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600',
    viewer: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  }
  const label = role?.replace('_', ' ') ?? '—'
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${styles[role] ?? styles.viewer}`}>
      {label}
    </span>
  )
}

function Avatar({ name }) {
  return (
    <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/40 border border-violet-200 dark:border-violet-800/30 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-violet-600 dark:text-violet-300">{name?.[0] ?? '?'}</span>
    </div>
  )
}

const inputCls = "w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/5 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:border-violet-400 dark:focus:border-violet-500/50 transition-colors"
const selectCls = "px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/5 rounded-xl text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-violet-400 dark:focus:border-violet-500/50 transition-colors"

function DeleteConfirmDialog({ user, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <Trash2 size={16} className="text-red-600 dark:text-red-400" />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Delete User</p>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 transition-colors">
            <X size={15} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl">
            <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">
              This action is <strong>permanent and cannot be undone</strong>. All data associated with this user will be deleted.
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">User to be deleted</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{user.full_name}</p>
            <p className="text-xs text-slate-400">{user.email}</p>
            <p className="text-xs text-slate-400 mt-1">{user.organization?.name ?? 'No organization'}</p>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Trash2 size={14} />}
              Delete Permanently
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminUsers() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showInactive, setShowInactive] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const qc = useQueryClient()

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (roleFilter) params.set('role', roleFilter)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-users', search, roleFilter],
    queryFn: () => api.get(`/platform-admin/users/?${params}`).then(r => r.data.data ?? []),
    staleTime: 20_000,
  })

  const toggleUser = useMutation({
    mutationFn: ({ id, is_active }) => api.patch(`/platform-admin/users/${id}/`, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const deleteUser = useMutation({
    mutationFn: (id) => api.delete(`/platform-admin/users/${id}/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
      setDeleteTarget(null)
    },
  })

  const allUsers = data ?? []
  const users = showInactive ? allUsers : allUsers.filter(u => u.is_active)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Users</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {allUsers.length} total · {allUsers.filter(u => u.is_active).length} active · {allUsers.filter(u => !u.is_active).length} inactive
          </p>
        </div>
        <button onClick={refetch} className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…" className={inputCls} />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className={selectCls}>
          {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={e => setShowInactive(e.target.checked)}
            className="accent-violet-500"
          />
          Show inactive
        </label>
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
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">User</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Role</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Organization</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Email Verified</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Last Login</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="text-center text-slate-400 py-12 text-sm">Loading…</td>
                </tr>
              )}
              {!isLoading && users.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <Users size={24} className="text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                    <p className="text-slate-400 dark:text-slate-600 text-sm">No users found</p>
                  </td>
                </tr>
              )}
              {users.map(user => (
                <tr key={user.id} className={`hover:bg-slate-50 dark:hover:bg-white/2 transition-colors ${!user.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.full_name} />
                      <div>
                        <p className="text-slate-800 dark:text-slate-200 font-medium">{user.full_name}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5"><RoleBadge role={user.role} /></td>
                  <td className="px-4 py-3.5">
                    <p className="text-slate-600 dark:text-slate-300 text-xs">{user.organization?.name ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    {user.email_verified
                      ? <span className="text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1"><UserCheck size={12} />Verified</span>
                      : <span className="text-slate-400 dark:text-slate-600 text-xs flex items-center gap-1"><UserX size={12} />Pending</span>
                    }
                  </td>
                  <td className="px-4 py-3.5 text-slate-400 text-xs">
                    {user.last_login_at
                      ? new Date(user.last_login_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'Never'
                    }
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${user.is_active ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleUser.mutate({ id: user.id, is_active: !user.is_active })}
                        className={`text-xs px-2.5 py-1 rounded-lg transition-all ${
                          user.is_active
                            ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                            : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                        }`}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => setDeleteTarget(user)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                        title="Delete permanently"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {deleteTarget && (
        <DeleteConfirmDialog
          user={deleteTarget}
          loading={deleteUser.isPending}
          onConfirm={() => deleteUser.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
