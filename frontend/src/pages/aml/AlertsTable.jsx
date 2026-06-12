import { useState, useCallback } from 'react'
import { AlertTriangle, Eye, X, CheckCircle, MoreHorizontal, ArrowUpRight } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Drawer from '../../components/common/Drawer'
import SearchBar from '../../components/common/SearchBar'
import Pagination from '../../components/common/Pagination'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/common/Table'
import { useAlerts, useAlertSummary, useResolveAlert } from '../../hooks/useAML'
import { formatCurrency, formatDateTime, timeAgo } from '../../utils/helpers'
import clsx from 'clsx'

const statusVariant = { open: 'danger', under_review: 'info', escalated: 'purple', closed: 'neutral' }
const statusLabel = { open: 'Open', under_review: 'Under Review', escalated: 'Escalated', closed: 'Closed' }
const severityVariant = { critical: 'critical', high: 'high', medium: 'medium', low: 'low' }

export default function AlertsTable() {
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [resolveNotes, setResolveNotes] = useState('')

  const params = {
    page,
    search: search || undefined,
    ...(severityFilter !== 'all' ? { severity: severityFilter } : {}),
  }

  const { data, isLoading, isError } = useAlerts(params)
  const { data: summary } = useAlertSummary()
  const alerts = data?.results ?? []
  const totalCount = data?.count ?? 0

  const { mutate: resolve, isPending: resolving } = useResolveAlert(selectedAlert?.id)

  const handleSearch = useCallback((v) => { setSearch(v); setPage(1) }, [])
  const handleSeverity = useCallback((v) => { setSeverityFilter(v); setPage(1) }, [])

  const handleResolve = () => {
    resolve(
      { resolution_notes: resolveNotes, outcome: 'false_positive' },
      { onSuccess: () => { setSelectedAlert(null); setResolveNotes('') } }
    )
  }

  const summaryCards = [
    { label: 'Total Alerts', value: summary?.total_alerts ?? totalCount, color: 'text-slate-600 bg-slate-100 dark:bg-slate-800' },
    { label: 'Critical', value: summary?.by_severity?.critical ?? '—', color: 'text-purple-600 bg-purple-100 dark:bg-purple-950/40' },
    { label: 'High', value: summary?.by_severity?.high ?? '—', color: 'text-red-600 bg-red-100 dark:bg-red-950/40' },
    { label: 'Open', value: summary?.open_alerts ?? '—', color: 'text-amber-600 bg-amber-100 dark:bg-amber-950/40' },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="AML Alerts"
        subtitle="Monitor and resolve compliance alerts"
        breadcrumb="AML Compliance"
        actions={
          <Button variant="outline" size="sm" icon={ArrowUpRight}>Export Alerts</Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {summaryCards.map(s => (
          <div key={s.label} className="bg-white dark:bg-navy-800 border border-slate-100 dark:border-navy-700 rounded-xl p-4 shadow-card flex items-center gap-3">
            <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', s.color)}>
              <AlertTriangle size={16} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{s.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-navy-800 border border-slate-100 dark:border-navy-700 rounded-xl shadow-card overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-5 py-3.5 border-b border-slate-100 dark:border-navy-700">
          <SearchBar value={search} onChange={handleSearch} placeholder="Search alerts..." className="flex-1 max-w-sm" />
          <div className="flex items-center gap-1.5">
            {['all', 'critical', 'high', 'medium', 'low'].map(s => (
              <button
                key={s}
                onClick={() => handleSeverity(s)}
                className={clsx(
                  'px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all',
                  severityFilter === s
                    ? 'bg-accent-600 text-white'
                    : 'bg-slate-100 dark:bg-navy-750 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-navy-700'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {isError && (
          <div className="px-5 py-8 text-center text-sm text-red-500">Failed to load alerts.</div>
        )}

        <Table>
          <Thead>
            <tr>
              <Th>Alert ID</Th>
              <Th>Customer</Th>
              <Th>Type</Th>
              <Th>Amount</Th>
              <Th>Severity</Th>
              <Th>Status</Th>
              <Th>Assigned To</Th>
              <Th>Detected</Th>
              <Th align="right">Actions</Th>
            </tr>
          </Thead>
          <Tbody>
            {isLoading
              ? Array.from({ length: 7 }).map((_, i) => (
                  <Tr key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <Td key={j}><div className="h-4 bg-slate-100 dark:bg-navy-700 rounded animate-pulse w-3/4" /></Td>
                    ))}
                  </Tr>
                ))
              : alerts.map(alert => (
                  <Tr
                    key={alert.id}
                    highlight={alert.severity === 'critical'}
                    onClick={() => setSelectedAlert(alert)}
                  >
                    <Td>
                      <span className="font-mono text-xs text-accent-600 dark:text-accent-400 font-semibold">{alert.alert_number ?? alert.id}</span>
                    </Td>
                    <Td>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{alert.customer_name}</p>
                      <p className="text-xs text-slate-400">{alert.customer_number}</p>
                    </Td>
                    <Td muted>{alert.alert_type}</Td>
                    <Td>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {alert.amount ? formatCurrency(alert.amount, alert.currency ?? 'AED') : '—'}
                      </span>
                    </Td>
                    <Td>
                      <Badge variant={severityVariant[alert.severity]} dot>
                        {alert.severity ? alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1) : '—'}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge variant={statusVariant[alert.status] ?? 'neutral'}>
                        {statusLabel[alert.status] ?? alert.status}
                      </Badge>
                    </Td>
                    <Td muted>{alert.assigned_to_name ?? '—'}</Td>
                    <Td muted>{timeAgo(alert.created_at)}</Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedAlert(alert)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-700 text-slate-400 hover:text-accent-600 transition-colors"
                        >
                          <Eye size={14} />
                        </button>
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

      <Drawer
        open={!!selectedAlert}
        onClose={() => { setSelectedAlert(null); setResolveNotes('') }}
        title="Alert Details"
        subtitle={selectedAlert?.alert_number ?? selectedAlert?.id}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelectedAlert(null)}>Close</Button>
            <Button variant="danger" icon={X} size="sm" loading={resolving} onClick={handleResolve}>
              Mark False Positive
            </Button>
            <Button
              icon={CheckCircle}
              size="sm"
              loading={resolving}
              onClick={() => resolve(
                { resolution_notes: resolveNotes, outcome: 'confirmed' },
                { onSuccess: () => { setSelectedAlert(null); setResolveNotes('') } }
              )}
            >
              Confirm &amp; Escalate
            </Button>
          </>
        }
      >
        {selectedAlert && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-navy-750 rounded-xl">
              <div className={clsx(
                'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                selectedAlert.severity === 'critical' ? 'bg-purple-100 dark:bg-purple-950/40' :
                selectedAlert.severity === 'high' ? 'bg-red-100 dark:bg-red-950/40' : 'bg-amber-100 dark:bg-amber-950/40'
              )}>
                <AlertTriangle size={18} className={
                  selectedAlert.severity === 'critical' ? 'text-purple-600' :
                  selectedAlert.severity === 'high' ? 'text-red-600' : 'text-amber-600'
                } />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedAlert.alert_type}</p>
                  <Badge variant={severityVariant[selectedAlert.severity]}>{selectedAlert.severity}</Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{selectedAlert.customer_name}</p>
              </div>
            </div>

            {selectedAlert.description && (
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Description</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{selectedAlert.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Alert ID', value: selectedAlert.alert_number ?? selectedAlert.id, mono: true },
                { label: 'Customer', value: selectedAlert.customer_name },
                { label: 'Amount', value: selectedAlert.amount ? formatCurrency(selectedAlert.amount, selectedAlert.currency ?? 'AED') : '—' },
                { label: 'Status', value: statusLabel[selectedAlert.status] ?? selectedAlert.status },
                { label: 'Detected', value: selectedAlert.created_at ? formatDateTime(selectedAlert.created_at) : '—' },
                { label: 'Assigned To', value: selectedAlert.assigned_to_name ?? 'Unassigned' },
              ].map(item => (
                <div key={item.label} className="bg-slate-50 dark:bg-navy-750 rounded-lg p-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{item.label}</p>
                  <p className={clsx('text-sm font-semibold text-slate-800 dark:text-slate-200', item.mono && 'font-mono')}>{item.value}</p>
                </div>
              ))}
            </div>

            {selectedAlert.matched_rules?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Matched Rules</p>
                <div className="flex flex-wrap gap-2">
                  {selectedAlert.matched_rules.map(rule => (
                    <span key={rule} className="px-2.5 py-1 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-xs font-mono font-semibold rounded-lg">
                      {rule}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Compliance Notes</p>
              <textarea
                rows={4}
                value={resolveNotes}
                onChange={e => setResolveNotes(e.target.value)}
                placeholder="Add compliance review notes..."
                className="input-field resize-none"
              />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
