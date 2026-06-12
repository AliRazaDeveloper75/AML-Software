import { useState } from 'react'
import { CheckCircle, CreditCard, Download, Star, Zap, Receipt } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'
import Card from '../components/common/Card'
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/common/Table'
import { useSubscription, useBillingInvoices, useBillingPortal } from '../hooks/useBilling'
import { useOrgStats } from '../hooks/useUsers'
import { formatCurrency, formatDate } from '../utils/helpers'
import clsx from 'clsx'

function EmptyState({ icon: Icon = Receipt, label, sub }) {
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

export default function Billing() {
  const [billing, setBilling] = useState('monthly')

  const { data: subRes, isLoading: subLoading } = useSubscription()
  const { data: invoicesRes, isLoading: invoicesLoading } = useBillingInvoices()
  const { data: statsRes } = useOrgStats()
  const billingPortal = useBillingPortal()

  const sub = subRes?.data ?? subRes
  const invoices = invoicesRes?.results ?? invoicesRes?.data ?? []
  const stats = statsRes?.data ?? statsRes

  const planName = sub?.plan_name ?? sub?.plan ?? stats?.plan ?? '—'
  const planPrice = sub?.price ?? sub?.amount
  const renewsAt = sub?.current_period_end ?? sub?.renews_at

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription & Billing"
        subtitle="Manage your Al Merak AML subscription and payment methods"
        breadcrumb="Administration"
      />

      {/* Current Plan Banner */}
      <div className="bg-gradient-to-r from-accent-600 to-accent-800 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-white/20 text-white border-0">Current Plan</Badge>
            </div>
            <h2 className="text-2xl font-bold capitalize">{planName}</h2>
            {planPrice != null && (
              <p className="text-accent-200 text-sm mt-1">
                AED {Number(planPrice).toLocaleString()} / month
                {renewsAt ? ` · Renews on ${formatDate(renewsAt)}` : ''}
              </p>
            )}
            {sub?.features?.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3">
                {sub.features.map(f => (
                  <span key={f} className="flex items-center gap-1 text-xs text-accent-100">
                    <CheckCircle size={11} /> {f}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button
              className="bg-white text-accent-700 hover:bg-accent-50"
              icon={Zap}
              onClick={() => billingPortal.mutate(undefined, { onSuccess: d => d?.url && window.open(d.url, '_blank') })}
            >
              Manage Plan
            </Button>
          </div>
        </div>
      </div>

      {/* Usage */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Card>
          <h3 className="section-title mb-4">Usage This Month</h3>
          {stats ? (
            <div className="space-y-3">
              {[
                { label: 'Customers', used: stats.kyc?.used ?? 0, limit: stats.kyc?.limit ?? 0 },
                { label: 'API Calls', used: stats.api_calls?.used ?? 0, limit: stats.api_calls?.limit ?? 0 },
              ].map(u => (
                <div key={u.label}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{u.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {u.used.toLocaleString()} / {u.limit > 0 ? u.limit.toLocaleString() : '—'}
                    </p>
                  </div>
                  {u.limit > 0 && (
                    <div className="h-1.5 bg-slate-100 dark:bg-navy-700 rounded-full overflow-hidden">
                      <div
                        className={clsx(
                          'h-full rounded-full transition-all',
                          u.used / u.limit > 0.9 ? 'bg-red-500' : u.used / u.limit > 0.7 ? 'bg-amber-500' : 'bg-accent-500'
                        )}
                        style={{ width: `${Math.min((u.used / u.limit) * 100, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Star} label="No usage data" sub="Usage will appear once your subscription is active" />
          )}
        </Card>

        <Card>
          <h3 className="section-title mb-4">Payment Method</h3>
          {sub?.payment_method ? (
            <div className="flex items-center gap-3 p-3 border border-slate-100 dark:border-navy-700 rounded-xl">
              <div className="w-10 h-7 bg-gradient-to-br from-blue-800 to-blue-600 rounded-md flex items-center justify-center flex-shrink-0">
                <CreditCard size={14} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {sub.payment_method.brand} ending in {sub.payment_method.last4}
                </p>
                {sub.payment_method.exp_month && (
                  <p className="text-xs text-slate-400">
                    Expires {sub.payment_method.exp_month}/{sub.payment_method.exp_year}
                  </p>
                )}
              </div>
              <Badge variant="success" dot>Primary</Badge>
            </div>
          ) : (
            <EmptyState icon={CreditCard} label="No payment method" sub="Add a payment method to manage your subscription" />
          )}
          <Button
            variant="outline"
            className="w-full mt-3"
            size="sm"
            icon={CreditCard}
            onClick={() => billingPortal.mutate(undefined, { onSuccess: d => d?.url && window.open(d.url, '_blank') })}
          >
            Manage Payment
          </Button>
        </Card>
      </div>

      {/* Billing History */}
      <Card padding={false} className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-navy-700">
          <h3 className="section-title">Billing History</h3>
          <Button variant="ghost" size="sm" icon={Download}>Download All</Button>
        </div>
        {invoicesLoading ? (
          <div className="py-10 text-center text-sm text-slate-400">Loading…</div>
        ) : invoices.length === 0 ? (
          <EmptyState icon={Receipt} label="No invoices yet" sub="Invoices will appear here once billing starts" />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Invoice</Th>
                <Th>Description</Th>
                <Th>Date</Th>
                <Th align="right">Amount</Th>
                <Th>Status</Th>
                <Th align="right">Actions</Th>
              </tr>
            </Thead>
            <Tbody>
              {invoices.map(inv => (
                <Tr key={inv.id}>
                  <Td><span className="font-mono text-xs text-accent-600 dark:text-accent-400">{inv.number ?? inv.id}</span></Td>
                  <Td muted>{inv.description ?? inv.plan_name ?? '—'}</Td>
                  <Td muted>{formatDate(inv.date ?? inv.created)}</Td>
                  <Td align="right">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      AED {Number(inv.amount ?? inv.amount_due ?? 0).toLocaleString()}
                    </span>
                  </Td>
                  <Td>
                    <Badge variant={inv.status === 'paid' ? 'success' : inv.status === 'open' ? 'warning' : 'neutral'} dot>
                      {inv.status ? inv.status.charAt(0).toUpperCase() + inv.status.slice(1) : '—'}
                    </Badge>
                  </Td>
                  <Td align="right">
                    {inv.invoice_pdf || inv.pdf_url ? (
                      <a href={inv.invoice_pdf ?? inv.pdf_url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-700 text-slate-400 transition-colors inline-block">
                        <Download size={14} />
                      </a>
                    ) : (
                      <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-700 text-slate-400 transition-colors opacity-40 cursor-not-allowed">
                        <Download size={14} />
                      </button>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>
    </div>
  )
}
