import { useState } from 'react'
import { Download, ArrowUpCircle, ArrowDownCircle, Flag, Layers } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import SearchBar from '../../components/common/SearchBar'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/common/Table'
import { useTransactions } from '../../hooks/useAccounting'
import { formatCurrency, formatDateTime } from '../../utils/helpers'
import clsx from 'clsx'

const statusV = { completed: 'success', flagged: 'danger', pending: 'warning' }

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-navy-750 flex items-center justify-center mb-3">
        <Layers size={20} className="text-slate-300 dark:text-slate-600" />
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No transactions yet</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Transactions will appear here once recorded</p>
    </div>
  )
}

export default function Transactions() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const { data: res, isLoading } = useTransactions({ search, type: typeFilter !== 'all' ? typeFilter : undefined })
  const transactions = res?.results ?? res?.data ?? []

  const totalIn = transactions.filter(t => t.type === 'credit').reduce((a, t) => a + Number(t.amount || 0), 0)
  const totalOut = transactions.filter(t => t.type === 'debit').reduce((a, t) => a + Number(t.amount || 0), 0)
  const flaggedCount = transactions.filter(t => t.flagged || t.is_flagged).length

  return (
    <div className="space-y-5">
      <PageHeader
        title="Transactions"
        subtitle="All financial transactions and their AML status"
        breadcrumb="Accounting"
        actions={<Button variant="outline" size="sm" icon={Download}>Export Statement</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Inflow', value: formatCurrency(totalIn), icon: ArrowDownCircle, color: 'text-green-600 bg-green-100 dark:bg-green-950/40', sub: 'Credits this period' },
          { label: 'Total Outflow', value: formatCurrency(totalOut), icon: ArrowUpCircle, color: 'text-red-600 bg-red-100 dark:bg-red-950/40', sub: 'Debits this period' },
          { label: 'Flagged', value: flaggedCount, icon: Flag, color: 'text-amber-600 bg-amber-100 dark:bg-amber-950/40', sub: 'Require AML review' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-navy-800 border border-slate-100 dark:border-navy-700 rounded-xl p-4 shadow-card flex items-center gap-3">
            <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', s.color)}>
              <s.icon size={18} />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{s.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
              <p className="text-xs text-slate-400">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-navy-800 border border-slate-100 dark:border-navy-700 rounded-xl shadow-card overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-5 py-3.5 border-b border-slate-100 dark:border-navy-700">
          <SearchBar value={search} onChange={setSearch} placeholder="Search transactions..." className="flex-1 max-w-sm" />
          <div className="flex gap-1.5">
            {['all', 'credit', 'debit', 'flagged'].map(f => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className={clsx(
                  'px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all',
                  typeFilter === f ? 'bg-accent-600 text-white' : 'bg-slate-100 dark:bg-navy-750 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-sm text-slate-400">Loading…</div>
        ) : transactions.length === 0 ? (
          <EmptyState />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Date & Time</Th>
                <Th>Description</Th>
                <Th>Category</Th>
                <Th>Reference</Th>
                <Th align="right">Amount</Th>
                <Th>AML Status</Th>
                <Th>Status</Th>
              </tr>
            </Thead>
            <Tbody>
              {transactions.map(txn => (
                <Tr key={txn.id} highlight={txn.flagged || txn.is_flagged}>
                  <Td muted>{formatDateTime(txn.date || txn.created_at)}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      {txn.type === 'credit'
                        ? <ArrowDownCircle size={14} className="text-green-500 flex-shrink-0" />
                        : <ArrowUpCircle size={14} className="text-red-500 flex-shrink-0" />}
                      <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{txn.description}</p>
                    </div>
                  </Td>
                  <Td muted>{txn.category || '—'}</Td>
                  <Td><span className="font-mono text-xs text-slate-500 dark:text-slate-400">{txn.reference || txn.id}</span></Td>
                  <Td align="right">
                    <span className={clsx('font-bold text-sm', txn.type === 'credit' ? 'text-green-600 dark:text-green-400' : 'text-slate-800 dark:text-slate-200')}>
                      {txn.type === 'credit' ? '+' : ''}{formatCurrency(Math.abs(Number(txn.amount)))}
                    </span>
                  </Td>
                  <Td>
                    {(txn.flagged || txn.is_flagged)
                      ? <span className="text-xs font-semibold text-red-600 dark:text-red-400">Flagged</span>
                      : <span className="text-xs text-green-600 dark:text-green-400 font-medium">Clear</span>}
                  </Td>
                  <Td>
                    <Badge variant={statusV[txn.status] ?? 'neutral'}>
                      {txn.status ? txn.status.charAt(0).toUpperCase() + txn.status.slice(1) : '—'}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </div>
    </div>
  )
}
