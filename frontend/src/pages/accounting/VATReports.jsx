import { Download, FileText, Calendar, FileBarChart } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import { useOrg } from '../../hooks/useUsers'
import { useVATReturns } from '../../hooks/useTax'

function EmptyState({ icon: Icon = FileBarChart, label, sub }) {
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

export default function VATReports() {
  const { data: orgRes } = useOrg()
  const { data: reportsRes, isLoading } = useVATReturns()

  const org = orgRes?.data ?? orgRes
  const reports = reportsRes?.results ?? reportsRes?.data ?? []
  const trn = org?.trn || '—'

  return (
    <div className="space-y-5">
      <PageHeader
        title="VAT Reports"
        subtitle="UAE VAT compliance reporting — FTA registered"
        breadcrumb="Accounting"
        actions={
          <>
            <Button variant="outline" size="sm" icon={Download}>Download PDF</Button>
            <Button size="sm" icon={FileText}>File VAT Return</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <h3 className="section-title mb-4">VAT Returns</h3>
          {isLoading ? (
            <div className="py-10 text-center text-sm text-slate-400">Loading…</div>
          ) : reports.length === 0 ? (
            <EmptyState
              icon={FileBarChart}
              label="No VAT returns filed yet"
              sub="File your first VAT return to see history here"
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-navy-700">
              {reports.map(r => (
                <div key={r.id} className="flex items-center gap-4 py-3.5">
                  <div className="w-9 h-9 bg-slate-100 dark:bg-navy-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{r.period ?? r.title}</p>
                    <p className="text-xs text-slate-400">
                      Due: {r.due_date ?? '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {r.vat_payable != null ? `AED ${Number(r.vat_payable).toLocaleString()}` : '—'}
                    </p>
                    <p className="text-xs text-slate-400">VAT payable</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-accent-600 to-accent-800 text-white border-0">
            <p className="text-sm font-semibold opacity-90 mb-3">FTA Registration</p>
            <p className="text-2xl font-bold mb-1">{trn}</p>
            <p className="text-xs opacity-70">Tax Registration Number (TRN)</p>
          </Card>

          <Card>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Quick Actions</p>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm" icon={FileText}>Generate VAT201</Button>
              <Button variant="outline" className="w-full justify-start" size="sm" icon={Download}>Download Tax Invoice</Button>
              <Button variant="outline" className="w-full justify-start" size="sm" icon={Calendar}>View Filing Calendar</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
