import { useState } from 'react'
import { UserPlus, Shield, Users, Activity } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Card from '../../components/common/Card'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/common/Table'
import Modal from '../../components/common/Modal'
import { TabLine } from '../../components/common/Tabs'
import { useUsers, useRoles, useInviteUser, useDeactivateUser, useReactivateUser } from '../../hooks/useUsers'
import { timeAgo, formatDate } from '../../utils/helpers'
import clsx from 'clsx'

const tabs = [
  { value: 'staff', label: 'Staff', icon: Users },
  { value: 'roles', label: 'Roles & Permissions', icon: Shield },
]

const DEPARTMENTS = ['AML & Compliance', 'Customer Onboarding', 'Finance & Accounting', 'Technology', 'Executive']

function EmptyState({ icon: Icon = Users, label, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-navy-750 flex items-center justify-center mb-3">
        <Icon size={20} className="text-slate-300 dark:text-slate-600" />
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>
    </div>
  )
}

const initials = name =>
  (name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

export default function UserManagement() {
  const [tab, setTab] = useState('staff')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', role: '', department: DEPARTMENTS[0] })

  const { data: usersRes, isLoading: usersLoading } = useUsers()
  const { data: rolesRes, isLoading: rolesLoading } = useRoles()
  const inviteUser = useInviteUser()
  const deactivate = useDeactivateUser()
  const reactivate = useReactivateUser()

  const users = usersRes?.results ?? usersRes?.data ?? []
  const roles = rolesRes?.results ?? rolesRes?.data ?? []

  const handleInvite = () => {
    if (!form.email || !form.first_name) return
    inviteUser.mutate(form, {
      onSuccess: () => {
        setShowAdd(false)
        setForm({ first_name: '', last_name: '', email: '', role: '', department: DEPARTMENTS[0] })
      },
    })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="User Management"
        subtitle="Manage staff, roles, and access permissions"
        breadcrumb="Administration"
        actions={
          <Button size="sm" icon={UserPlus} onClick={() => setShowAdd(true)}>Add User</Button>
        }
      />

      <Card padding={false} className="overflow-hidden">
        <TabLine tabs={tabs} active={tab} onChange={setTab} className="px-5" />

        {tab === 'staff' && (
          usersLoading ? (
            <div className="py-10 text-center text-sm text-slate-400">Loading…</div>
          ) : users.length === 0 ? (
            <EmptyState icon={Users} label="No staff members yet" sub="Invite team members to get started" />
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>User</Th>
                  <Th>Role</Th>
                  <Th>Department</Th>
                  <Th>Status</Th>
                  <Th>Last Login</Th>
                  <Th>Joined</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </Thead>
              <Tbody>
                {users.map(user => {
                  const isActive = user.is_active ?? user.status === 'active'
                  const fullName = user.full_name ?? (`${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email)
                  return (
                    <Tr key={user.id}>
                      <Td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {initials(fullName)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{fullName}</p>
                            <p className="text-xs text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <Badge variant="info">{user.role?.name ?? user.role ?? '—'}</Badge>
                      </Td>
                      <Td muted>{user.department ?? '—'}</Td>
                      <Td>
                        <Badge variant={isActive ? 'success' : 'neutral'} dot>
                          {isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </Td>
                      <Td muted>{user.last_login ? timeAgo(user.last_login) : '—'}</Td>
                      <Td muted>{user.date_joined ? formatDate(user.date_joined) : '—'}</Td>
                      <Td align="right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => isActive ? deactivate.mutate(user.id) : reactivate.mutate(user.id)}
                        >
                          {isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </Td>
                    </Tr>
                  )
                })}
              </Tbody>
            </Table>
          )
        )}

        {tab === 'roles' && (
          rolesLoading ? (
            <div className="py-10 text-center text-sm text-slate-400">Loading…</div>
          ) : roles.length === 0 ? (
            <EmptyState icon={Shield} label="No roles defined" sub="Roles and permissions will appear here" />
          ) : (
            <div className="p-5 space-y-3">
              {roles.map(role => (
                <div key={role.id} className="flex items-center gap-4 p-4 border border-slate-100 dark:border-navy-700 rounded-xl hover:border-accent-200 dark:hover:border-accent-900 transition-all">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-100 dark:bg-blue-950/40 text-blue-600">
                    <Shield size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{role.name}</p>
                      {role.user_count != null && (
                        <span className="text-xs text-slate-400">{role.user_count} users</span>
                      )}
                    </div>
                    {role.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{role.description}</p>
                    )}
                    {role.permissions?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {role.permissions.slice(0, 4).map(p => (
                          <span key={p} className="px-2 py-0.5 bg-slate-100 dark:bg-navy-700 text-slate-500 dark:text-slate-400 text-xs rounded font-mono">
                            {p}
                          </span>
                        ))}
                        {role.permissions.length > 4 && (
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-navy-700 text-slate-400 text-xs rounded">
                            +{role.permissions.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </Card>

      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Invite New User"
        subtitle="Send an invitation to join Al Merak AML"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleInvite} loading={inviteUser.isPending}>Send Invitation</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">First Name</label>
              <input
                type="text"
                placeholder="First name"
                className="input-field"
                value={form.first_name}
                onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Last Name</label>
              <input
                type="text"
                placeholder="Last name"
                className="input-field"
                value={form.last_name}
                onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
            <input
              type="email"
              placeholder="user@almerak.ae"
              className="input-field"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Role</label>
            <select
              className="input-field"
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
            >
              <option value="">Select role…</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Department</label>
            <select
              className="input-field"
              value={form.department}
              onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
            >
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}
