import { Download } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import { formatCurrency } from '../../utils/helpers'
import clsx from 'clsx'

const balanceData = {
  assets: {
    current: [
      { name: 'Cash & Cash Equivalents', value: 4850000 },
      { name: 'Accounts Receivable', value: 2340000 },
      { name: 'Prepaid Expenses', value: 380000 },
      { name: 'VAT Receivable', value: 125000 },
    ],
    nonCurrent: [
      { name: 'Property & Equipment (Net)', value: 8200000 },
      { name: 'Intangible Assets', value: 3500000 },
      { name: 'Right-of-Use Assets', value: 1800000 },
      { name: 'Long-term Investments', value: 5000000 },
    ],
  },
  liabilities: {
    current: [
      { name: 'Accounts Payable', value: 890000 },
      { name: 'VAT Payable', value: 56500 },
      { name: 'Accrued Expenses', value: 420000 },
      { name: 'Short-term Loans', value: 1200000 },
    ],
    nonCurrent: [
      { name: 'Long-term Debt', value: 4500000 },
      { name: 'Deferred Tax Liability', value: 320000 },
      { name: 'Lease Liabilities', value: 1650000 },
    ],
  },
  equity: [
    { name: 'Share Capital', value: 5000000 },
    { name: 'Retained Earnings', value: 8558500 },
    { name: 'Current Year Profit', value: 3550000 },
  ],
}

function Section({ title, items, positive = true }) {
  const total = items.reduce((a, i) => a + i.value, 0)
  return (
    <div>
      <div className="px-5 py-2.5 bg-slate-50 dark:bg-navy-750">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
      </div>
      {items.map(item => (
        <div key={item.name} className="flex items-center justify-between px-5 py-3 border-b border-slate-50 dark:border-navy-700/50 hover:bg-slate-50 dark:hover:bg-navy-750 transition-colors">
          <p className="text-sm text-slate-700 dark:text-slate-300 pl-3">{item.name}</p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(item.value)}</p>
        </div>
      ))}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-50 dark:bg-navy-750 border-t border-slate-100 dark:border-navy-700">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Subtotal</p>
        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatCurrency(total)}</p>
      </div>
    </div>
  )
}

export default function BalanceSheet() {
  const totalCurrentAssets = balanceData.assets.current.reduce((a, i) => a + i.value, 0)
  const totalNonCurrentAssets = balanceData.assets.nonCurrent.reduce((a, i) => a + i.value, 0)
  const totalAssets = totalCurrentAssets + totalNonCurrentAssets

  const totalCurrentLiab = balanceData.liabilities.current.reduce((a, i) => a + i.value, 0)
  const totalNonCurrentLiab = balanceData.liabilities.nonCurrent.reduce((a, i) => a + i.value, 0)
  const totalLiabilities = totalCurrentLiab + totalNonCurrentLiab

  const totalEquity = balanceData.equity.reduce((a, i) => a + i.value, 0)
  const totalLiabEquity = totalLiabilities + totalEquity

  const balanced = Math.abs(totalAssets - totalLiabEquity) < 1

  return (
    <div className="space-y-5">
      <PageHeader
        title="Balance Sheet"
        subtitle="Financial position as at 31 May 2025"
        breadcrumb="Accounting"
        actions={<Button variant="outline" size="sm" icon={Download}>Export PDF</Button>}
      />

      {/* Check Balance */}
      <div className={clsx(
        'flex items-center gap-3 px-4 py-3 rounded-xl border',
        balanced
          ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/30'
          : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30'
      )}>
        <div className={clsx('w-2 h-2 rounded-full', balanced ? 'bg-green-500' : 'bg-red-500')} />
        <p className={clsx('text-sm font-semibold', balanced ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400')}>
          {balanced ? 'Balance sheet is balanced — Assets = Liabilities + Equity' : 'Balance sheet is not balanced'}
        </p>
        <div className="ml-auto flex items-center gap-6 text-sm">
          <span className="text-slate-500 dark:text-slate-400">Total Assets: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(totalAssets)}</strong></span>
          <span className="text-slate-500 dark:text-slate-400">Total L+E: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(totalLiabEquity)}</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ASSETS */}
        <Card padding={false} className="overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-navy-700 flex items-center justify-between">
            <h3 className="section-title">Assets</h3>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatCurrency(totalAssets)}</p>
          </div>
          <Section title="Current Assets" items={balanceData.assets.current} />
          <Section title="Non-Current Assets" items={balanceData.assets.nonCurrent} />
          <div className="flex items-center justify-between px-5 py-4 bg-accent-50 dark:bg-accent-950/20">
            <p className="text-sm font-bold text-accent-700 dark:text-accent-400">TOTAL ASSETS</p>
            <p className="text-base font-bold text-accent-700 dark:text-accent-400">{formatCurrency(totalAssets)}</p>
          </div>
        </Card>

        {/* LIABILITIES + EQUITY */}
        <Card padding={false} className="overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-navy-700 flex items-center justify-between">
            <h3 className="section-title">Liabilities & Equity</h3>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatCurrency(totalLiabEquity)}</p>
          </div>
          <Section title="Current Liabilities" items={balanceData.liabilities.current} positive={false} />
          <Section title="Non-Current Liabilities" items={balanceData.liabilities.nonCurrent} positive={false} />
          <Section title="Shareholders' Equity" items={balanceData.equity} />
          <div className="flex items-center justify-between px-5 py-4 bg-accent-50 dark:bg-accent-950/20">
            <p className="text-sm font-bold text-accent-700 dark:text-accent-400">TOTAL LIABILITIES & EQUITY</p>
            <p className="text-base font-bold text-accent-700 dark:text-accent-400">{formatCurrency(totalLiabEquity)}</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
