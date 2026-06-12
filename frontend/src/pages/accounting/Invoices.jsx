import { useState } from 'react'
import { Plus, Download, Send, Eye, MoreHorizontal, Receipt, TrendingUp, Clock, AlertCircle } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import SearchBar from '../../components/common/SearchBar'
import Modal from '../../components/common/Modal'
import Pagination from '../../components/common/Pagination'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/common/Table'
import { useInvoices } from '../../hooks/useAccounting'
import { formatCurrency, formatDate } from '../../utils/helpers'
import clsx from 'clsx'

const statusVariant = { paid: 'success', pending: 'warning', overdue: 'danger', draft: 'neutral' }
const statusLabel = { paid: 'Paid', pending: 'Pending', overdue: 'Overdue', draft: 'Draft' }

export default function Invoices() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [showNew, setShowNew] = useState(false)

  const params = { page, search: search || undefined, ...(statusFilter !== 'all' ? { status: statusFilter } : {}) }
  const { data, isLoading, isError } = useInvoices(params)
  const invoices = data?.results ?? []
  const totalCount = data?.count ?? 0

  const totalRevenue = data?.stats?.total_paid ?? 0
  const totalPending = data?.stats?.total_pending ?? 0
  const totalOverdue = data?.stats?.total_overdue ?? 0

  return (
    <div className="space-y-5">
      <PageHeader
        title="Invoices"
        subtitle="Manage and track all client invoices"
        breadcrumb="Accounting"
        actions={
          <>
            <Button variant="outline" size="sm" icon={Download}>Export</Button>
            <Button size="sm" icon={Plus} onClick={() => setShowNew(true)}>New Invoice</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Invoices', value: isLoading ? '—' : totalCount, icon: Receipt, color: 'text-blue-600 bg-blue-100 dark:bg-blue-950/40' },
          { label: 'Revenue Collected', value: formatCurrency(totalRevenue), icon: TrendingUp, color: 'text-green-600 bg-green-100 dark:bg-green-950/40' },
          { label: 'Pending', value: formatCurrency(totalPending), icon: Clock, color: 'text-amber-600 bg-amber-100 dark:bg-amber-950/40' },
          { label: 'Overdue', value: formatCurrency(totalOverdue), icon: AlertCircle, color: 'text-red-600 bg-red-100 dark:bg-red-950/40' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-navy-800 border border-slate-100 dark:border-navy-700 rounded-xl p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', s.color)}>
                <s.icon size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{s.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-navy-800 border border-slate-100 dark:border-navy-700 rounded-xl shadow-card overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-5 py-3.5 border-b border-slate-100 dark:border-navy-700">
          <SearchBar value={search} onChange={setSearch} placeholder="Search invoices..." className="flex-1 max-w-sm" />
          <div className="flex items-center gap-1.5 flex-wrap">
            {['all', 'paid', 'pending', 'overdue', 'draft'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={clsx(
                  'px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all',
                  statusFilter === s
                    ? 'bg-accent-600 text-white'
                    : 'bg-slate-100 dark:bg-navy-750 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-navy-700'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {isError && <div className="px-5 py-8 text-center text-sm text-red-500">Failed to load invoices.</div>}
        <Table>
          <Thead>
            <tr>
              <Th>Invoice</Th>
              <Th>Client</Th>
              <Th align="right">Amount</Th>
              <Th align="right">VAT (5%)</Th>
              <Th align="right">Total</Th>
              <Th>Issue Date</Th>
              <Th>Due Date</Th>
              <Th>Status</Th>
              <Th align="right">Actions</Th>
            </tr>
          </Thead>
          <Tbody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Tr key={i}>{Array.from({ length: 9 }).map((__, j) => <Td key={j}><div className="h-4 bg-slate-100 dark:bg-navy-700 rounded animate-pulse w-3/4" /></Td>)}</Tr>
                ))
              : invoices.map(inv => (
                <Tr key={inv.id} highlight={inv.status === 'overdue'}>
                  <Td>
                    <span className="font-mono text-xs text-accent-600 dark:text-accent-400 font-semibold">{inv.invoice_number ?? inv.id}</span>
                  </Td>
                  <Td>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{inv.client_name}</p>
                      <p className="text-xs text-slate-400 truncate max-w-[200px]">{inv.description}</p>
                    </div>
                  </Td>
                  <Td align="right"><span className="font-semibold">{formatCurrency(inv.subtotal)}</span></Td>
                  <Td align="right" muted>{formatCurrency(inv.vat_amount)}</Td>
                  <Td align="right"><span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(inv.total_amount)}</span></Td>
                  <Td muted>{formatDate(inv.issue_date)}</Td>
                  <Td muted>
                    <span className={inv.status === 'overdue' ? 'text-red-600 font-semibold' : ''}>
                      {formatDate(inv.due_date)}
                    </span>
                  </Td>
                  <Td><Badge variant={statusVariant[inv.status] ?? 'neutral'}>{statusLabel[inv.status] ?? inv.status}</Badge></Td>
                  <Td align="right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-700 text-slate-400 hover:text-accent-600 transition-colors">
                        <Eye size={14} />
                      </button>
                      {inv.status === 'pending' && (
                        <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-700 text-slate-400 hover:text-accent-600 transition-colors">
                          <Send size={14} />
                        </button>
                      )}
                      <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-700 text-slate-400 transition-colors">
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))
            }
          </Tbody>
        </Table>
        <Pagination page={page} total={totalCount} perPage={20} onChange={setPage} />
      </div>

      {/* New Invoice Modal */}
      <Modal
        open={showNew}
        onClose={() => setShowNew(false)}
        title="Create New Invoice"
        subtitle="Generate a new client invoice"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button variant="secondary">Save as Draft</Button>
            <Button icon={Send}>Send Invoice</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Client Name</label>
              <input type="text" placeholder="Select or type client..." className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Invoice Date</label>
              <input type="date" defaultValue="2025-05-11" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Due Date</label>
              <input type="date" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Currency</label>
              <select className="input-field">
                <option>AED - UAE Dirham</option>
                <option>USD - US Dollar</option>
                <option>EUR - Euro</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description of Services</label>
            <textarea rows={3} placeholder="Describe the services provided..." className="input-field resize-none" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Amount (AED)</label>
              <input type="number" placeholder="0.00" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">VAT Rate</label>
              <select className="input-field">
                <option>5% - Standard Rate</option>
                <option>0% - Zero Rate</option>
                <option>Exempt</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Total (AED)</label>
              <input type="number" placeholder="0.00" readOnly className="input-field bg-slate-100 dark:bg-navy-700" />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
