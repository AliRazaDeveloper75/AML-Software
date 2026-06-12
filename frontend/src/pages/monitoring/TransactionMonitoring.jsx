import { useState } from 'react'
import { Activity, AlertTriangle, ZapOff, Eye, TrendingUp, Flag, Shield } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Card from '../../components/common/Card'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/common/Table'
import { useMonitoringAlerts, useMonitoringRules, useToggleMonitoringRule, useReviewMonitoringAlert } from '../../hooks/useMonitoring'
import { formatCurrency, formatDateTime } from '../../utils/helpers'
import clsx from 'clsx'

function EmptyState({ icon: Icon = AlertTriangle, label, sub }) {
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

const riskColor = score =>
  score >= 90 ? 'text-red-600' : score >= 70 ? 'text-amber-600' : 'text-green-600'

const statusVariant = { under_review: 'warning', reported: 'info', cleared: 'success', flagged: 'danger' }
const statusLabel = { under_review: 'Under Review', reported: 'Reported', cleared: 'Cleared', flagged: 'Flagged' }

export default function TransactionMonitoring() {
  const [live, setLive] = useState(true)
  const [threshold] = useState(1000000)

  const { data: alertsRes, isLoading: alertsLoading } = useMonitoringAlerts()
  const { data: rulesRes, isLoading: rulesLoading } = useMonitoringRules()
  const toggleRule = useToggleMonitoringRule()
  const reviewAlert = useReviewMonitoringAlert()

  const alerts = alertsRes?.results ?? alertsRes?.data ?? []
  const rules = rulesRes?.results ?? rulesRes?.data ?? []

  const criticalAlerts = alerts.filter(a => a.risk_score >= 90)
  const flaggedAlerts = alerts.filter(a => a.status === 'flagged' || a.is_flagged)
  const frozenAmount = alerts.filter(a => a.status === 'frozen').reduce((s, a) => s + Number(a.amount ?? 0), 0)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Transaction Monitoring"
        subtitle="Real-time AML transaction surveillance"
        breadcrumb="Monitoring"
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={clsx('w-2 h-2 rounded-full', live ? 'bg-green-500 animate-pulse' : 'bg-slate-400')} />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {live ? 'Live' : 'Paused'}
              </span>
            </div>
            <Button
              variant={live ? 'secondary' : 'primary'}
              size="sm"
              icon={live ? ZapOff : Activity}
              onClick={() => setLive(v => !v)}
            >
              {live ? 'Pause' : 'Resume'}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Active Alerts', value: alerts.length, sub: `${criticalAlerts.length} critical`, icon: AlertTriangle, color: 'text-red-600 bg-red-100 dark:bg-red-950/40' },
          { label: 'Flagged', value: flaggedAlerts.length, sub: 'Require review', icon: Flag, color: 'text-amber-600 bg-amber-100 dark:bg-amber-950/40' },
          { label: 'Frozen Assets', value: frozenAmount > 0 ? formatCurrency(frozenAmount) : '—', sub: 'CBUAE notified', icon: Shield, color: 'text-purple-600 bg-purple-100 dark:bg-purple-950/40' },
          { label: 'CTR Threshold', value: formatCurrency(threshold), sub: 'Cash reporting limit', icon: TrendingUp, color: 'text-amber-600 bg-amber-100 dark:bg-amber-950/40' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-navy-800 border border-slate-100 dark:border-navy-700 rounded-xl p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', s.color)}>
                <s.icon size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">{s.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
                <p className="text-xs text-slate-400">{s.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3">
          <Card padding={false} className="overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-navy-700 flex items-center justify-between">
              <h3 className="section-title">Suspicious Transaction Alerts</h3>
              {alerts.length > 0 && <Badge variant="danger" dot>{alerts.length} Active</Badge>}
            </div>
            {alertsLoading ? (
              <div className="py-10 text-center text-sm text-slate-400">Loading…</div>
            ) : alerts.length === 0 ? (
              <EmptyState
                icon={AlertTriangle}
                label="No active alerts"
                sub="Monitoring alerts will appear here when triggered"
              />
            ) : (
              <Table>
                <Thead>
                  <tr>
                    <Th>Customer</Th>
                    <Th align="right">Amount</Th>
                    <Th>Type</Th>
                    <Th>Risk Score</Th>
                    <Th>Status</Th>
                    <Th align="right">Action</Th>
                  </tr>
                </Thead>
                <Tbody>
                  {alerts.map(alert => (
                    <Tr key={alert.id} highlight={alert.status === 'frozen'}>
                      <Td>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                          {alert.customer_name ?? alert.customer ?? '—'}
                        </p>
                        <p className="text-xs text-slate-400 font-mono">{alert.id}</p>
                      </Td>
                      <Td align="right">
                        <span className="font-bold text-red-600 dark:text-red-400">
                          {alert.amount != null ? formatCurrency(Number(alert.amount)) : '—'}
                        </span>
                      </Td>
                      <Td muted>{alert.alert_type ?? alert.type ?? '—'}</Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-slate-200 dark:bg-navy-700 rounded-full overflow-hidden">
                            <div
                              className={clsx('h-full rounded-full', (alert.risk_score ?? 0) >= 90 ? 'bg-red-500' : (alert.risk_score ?? 0) >= 70 ? 'bg-amber-500' : 'bg-green-500')}
                              style={{ width: `${alert.risk_score ?? 0}%` }}
                            />
                          </div>
                          <span className={clsx('text-xs font-bold', riskColor(alert.risk_score ?? 0))}>
                            {alert.risk_score ?? '—'}
                          </span>
                        </div>
                      </Td>
                      <Td>
                        <Badge variant={statusVariant[alert.status] ?? 'neutral'}>
                          {statusLabel[alert.status] ?? (alert.status ?? '—')}
                        </Badge>
                      </Td>
                      <Td align="right">
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={Eye}
                          onClick={() => reviewAlert.mutate({ id: alert.id, status: 'under_review' })}
                        >
                          Review
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <h3 className="section-title mb-3">AML Rules Status</h3>
            {rulesLoading ? (
              <div className="py-6 text-center text-sm text-slate-400">Loading…</div>
            ) : rules.length === 0 ? (
              <EmptyState
                icon={Shield}
                label="No rules configured"
                sub="Add monitoring rules to start detecting patterns"
              />
            ) : (
              <div className="space-y-2">
                {rules.map(rule => (
                  <div key={rule.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-navy-700 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{rule.name}</p>
                      {rule.description && (
                        <p className="text-xs text-slate-400 truncate">{rule.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => toggleRule.mutate(rule.id)}
                      className={clsx(
                        'ml-3 w-9 h-5 rounded-full flex items-center cursor-pointer transition-all flex-shrink-0',
                        rule.is_active ? 'bg-green-500' : 'bg-slate-300 dark:bg-navy-600'
                      )}
                    >
                      <div className={clsx(
                        'w-3.5 h-3.5 bg-white rounded-full shadow-sm mx-0.5 transition-transform',
                        rule.is_active ? 'translate-x-4' : 'translate-x-0'
                      )} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
