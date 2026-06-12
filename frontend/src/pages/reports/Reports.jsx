import { useState } from 'react'
import { Download, FileText, Plus, Eye, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Card from '../../components/common/Card'
import Modal from '../../components/common/Modal'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/common/Table'
import { TabLine } from '../../components/common/Tabs'
import { useReports, useGenerateReport } from '../../hooks/useReports'
import { formatDate } from '../../utils/helpers'
import clsx from 'clsx'

const statusVariant = { submitted: 'info', draft: 'neutral', under_review: 'warning', approved: 'success' }
const statusLabel = { submitted: 'Submitted to CBUAE', draft: 'Draft', under_review: 'Under Review', approved: 'Approved' }

const tabs = [
  { value: 'reports', label: 'STR/SAR Reports' },
  { value: 'compliance', label: 'Compliance Reports' },
]

const REPORT_TYPES = [
  { value: 'STR', label: 'STR', desc: 'Suspicious Transaction Report' },
  { value: 'SAR', label: 'SAR', desc: 'Suspicious Activity Report' },
  { value: 'Compliance', label: 'Compliance', desc: 'Periodic compliance report' },
  { value: 'Audit', label: 'Audit', desc: 'Internal audit report' },
]

function EmptyState({ icon: Icon = FileText, label, sub }) {
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

export default function Reports() {
  const [tab, setTab] = useState('reports')
  const [showNew, setShowNew] = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')
  const [newForm, setNewForm] = useState({ report_type: 'STR', customer: '', date_from: '', date_to: '', notes: '' })

  const { data: reportsRes, isLoading } = useReports({ type: typeFilter !== 'all' ? typeFilter : undefined })
  const generateReport = useGenerateReport()

  const reports = reportsRes?.results ?? reportsRes?.data ?? []

  const total = reports.length
  const strs = reports.filter(r => r.type === 'STR' && r.status === 'submitted').length
  const pending = reports.filter(r => r.status === 'under_review' || r.status === 'draft').length
  const cbuae = reports.filter(r => r.status === 'submitted').length

  const complianceReports = reports.filter(r => r.type === 'Compliance' || r.type === 'Audit')

  const handleGenerate = () => {
    generateReport.mutate(newForm, {
      onSuccess: () => {
        setShowNew(false)
        setNewForm({ report_type: 'STR', customer: '', date_from: '', date_to: '', notes: '' })
      },
    })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        subtitle="STR/SAR reporting, audit logs, and compliance documentation"
        breadcrumb="Reports"
        actions={
          <>
            <Button variant="outline" size="sm" icon={Download}>Export All</Button>
            <Button size="sm" icon={Plus} onClick={() => setShowNew(true)}>Generate Report</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Reports', value: total, icon: FileText, color: 'text-blue-600 bg-blue-100 dark:bg-blue-950/40' },
          { label: 'STRs Submitted', value: strs, icon: CheckCircle, color: 'text-green-600 bg-green-100 dark:bg-green-950/40' },
          { label: 'Pending Review', value: pending, icon: Clock, color: 'text-amber-600 bg-amber-100 dark:bg-amber-950/40' },
          { label: 'CBUAE Filings', value: cbuae, icon: AlertTriangle, color: 'text-purple-600 bg-purple-100 dark:bg-purple-950/40' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-navy-800 border border-slate-100 dark:border-navy-700 rounded-xl p-4 shadow-card flex items-center gap-3">
            <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', s.color)}>
              <s.icon size={16} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{s.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <Card padding={false} className="overflow-hidden">
        <TabLine tabs={tabs} active={tab} onChange={setTab} className="px-5" />

        {tab === 'reports' && (
          <>
            <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 dark:border-navy-700">
              {['all', 'STR', 'SAR', 'Compliance', 'Audit'].map(f => (
                <button
                  key={f}
                  onClick={() => setTypeFilter(f)}
                  className={clsx(
                    'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                    typeFilter === f ? 'bg-accent-600 text-white' : 'bg-slate-100 dark:bg-navy-750 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
            {isLoading ? (
              <div className="py-10 text-center text-sm text-slate-400">Loading…</div>
            ) : reports.length === 0 ? (
              <EmptyState icon={FileText} label="No reports yet" sub="Generate your first STR or compliance report" />
            ) : (
              <Table>
                <Thead>
                  <tr>
                    <Th>Report ID</Th>
                    <Th>Title</Th>
                    <Th>Type</Th>
                    <Th>Created By</Th>
                    <Th>Date</Th>
                    <Th>CBUAE Ref</Th>
                    <Th>Status</Th>
                    <Th align="right">Actions</Th>
                  </tr>
                </Thead>
                <Tbody>
                  {reports.map(report => (
                    <Tr key={report.id}>
                      <Td><span className="font-mono text-xs text-accent-600 dark:text-accent-400 font-semibold">{report.reference_number ?? report.id}</span></Td>
                      <Td>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{report.title ?? report.report_type}</p>
                      </Td>
                      <Td>
                        <Badge variant={['STR', 'SAR'].includes(report.type ?? report.report_type) ? 'danger' : 'info'}>
                          {report.type ?? report.report_type ?? '—'}
                        </Badge>
                      </Td>
                      <Td muted>{report.created_by_name ?? report.created_by ?? '—'}</Td>
                      <Td muted>{formatDate(report.date ?? report.created_at)}</Td>
                      <Td>
                        {report.cbuae_reference
                          ? <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{report.cbuae_reference}</span>
                          : <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                        }
                      </Td>
                      <Td>
                        <Badge variant={statusVariant[report.status] ?? 'neutral'} dot>
                          {statusLabel[report.status] ?? (report.status ?? '—')}
                        </Badge>
                      </Td>
                      <Td align="right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-700 text-slate-400 hover:text-accent-600 transition-colors">
                            <Eye size={14} />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-700 text-slate-400 transition-colors">
                            <Download size={14} />
                          </button>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </>
        )}

        {tab === 'compliance' && (
          isLoading ? (
            <div className="py-10 text-center text-sm text-slate-400">Loading…</div>
          ) : complianceReports.length === 0 ? (
            <EmptyState icon={FileText} label="No compliance reports yet" sub="Compliance reports will appear here once generated" />
          ) : (
            <div className="p-5 space-y-3">
              {complianceReports.map(rep => (
                <div key={rep.id} className="flex items-center gap-4 p-4 border border-slate-100 dark:border-navy-700 rounded-xl hover:border-accent-200 dark:hover:border-accent-900 transition-colors">
                  <div className="w-10 h-10 bg-accent-100 dark:bg-accent-950/40 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText size={18} className="text-accent-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{rep.title ?? rep.report_type}</p>
                    <p className="text-xs text-slate-400">{formatDate(rep.date ?? rep.created_at)}</p>
                  </div>
                  {rep.compliance_score != null && (
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">{rep.compliance_score}%</p>
                      <p className="text-xs text-slate-400">Score</p>
                    </div>
                  )}
                  <Button variant="ghost" size="sm" icon={Download}>Download</Button>
                </div>
              ))}
            </div>
          )
        )}
      </Card>

      <Modal
        open={showNew}
        onClose={() => setShowNew(false)}
        title="Generate New Report"
        subtitle="Create STR, SAR, or compliance report"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleGenerate} loading={generateReport.isPending}>Generate Report</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Report Type</label>
            <div className="grid grid-cols-2 gap-3">
              {REPORT_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setNewForm(f => ({ ...f, report_type: t.value }))}
                  className={clsx(
                    'text-left p-3 rounded-xl border-2 transition-all',
                    newForm.report_type === t.value
                      ? 'border-accent-500 bg-accent-50 dark:bg-accent-950/20'
                      : 'border-slate-200 dark:border-navy-600 hover:border-accent-400'
                  )}
                >
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Related Customer/Alert</label>
            <input
              type="text"
              placeholder="Search customer or alert ID..."
              className="input-field"
              value={newForm.customer}
              onChange={e => setNewForm(f => ({ ...f, customer: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">From Date</label>
              <input type="date" className="input-field" value={newForm.date_from} onChange={e => setNewForm(f => ({ ...f, date_from: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">To Date</label>
              <input type="date" className="input-field" value={newForm.date_to} onChange={e => setNewForm(f => ({ ...f, date_to: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Notes</label>
            <textarea
              rows={3}
              placeholder="Additional details..."
              className="input-field resize-none"
              value={newForm.notes}
              onChange={e => setNewForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
