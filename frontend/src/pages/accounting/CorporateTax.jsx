import { FileText, Download, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Card from '../../components/common/Card'
import { formatCurrency } from '../../utils/helpers'
import clsx from 'clsx'

const taxYear = {
  period: 'FY 2024 (Jun 2024 – May 2025)',
  taxableIncome: 14200000,
  exemptions: 850000,
  netTaxableIncome: 13350000,
  taxRate: 0.09,
  taxPayable: 1201500,
  advancePaid: 600000,
  balance: 601500,
  dueDate: '2025-09-30',
  status: 'pending',
  trn: '100-xxxxxx-1',
}

const qualifyingActivities = [
  { name: 'Compliance Advisory Services', amount: 5840000, qualifying: true },
  { name: 'KYC & AML Solutions', amount: 3200000, qualifying: true },
  { name: 'Software Licensing (UAE)', amount: 1960000, qualifying: true },
  { name: 'Investment Income (Dividends)', amount: 920000, qualifying: false },
  { name: 'Capital Gains (Property)', amount: 2280000, qualifying: false },
]

const filingChecklist = [
  { task: 'Register for Corporate Tax with FTA', done: true },
  { task: 'Obtain Tax Registration Number (TRN)', done: true },
  { task: 'Prepare audited financial statements', done: true },
  { task: 'Calculate taxable income', done: true },
  { task: 'Apply qualifying income exemptions', done: false },
  { task: 'Submit CT return (CT200)', done: false },
  { task: 'Pay corporate tax liability', done: false },
]

export default function CorporateTax() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Corporate Tax"
        subtitle="UAE Corporate Tax — 9% on taxable income above AED 375,000"
        breadcrumb="Accounting"
        actions={
          <>
            <Button variant="outline" size="sm" icon={Download}>Download CT200</Button>
            <Button size="sm" icon={FileText}>File Tax Return</Button>
          </>
        }
      />

      {/* Tax Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Tax Period</p>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{taxYear.period}</h2>
            </div>
            <Badge variant="warning" dot>Pending Filing</Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
            {[
              { label: 'Accounting Income', value: formatCurrency(taxYear.taxableIncome), sub: 'Total revenue' },
              { label: 'Exempt Income', value: `(${formatCurrency(taxYear.exemptions)})`, sub: 'Qualifying income', color: 'text-green-600' },
              { label: 'Taxable Income', value: formatCurrency(taxYear.netTaxableIncome), sub: 'At 9% rate' },
              { label: 'Tax Payable (9%)', value: formatCurrency(taxYear.taxPayable), sub: 'Total liability', color: 'text-red-600' },
              { label: 'Advance Paid', value: formatCurrency(taxYear.advancePaid), sub: 'Paid to date', color: 'text-blue-600' },
              { label: 'Balance Due', value: formatCurrency(taxYear.balance), sub: `Due ${taxYear.dueDate}`, color: 'text-amber-600' },
            ].map(s => (
              <div key={s.label} className="bg-slate-50 dark:bg-navy-750 rounded-xl p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{s.label}</p>
                <p className={clsx('text-base font-bold', s.color || 'text-slate-800 dark:text-slate-200')}>{s.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Income Breakdown */}
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Income Analysis</p>
            <div className="space-y-2">
              {qualifyingActivities.map(item => (
                <div key={item.name} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-navy-700 last:border-0">
                  <div className="flex items-center gap-2">
                    {item.qualifying
                      ? <CheckCircle size={13} className="text-green-500" />
                      : <AlertCircle size={13} className="text-slate-400" />
                    }
                    <span className="text-sm text-slate-700 dark:text-slate-300">{item.name}</span>
                    {!item.qualifying && (
                      <Badge variant="neutral" className="text-xs">Taxable</Badge>
                    )}
                  </div>
                  <span className={clsx('text-sm font-semibold', item.qualifying ? 'text-green-600 dark:text-green-400' : 'text-slate-800 dark:text-slate-200')}>
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Checklist */}
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-navy-800 to-navy-900 text-white border-0 dark:bg-navy-700 dark:from-navy-700">
            <p className="text-xs font-semibold opacity-70 uppercase tracking-wider mb-2">Tax Registration</p>
            <p className="text-lg font-bold mb-1">{taxYear.trn}</p>
            <p className="text-xs opacity-60">Tax Registration Number</p>
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-xs opacity-70">Tax Rate</p>
              <p className="text-2xl font-bold mt-1">9%</p>
              <p className="text-xs opacity-60">On taxable income {'>'} AED 375,000</p>
            </div>
          </Card>

          <Card>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Filing Checklist</p>
            <div className="space-y-2.5">
              {filingChecklist.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className={clsx(
                    'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                    item.done ? 'bg-green-500' : 'bg-slate-200 dark:bg-navy-700'
                  )}>
                    {item.done && <CheckCircle size={11} className="text-white" />}
                    {!item.done && <Clock size={10} className="text-slate-400" />}
                  </div>
                  <p className={clsx('text-xs', item.done ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300 font-medium')}>
                    {item.task}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-navy-700">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Progress</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{filingChecklist.filter(i => i.done).length}/{filingChecklist.length}</span>
              </div>
              <div className="mt-1.5 h-1.5 bg-slate-200 dark:bg-navy-700 rounded-full overflow-hidden">
                <div className="h-full bg-accent-500 rounded-full" style={{ width: `${(filingChecklist.filter(i => i.done).length / filingChecklist.length) * 100}%` }} />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
