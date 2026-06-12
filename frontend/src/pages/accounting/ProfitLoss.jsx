import { Download, TrendingUp, BarChart3 } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import { useTrialBalance } from '../../hooks/useAccounting'
import { formatCurrency } from '../../utils/helpers'
import clsx from 'clsx'

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-navy-750 flex items-center justify-center mb-4">
        <BarChart3 size={24} className="text-slate-300 dark:text-slate-600" />
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No financial data yet</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
        Record journal entries and invoices to generate your P&L statement
      </p>
    </div>
  )
}

export default function ProfitLoss() {
  const { data: res, isLoading } = useTrialBalance()
  const accounts = res?.data ?? res?.results ?? []

  const revenue = accounts.filter(a => a.account_type === 'revenue' || a.type === 'revenue')
  const expenses = accounts.filter(a => a.account_type === 'expense' || a.type === 'expense')

  const totalRevenue = revenue.reduce((s, a) => s + Number(a.credit_balance ?? a.balance ?? 0), 0)
  const totalExpenses = expenses.reduce((s, a) => s + Number(a.debit_balance ?? a.balance ?? 0), 0)
  const grossProfit = totalRevenue - totalExpenses
  const tax = grossProfit > 0 ? grossProfit * 0.09 : 0
  const netProfit = grossProfit - tax

  const hasData = accounts.length > 0

  const summaryItems = [
    { label: 'Total Revenue', value: totalRevenue, color: 'text-green-600' },
    { label: 'Total Expenses', value: totalExpenses, color: 'text-red-600' },
    { label: 'Gross Profit', value: grossProfit, color: 'text-blue-600', sub: totalRevenue > 0 ? `${Math.round(grossProfit / totalRevenue * 100)}% margin` : '' },
    { label: 'Net Profit', value: netProfit, color: 'text-accent-600', sub: 'After 9% corp tax' },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Profit & Loss"
        subtitle="Year-to-date income statement"
        breadcrumb="Accounting"
        actions={
          <>
            <Button variant="outline" size="sm" icon={Download}>Export</Button>
          </>
        }
      />

      {isLoading ? (
        <div className="py-20 text-center text-sm text-slate-400">Loading…</div>
      ) : !hasData ? (
        <Card><EmptyState /></Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {summaryItems.map(s => (
              <div key={s.label} className="bg-white dark:bg-navy-800 border border-slate-100 dark:border-navy-700 rounded-xl p-4 shadow-card">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{s.label}</p>
                <p className={clsx('text-xl font-bold', s.color)}>{formatCurrency(s.value)}</p>
                {s.sub && <p className="text-xs text-slate-400 mt-1">{s.sub}</p>}
              </div>
            ))}
          </div>

          <Card padding={false} className="overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-navy-700">
              <h3 className="section-title">Revenue Accounts</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-navy-700">
              {revenue.map(a => (
                <div key={a.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-navy-750 transition-colors">
                  <p className="text-sm text-slate-700 dark:text-slate-300 pl-3">{a.name}</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {formatCurrency(Number(a.credit_balance ?? a.balance ?? 0))}
                  </p>
                </div>
              ))}
              <div className="flex items-center justify-between px-5 py-3 bg-slate-50 dark:bg-navy-750">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total Revenue</p>
                <p className="text-sm font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </Card>

          <Card padding={false} className="overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-navy-700">
              <h3 className="section-title">Expense Accounts</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-navy-700">
              {expenses.map(a => (
                <div key={a.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-navy-750 transition-colors">
                  <p className="text-sm text-slate-700 dark:text-slate-300 pl-3">{a.name}</p>
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                    ({formatCurrency(Number(a.debit_balance ?? a.balance ?? 0))})
                  </p>
                </div>
              ))}
              <div className="flex items-center justify-between px-5 py-3 bg-slate-50 dark:bg-navy-750">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total Expenses</p>
                <p className="text-sm font-bold text-red-600">({formatCurrency(totalExpenses)})</p>
              </div>
            </div>
          </Card>

          <div className="flex items-center justify-between px-5 py-4 bg-accent-50 dark:bg-accent-950/20 rounded-xl border border-accent-100 dark:border-accent-900">
            <p className="text-sm font-bold text-accent-700 dark:text-accent-400">NET PROFIT (After Corporate Tax 9%)</p>
            <p className="text-lg font-bold text-accent-700 dark:text-accent-400">{formatCurrency(netProfit)}</p>
          </div>
        </>
      )}
    </div>
  )
}
