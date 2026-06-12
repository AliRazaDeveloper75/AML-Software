import { useState } from 'react'
import { Save, Building2, Key, Shield, Bell, Globe, RefreshCw } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import { TabLine } from '../components/common/Tabs'
import clsx from 'clsx'

const tabs = [
  { value: 'company', label: 'Company', icon: Building2 },
  { value: 'aml', label: 'AML Rules', icon: Shield },
  { value: 'api', label: 'API', icon: Key },
  { value: 'notifications', label: 'Notifications', icon: Bell },
]

function Toggle({ enabled, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-navy-700 last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
        {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={clsx(
          'relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0',
          enabled ? 'bg-accent-600' : 'bg-slate-200 dark:bg-navy-600'
        )}
      >
        <div className={clsx(
          'absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200',
          enabled ? 'translate-x-6' : 'translate-x-1'
        )} />
      </button>
    </div>
  )
}

export default function Settings() {
  const [tab, setTab] = useState('company')
  const [saving, setSaving] = useState(false)
  const [notifs, setNotifs] = useState({
    emailAlerts: true, smsAlerts: false, criticalOnly: false,
    weeklyReport: true, monthlyReport: true, systemUpdates: true,
  })
  const [amlRules, setAmlRules] = useState({
    ctrEnabled: true, ctrThreshold: 1000000,
    structuringDetection: true, pepEnhancedDD: true,
    sanctionsAutoFreeze: false, adverseMediaAlert: true,
    highRiskJurisdictions: true, velocityCheck: true,
  })

  const save = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 1200))
    setSaving(false)
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader
        title="Settings"
        subtitle="Configure your AML compliance platform"
        breadcrumb="Administration"
        actions={
          <Button icon={Save} loading={saving} onClick={save}>Save Changes</Button>
        }
      />

      <Card padding={false} className="overflow-hidden">
        <TabLine tabs={tabs} active={tab} onChange={setTab} className="px-5" />

        <div className="p-6">
          {tab === 'company' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Company Name</label>
                  <input type="text" defaultValue="Al Merak Compliance Solutions LLC" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Trade License No.</label>
                  <input type="text" defaultValue="DED-2022-XXXXXX" className="input-field font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tax Registration No.</label>
                  <input type="text" defaultValue="100-xxxxxx-1" className="input-field font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">CBUAE License No.</label>
                  <input type="text" defaultValue="CBUAE-COMP-2022-XXX" className="input-field font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Jurisdiction</label>
                  <select className="input-field">
                    <option>Dubai - DIFC</option>
                    <option>Abu Dhabi - ADGM</option>
                    <option>Dubai - Mainland</option>
                    <option>Sharjah</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Compliance Officer</label>
                  <input type="text" defaultValue="Sara Al Zaabi" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Contact Email</label>
                  <input type="email" defaultValue="compliance@almerak.ae" className="input-field" />
                </div>
              </div>
            </div>
          )}

          {tab === 'aml' && (
            <div className="space-y-5">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">CBUAE AML Rule Configuration</p>
                <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                  Changes to AML rules will be logged for audit purposes. Ensure all rule changes are approved by the Compliance Officer.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">Cash Transaction Reporting (CTR)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Automatically flag cash transactions above the threshold</p>
                <div className="space-y-0 border border-slate-100 dark:border-navy-700 rounded-xl divide-y divide-slate-100 dark:divide-navy-700">
                  <Toggle
                    enabled={amlRules.ctrEnabled}
                    onChange={v => setAmlRules(r => ({ ...r, ctrEnabled: v }))}
                    label="Enable CTR Reporting"
                    description="Flag all cash transactions above threshold"
                  />
                  <div className="flex items-center justify-between py-3 px-0">
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">CTR Threshold (AED)</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Default: AED 1,000,000 per CBUAE guidelines</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">AED</span>
                      <input
                        type="number"
                        value={amlRules.ctrThreshold}
                        onChange={e => setAmlRules(r => ({ ...r, ctrThreshold: parseInt(e.target.value) }))}
                        className="input-field w-32 text-right"
                      />
                    </div>
                  </div>
                  <Toggle
                    enabled={amlRules.structuringDetection}
                    onChange={v => setAmlRules(r => ({ ...r, structuringDetection: v }))}
                    label="Structuring Detection"
                    description="Alert when transactions appear to avoid CTR threshold"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Customer Screening Rules</h3>
                <div className="border border-slate-100 dark:border-navy-700 rounded-xl divide-y divide-slate-100 dark:divide-navy-700">
                  <Toggle enabled={amlRules.pepEnhancedDD} onChange={v => setAmlRules(r => ({...r, pepEnhancedDD: v}))} label="PEP Enhanced Due Diligence" description="Trigger EDD workflow for PEP customers automatically" />
                  <Toggle enabled={amlRules.sanctionsAutoFreeze} onChange={v => setAmlRules(r => ({...r, sanctionsAutoFreeze: v}))} label="Auto-Freeze on Sanctions Match" description="Immediately freeze accounts with confirmed sanctions match" />
                  <Toggle enabled={amlRules.adverseMediaAlert} onChange={v => setAmlRules(r => ({...r, adverseMediaAlert: v}))} label="Adverse Media Monitoring" description="Alert when customer appears in negative news" />
                  <Toggle enabled={amlRules.highRiskJurisdictions} onChange={v => setAmlRules(r => ({...r, highRiskJurisdictions: v}))} label="High-Risk Jurisdiction Monitoring" description="Enhanced monitoring for FATF grey/black list countries" />
                  <Toggle enabled={amlRules.velocityCheck} onChange={v => setAmlRules(r => ({...r, velocityCheck: v}))} label="Transaction Velocity Check" description="Alert on unusual frequency of transactions" />
                </div>
              </div>
            </div>
          )}

          {tab === 'api' && (
            <div className="space-y-5">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">API Key Security</p>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">Never share your API keys. Rotate them if you suspect they've been compromised.</p>
              </div>

              <div className="space-y-4">
                {[
                  { name: 'Production API Key', key: 'ak_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx', env: 'production', created: '2025-01-01' },
                  { name: 'Sandbox API Key', key: 'ak_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx', env: 'sandbox', created: '2025-01-01' },
                ].map(api => (
                  <div key={api.name} className="border border-slate-100 dark:border-navy-700 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{api.name}</p>
                        <Badge variant={api.env === 'production' ? 'danger' : 'info'} className="mt-1">{api.env}</Badge>
                      </div>
                      <Button size="sm" variant="outline" icon={RefreshCw}>Rotate Key</Button>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-navy-750 rounded-lg p-3">
                      <code className="flex-1 text-xs font-mono text-slate-600 dark:text-slate-400 truncate">{api.key}</code>
                      <button className="text-xs text-accent-600 hover:text-accent-700 font-medium flex-shrink-0">Copy</button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Webhooks</h3>
                <div className="border border-slate-100 dark:border-navy-700 rounded-xl p-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Webhook URL</label>
                  <input type="url" placeholder="https://yourapp.com/webhook/aml" className="input-field" />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {['alert.created', 'kyc.approved', 'sanctions.match', 'report.generated'].map(event => (
                      <label key={event} className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded border-slate-300 text-accent-600" />
                        <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{event}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Alert Notifications</h3>
                <div className="border border-slate-100 dark:border-navy-700 rounded-xl divide-y divide-slate-100 dark:divide-navy-700">
                  <Toggle enabled={notifs.emailAlerts} onChange={v => setNotifs(n => ({...n, emailAlerts: v}))} label="Email Alerts" description="Receive AML alerts via email" />
                  <Toggle enabled={notifs.smsAlerts} onChange={v => setNotifs(n => ({...n, smsAlerts: v}))} label="SMS Alerts" description="Receive critical alerts via SMS" />
                  <Toggle enabled={notifs.criticalOnly} onChange={v => setNotifs(n => ({...n, criticalOnly: v}))} label="Critical Alerts Only" description="Only notify for critical severity alerts" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Reports</h3>
                <div className="border border-slate-100 dark:border-navy-700 rounded-xl divide-y divide-slate-100 dark:divide-navy-700">
                  <Toggle enabled={notifs.weeklyReport} onChange={v => setNotifs(n => ({...n, weeklyReport: v}))} label="Weekly Summary" description="Weekly compliance summary every Monday" />
                  <Toggle enabled={notifs.monthlyReport} onChange={v => setNotifs(n => ({...n, monthlyReport: v}))} label="Monthly Report" description="Monthly compliance and transaction report" />
                  <Toggle enabled={notifs.systemUpdates} onChange={v => setNotifs(n => ({...n, systemUpdates: v}))} label="System Updates" description="Watchlist updates and system maintenance" />
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
