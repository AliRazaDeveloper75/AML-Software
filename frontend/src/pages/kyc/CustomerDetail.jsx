import { useState, useRef, useEffect, Fragment } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Edit, AlertTriangle, CheckCircle, Clock, Download, User, Phone, Mail,
  Globe, Building2, RefreshCw, FileText, XCircle, ShieldAlert, X, Activity,
  Upload, Lock, ChevronRight, Scan,
} from 'lucide-react'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Card from '../../components/common/Card'
import {
  useCustomer, useScreenCustomer, useApproveCustomer, useRejectCustomer,
  useUploadDocument, useSuspendCustomer, useSumsubLink,
} from '../../hooks/useKYC'
import { useAlerts } from '../../hooks/useAML'
import { formatCurrency, formatDate } from '../../utils/helpers'
import clsx from 'clsx'

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getDecision(customer, alerts) {
  const hasSanctions = customer.sanctions_match || customer.un_sanctions_match || customer.eu_sanctions_match
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length
  const riskScore = customer.risk_score ?? 0

  if (hasSanctions || criticalAlerts > 0) {
    return {
      verdict: 'DO NOT PROCEED', level: 'danger', color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-900/30', icon: XCircle,
      reason: hasSanctions
        ? 'Sanctions match detected — prohibited by UAE AML regulations.'
        : `${criticalAlerts} critical/high AML alert(s) require immediate escalation.`,
    }
  }
  if (customer.is_pep || customer.adverse_media || riskScore >= 70) {
    return {
      verdict: 'PROCEED WITH CAUTION', level: 'warning', color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-900/30', icon: ShieldAlert,
      reason: customer.is_pep
        ? 'Customer is a Politically Exposed Person — Enhanced Due Diligence required.'
        : customer.adverse_media
          ? 'Adverse media hits found — enhanced monitoring required.'
          : `High risk score (${riskScore}/100) — apply enhanced due diligence.`,
    }
  }
  return {
    verdict: 'SAFE TO PROCEED', level: 'success', color: 'text-green-600',
    bg: 'bg-green-50 dark:bg-green-950/20', border: 'border-green-200 dark:border-green-900/30', icon: CheckCircle,
    reason: 'No sanctions, PEP matches, or high-severity alerts. Risk within acceptable limits.',
  }
}

// ─── Workflow helpers ──────────────────────────────────────────────────────────

const STEPS = [
  { id: 'profile',    label: 'Profile Created' },
  { id: 'documents',  label: 'Documents' },
  { id: 'screening',  label: 'AML Screening' },
  { id: 'compliance', label: 'Compliance Review' },
  { id: 'decision',   label: 'Final Decision' },
]

function getWorkflowState(customer, alerts) {
  const openAlerts = alerts.filter(a => !a.status || a.status === 'open' || a.status === 'under_review')
  return {
    profile:    true,
    documents:  (customer.documents ?? []).length > 0,
    screening:  !!customer.last_screened_at,
    compliance: !!customer.last_screened_at && openAlerts.length === 0,
    decision:   ['verified', 'rejected', 'suspended'].includes(customer.kyc_status),
  }
}

// ─── WorkflowStepper ──────────────────────────────────────────────────────────

function WorkflowStepper({ customer, alerts }) {
  const state = getWorkflowState(customer, alerts)
  const currentIdx = STEPS.findIndex(s => !state[s.id])

  return (
    <div className="bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-2xl px-6 py-4">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Compliance Workflow</p>
      <div className="flex items-center">
        {STEPS.map((step, idx) => {
          const done    = state[step.id]
          const active  = idx === currentIdx
          const stepIdx = idx

          return (
            <Fragment key={step.id}>
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300',
                  done   ? 'bg-green-500 text-white' :
                  active ? 'bg-accent-600 text-white ring-4 ring-accent-100 dark:ring-accent-900/40' :
                           'bg-slate-100 dark:bg-navy-700 text-slate-400 dark:text-slate-500',
                )}>
                  {done ? <CheckCircle size={16} /> : <span>{idx + 1}</span>}
                </div>
                <p className={clsx(
                  'text-xs font-medium text-center leading-tight hidden sm:block',
                  done   ? 'text-green-600 dark:text-green-500' :
                  active ? 'text-accent-600 font-semibold' :
                           'text-slate-400',
                )}>
                  {step.label}
                </p>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={clsx(
                  'h-0.5 flex-1 mb-5 mx-1 rounded-full transition-all',
                  stepIdx < currentIdx ? 'bg-green-400' : 'bg-slate-200 dark:bg-navy-700',
                )} />
              )}
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}

// ─── NextActionBanner ─────────────────────────────────────────────────────────

function NextActionBanner({ customer, alerts, onUpload, onScreen, screening }) {
  const state     = getWorkflowState(customer, alerts)
  const openAlerts = alerts.filter(a => !a.status || a.status === 'open' || a.status === 'under_review')

  if (state.decision) return null

  if (!state.documents) {
    return (
      <div className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl">
        <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
          <Upload size={16} className="text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Step 2: Upload KYC Documents</p>
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">Upload Emirates ID, Passport, or Trade License before proceeding to screening.</p>
        </div>
        <Button size="sm" onClick={onUpload} icon={Upload}>Upload Now</Button>
      </div>
    )
  }

  if (!state.screening) {
    return (
      <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-xl">
        <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
          <ShieldAlert size={16} className="text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Step 3: Run AML Screening</p>
          <p className="text-xs text-blue-600 dark:text-blue-500 mt-0.5">Screen against PEP lists, OFAC SDN, UN &amp; EU sanctions, and adverse media.</p>
        </div>
        <Button size="sm" loading={screening} onClick={onScreen} icon={ShieldAlert}>Screen Now</Button>
      </div>
    )
  }

  if (openAlerts.length > 0) {
    return (
      <div className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl">
        <div className="w-9 h-9 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={16} className="text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-red-800 dark:text-red-300">
            Step 4: {openAlerts.length} Open AML Alert{openAlerts.length > 1 ? 's' : ''} — Compliance Review Required
          </p>
          <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">Resolve all open alerts in the AML Alerts module before making a final decision.</p>
        </div>
        <Button size="sm" variant="danger" icon={ChevronRight} onClick={() => window.location.href = '/aml/alerts'}>
          Review Alerts
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-xl">
      <div className="w-9 h-9 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
        <CheckCircle size={16} className="text-green-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-green-800 dark:text-green-300">Step 5: All Checks Complete — Make Final Decision</p>
        <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">Screening done, no open alerts. Approve, reject, or suspend this customer below.</p>
      </div>
    </div>
  )
}

// ─── SumsubModal ─────────────────────────────────────────────────────────────

function SumsubModal({ customerId, onClose }) {
  const { mutate: getLink, isPending, data, error } = useSumsubLink(customerId)
  const launched = useRef(false)

  // Fetch link on mount
  useEffect(() => { getLink() }, [])

  const sdkUrl = data?.data?.url
  const token  = data?.data?.token

  // Load Sumsub Web SDK and launch when token is ready
  useEffect(() => {
    if (!token || launched.current) return
    launched.current = true

    const script = document.createElement('script')
    script.src = 'https://static.sumsub.com/idensic/static/sns-websdk-builder.js'
    script.onload = () => {
      if (window.snsWebSdk) {
        window.snsWebSdk
          .init(token, () => Promise.resolve(token))
          .withConf({ lang: 'en' })
          .withOptions({ addViewportTag: false, adaptIframeHeight: true })
          .on('idCheck.onStepCompleted', (p) => console.log('Sumsub step:', p))
          .on('idCheck.onApplicantStatusChanged', (p) => {
            console.log('Sumsub status:', p)
            if (p?.reviewResult?.reviewAnswer === 'GREEN') onClose()
          })
          .build()
          .launch('#sumsub-container')
      }
    }
    document.head.appendChild(script)
  }, [token])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-elevated w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-navy-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-950/40 rounded-xl flex items-center justify-center">
              <Scan size={14} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Identity Verification</p>
              <p className="text-xs text-slate-400">Powered by Sumsub · Emirates ID · Passport · Face Check</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-700 text-slate-400 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isPending && (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500">Loading verification portal…</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center p-6">
              <XCircle size={32} className="text-red-400" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sumsub not configured</p>
              <p className="text-xs text-slate-400">
                Add <code className="bg-slate-100 dark:bg-navy-700 px-1 rounded">SUMSUB_APP_TOKEN</code> and{' '}
                <code className="bg-slate-100 dark:bg-navy-700 px-1 rounded">SUMSUB_SECRET_KEY</code> to your{' '}
                <code className="bg-slate-100 dark:bg-navy-700 px-1 rounded">.env</code> file.
              </p>
              {sdkUrl && (
                <a href={sdkUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" icon={ChevronRight}>Open in Sumsub Portal</Button>
                </a>
              )}
            </div>
          )}

          {/* Sumsub SDK mounts here */}
          <div id="sumsub-container" style={{ minHeight: '400px' }} />

          {/* Fallback: open hosted link in new tab */}
          {sdkUrl && !error && (
            <div className="mt-3 text-center">
              <p className="text-xs text-slate-400 mb-1">Having trouble? Open verification in a new tab:</p>
              <a href={sdkUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-accent-600 hover:underline">
                Open Sumsub Portal →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── UploadDocModal ───────────────────────────────────────────────────────────

const DOC_TYPES = [
  { value: 'emirates_id',              label: 'Emirates ID' },
  { value: 'passport',                 label: 'Passport' },
  { value: 'trade_license',            label: 'Trade License' },
  { value: 'memorandum_of_association',label: 'Memorandum of Association' },
  { value: 'bank_statement',           label: 'Bank Statement' },
  { value: 'utility_bill',             label: 'Utility Bill' },
  { value: 'proof_of_address',         label: 'Proof of Address' },
  { value: 'financial_statement',      label: 'Financial Statement' },
]

function UploadDocModal({ customerId, onClose }) {
  const fileRef  = useRef(null)
  const [file, setFile]       = useState(null)
  const [docType, setDocType] = useState('')
  const [error, setError]     = useState('')
  const { mutate: upload, isPending } = useUploadDocument(customerId)

  const handleSubmit = () => {
    if (!docType) { setError('Select a document type.'); return }
    if (!file)    { setError('Choose a file to upload.'); return }
    const fd = new FormData()
    fd.append('customer', customerId)
    fd.append('document_type', docType)
    fd.append('file', file)
    upload(fd, {
      onSuccess: onClose,
      onError: () => setError('Upload failed. Please try again.'),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-elevated w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-navy-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent-100 dark:bg-accent-950/40 rounded-xl flex items-center justify-center">
              <Upload size={14} className="text-accent-600" />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Upload KYC Document</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-700 text-slate-400 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Document Type</label>
            <select
              value={docType}
              onChange={e => { setDocType(e.target.value); setError('') }}
              className="input-field w-full"
            >
              <option value="">Select document type...</option>
              {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">File</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-slate-200 dark:border-navy-600 rounded-xl p-6 text-center cursor-pointer hover:border-accent-400 dark:hover:border-accent-600 transition-colors"
            >
              {file ? (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{file.name}</p>
                  <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload size={24} className="mx-auto text-slate-300" />
                  <p className="text-sm text-slate-500">Click to select file</p>
                  <p className="text-xs text-slate-400">PDF, JPEG, PNG · Max 10 MB</p>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={e => { setFile(e.target.files[0]); setError('') }}
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" loading={isPending} onClick={handleSubmit} icon={Upload}>
              Upload Document
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── StatusReportModal ────────────────────────────────────────────────────────

function StatusReportModal({ customer, alerts, onClose }) {
  const decision     = getDecision(customer, alerts)
  const DecisionIcon = decision.icon
  const now = new Date().toLocaleString('en-AE', { timeZone: 'Asia/Dubai', dateStyle: 'long', timeStyle: 'short' })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-elevated w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-navy-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-accent-100 dark:bg-accent-950/40 rounded-xl flex items-center justify-center">
              <FileText size={16} className="text-accent-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">AML Status Report</p>
              <p className="text-xs text-slate-400">{now} · Dubai Time</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={Download} onClick={() => window.print()}>Print / Save PDF</Button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-700 text-slate-400 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className={clsx('flex items-center gap-4 p-4 rounded-xl border', decision.bg, decision.border)}>
            <DecisionIcon size={28} className={clsx('flex-shrink-0', decision.color)} />
            <div>
              <p className={clsx('text-lg font-bold', decision.color)}>{decision.verdict}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{decision.reason}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Customer Summary</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Full Name',   value: customer.full_name },
                { label: 'Customer ID', value: customer.customer_number },
                { label: 'Type',        value: customer.customer_type },
                { label: 'Nationality', value: customer.nationality },
                { label: 'Industry',    value: customer.industry },
                { label: 'KYC Status',  value: customer.kyc_status?.replace('_', ' ') },
                { label: 'Risk Level',  value: customer.risk_level },
                { label: 'Risk Score',  value: customer.risk_score != null ? `${customer.risk_score}/100` : '—' },
              ].map(item => (
                <div key={item.label} className="bg-slate-50 dark:bg-navy-750 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-0.5">{item.label}</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 capitalize">{item.value ?? '—'}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Screening Results</p>
            <div className="space-y-2">
              {[
                { label: 'PEP Check',      match: customer.is_pep },
                { label: 'OFAC Sanctions', match: customer.sanctions_match },
                { label: 'UN Sanctions',   match: customer.un_sanctions_match },
                { label: 'EU Sanctions',   match: customer.eu_sanctions_match },
                { label: 'Adverse Media',  match: customer.adverse_media },
              ].map(check => (
                <div key={check.label} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-navy-700 last:border-0">
                  <p className="text-sm text-slate-700 dark:text-slate-300">{check.label}</p>
                  <div className={clsx('flex items-center gap-1.5', check.match ? 'text-red-600' : 'text-green-600')}>
                    {check.match ? <AlertTriangle size={13} /> : <CheckCircle size={13} />}
                    <span className="text-xs font-semibold">{check.match ? 'MATCH' : 'Clear'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">AML Alerts ({alerts.length})</p>
            {alerts.length === 0
              ? <p className="text-sm text-green-600 flex items-center gap-2"><CheckCircle size={14} /> No active AML alerts</p>
              : (
                <div className="space-y-2">
                  {alerts.map(a => (
                    <div key={a.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-navy-700 last:border-0">
                      <p className="text-xs text-slate-700 dark:text-slate-300">{a.alert_type ?? a.description}</p>
                      <Badge variant={a.severity === 'critical' ? 'critical' : a.severity === 'high' ? 'high' : a.severity === 'medium' ? 'medium' : 'low'}>
                        {a.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
          <p className="text-xs text-slate-400 border-t border-slate-100 dark:border-navy-700 pt-4">
            Generated by {customer.organization?.name ?? 'Al Merak AML'} · {now}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Constants ────────────────────────────────────────────────────────────────

const riskColor = { high: 'text-red-600', medium: 'text-amber-600', low: 'text-green-600', critical: 'text-purple-600' }
const kycV      = { verified: 'success', pending: 'warning', rejected: 'danger', under_review: 'info', suspended: 'neutral' }
const docStatusColor     = { verified: 'bg-green-100 dark:bg-green-950/40', pending: 'bg-amber-100 dark:bg-amber-950/40', missing: 'bg-slate-100 dark:bg-navy-700', n_a: 'bg-slate-100 dark:bg-navy-700' }
const docStatusIcon      = { verified: CheckCircle, pending: Clock, missing: User, n_a: User }
const docStatusTextColor = { verified: 'text-green-600', pending: 'text-amber-600', missing: 'text-slate-400', n_a: 'text-slate-400' }

// ─── Main component ───────────────────────────────────────────────────────────

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [rejectReason, setRejectReason]     = useState('')
  const [suspendReason, setSuspendReason]   = useState('')
  const [showRejectInput, setShowRejectInput]     = useState(false)
  const [showSuspendInput, setShowSuspendInput]   = useState(false)
  const [showReport, setShowReport]         = useState(false)
  const [showUpload, setShowUpload]         = useState(false)
  const [showSumsub, setShowSumsub]         = useState(false)

  const { data: customer, isLoading, isError } = useCustomer(id)
  const { data: alertsData } = useAlerts({ customer: id, page_size: 50 })
  const customerAlerts = alertsData?.results ?? []
  const openAlerts     = customerAlerts.filter(a => !a.status || a.status === 'open' || a.status === 'under_review')

  const { mutate: screen,  isPending: screening }  = useScreenCustomer(id)
  const { mutate: approve, isPending: approving }   = useApproveCustomer(id)
  const { mutate: reject,  isPending: rejecting }   = useRejectCustomer(id)
  const { mutate: suspend, isPending: suspending }  = useSuspendCustomer(id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-2 border-accent-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (isError || !customer) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-slate-500 dark:text-slate-400">Customer not found.</p>
        <Button variant="ghost" onClick={() => navigate('/kyc/customers')}>Back to list</Button>
      </div>
    )
  }

  const initials = customer.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const documents = customer.documents ?? []
  const screened  = !!customer.last_screened_at
  const isFinal   = ['verified', 'rejected', 'suspended'].includes(customer.kyc_status)
  const canDecide = screened && openAlerts.length === 0
  const screeningChecks = [
    { label: 'PEP Check',      match: customer.is_pep },
    { label: 'OFAC Sanctions', match: customer.sanctions_match },
    { label: 'UN Sanctions',   match: customer.un_sanctions_match },
    { label: 'EU Sanctions',   match: customer.eu_sanctions_match },
    { label: 'Adverse Media',  match: customer.adverse_media },
  ]

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/kyc/customers')}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
        >
          <ArrowLeft size={16} className="text-slate-500" />
        </button>
        <p className="text-sm text-slate-500 dark:text-slate-400">KYC Management / {customer.full_name}</p>
      </div>

      {/* Workflow Stepper */}
      <WorkflowStepper customer={customer} alerts={customerAlerts} />

      {/* Next Action Banner */}
      <NextActionBanner
        customer={customer}
        alerts={customerAlerts}
        onUpload={() => setShowUpload(true)}
        onScreen={() => screen()}
        screening={screening}
      />

      {/* Customer Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-accent-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{customer.full_name}</h1>
              <Badge variant={kycV[customer.kyc_status] ?? 'neutral'}>{customer.kyc_status?.replace('_', ' ')}</Badge>
              {customer.is_pep && <Badge variant="warning">PEP</Badge>}
              {customer.sanctions_match && <Badge variant="danger">Sanctions Match</Badge>}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {customer.customer_number} · {customer.customer_type} · {customer.industry}
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" icon={Scan} onClick={() => setShowSumsub(true)}>
            Identity Verify
          </Button>
          <Button variant="outline" size="sm" icon={Activity} onClick={() => navigate(`/kyc/customers/${id}/status-check`)}>
            Live Status Check
          </Button>
          <Button variant="outline" size="sm" icon={FileText} onClick={() => setShowReport(true)}>
            Status Report
          </Button>
          <Button variant="outline" size="sm" icon={RefreshCw} loading={screening} onClick={() => screen()}>
            Re-Screen
          </Button>

          {/* Decision buttons — gated behind canDecide */}
          {!isFinal && canDecide && (
            <>
              <Button size="sm" variant="ghost" icon={Lock}
                onClick={() => { setShowSuspendInput(v => !v); setShowRejectInput(false) }}>
                Suspend
              </Button>
              <Button size="sm" variant="danger"
                onClick={() => { setShowRejectInput(v => !v); setShowSuspendInput(false) }}>
                Reject
              </Button>
              <Button size="sm" loading={approving} onClick={() => approve()}>
                Approve
              </Button>
            </>
          )}

          {!isFinal && !canDecide && (
            <Button size="sm" disabled title="Complete all workflow steps first" icon={Lock}>
              Approve
            </Button>
          )}

          {isFinal && <Button size="sm" icon={Edit}>Edit</Button>}
        </div>
      </div>

      {/* Reject input */}
      {showRejectInput && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl">
          <input
            type="text"
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Enter rejection reason..."
            className="input-field flex-1"
          />
          <Button
            size="sm"
            variant="danger"
            loading={rejecting}
            onClick={() => reject(rejectReason, { onSuccess: () => setShowRejectInput(false) })}
          >
            Confirm Reject
          </Button>
          <button onClick={() => setShowRejectInput(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Suspend input */}
      {showSuspendInput && (
        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-navy-750 border border-slate-200 dark:border-navy-600 rounded-xl">
          <Lock size={16} className="text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={suspendReason}
            onChange={e => setSuspendReason(e.target.value)}
            placeholder="Enter suspension reason..."
            className="input-field flex-1"
          />
          <Button
            size="sm"
            loading={suspending}
            onClick={() => suspend(suspendReason, { onSuccess: () => setShowSuspendInput(false) })}
          >
            Confirm Suspend
          </Button>
          <button onClick={() => setShowSuspendInput(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="space-y-4">
          <Card>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Risk Assessment</p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Risk Score</span>
              <span className={clsx('text-2xl font-bold', riskColor[customer.risk_level] ?? 'text-slate-800 dark:text-slate-200')}>
                {customer.risk_score ?? '—'}
              </span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-navy-700 rounded-full overflow-hidden mb-3">
              <div
                className={clsx('h-full rounded-full transition-all', (customer.risk_score ?? 0) >= 80 ? 'bg-red-500' : (customer.risk_score ?? 0) >= 60 ? 'bg-amber-500' : 'bg-green-500')}
                style={{ width: `${customer.risk_score ?? 0}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <Badge variant={customer.risk_level ?? 'neutral'} dot>
                {customer.risk_level ? customer.risk_level.charAt(0).toUpperCase() + customer.risk_level.slice(1) : '—'} Risk
              </Badge>
              <span className="text-slate-400">Last screened {customer.last_screened_at ? formatDate(customer.last_screened_at) : 'Never'}</span>
            </div>
          </Card>

          <Card>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Contact Information</p>
            <div className="space-y-3">
              {[
                { icon: Mail,      label: 'Email',       value: customer.email },
                { icon: Phone,     label: 'Phone',       value: customer.phone },
                { icon: Globe,     label: 'Nationality', value: customer.nationality },
                { icon: Building2, label: 'Industry',    value: customer.industry },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-slate-100 dark:bg-navy-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <item.icon size={12} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{item.label}</p>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{item.value ?? '—'}</p>
                  </div>
                </div>
              ))}
              {customer.emirates_id && (
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-slate-100 dark:bg-navy-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User size={12} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Emirates ID</p>
                    <p className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">{customer.emirates_id}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Screening Status</p>
            {!screened ? (
              <div className="text-center py-3">
                <ShieldAlert size={24} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs text-slate-400">Not yet screened</p>
                <Button size="sm" variant="outline" className="mt-2" loading={screening} onClick={() => screen()}>
                  Run Screening
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {screeningChecks.map(check => (
                  <div key={check.label} className="flex items-center justify-between">
                    <p className="text-xs text-slate-600 dark:text-slate-400">{check.label}</p>
                    <div className={clsx('flex items-center gap-1', check.match ? 'text-red-500' : 'text-green-500')}>
                      {check.match ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                      <span className="text-xs font-semibold capitalize">{check.match ? 'Match' : 'Clear'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Transactions', value: (customer.transaction_count ?? 0).toLocaleString() },
              { label: 'Total Volume',       value: customer.total_volume ? formatCurrency(customer.total_volume) : '—' },
              { label: 'Customer Since',     value: formatDate(customer.created_at) },
            ].map(s => (
              <Card key={s.label} className="text-center py-3">
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{s.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
              </Card>
            ))}
          </div>

          {/* KYC Documents */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">KYC Documents</p>
                <p className="text-xs text-slate-400 mt-0.5">{documents.length} uploaded</p>
              </div>
              <Button size="sm" variant="outline" icon={Upload} onClick={() => setShowUpload(true)}>
                Upload Document
              </Button>
            </div>

            {documents.length === 0 ? (
              <div
                onClick={() => setShowUpload(true)}
                className="border-2 border-dashed border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/10 rounded-xl p-6 text-center cursor-pointer hover:border-amber-400 transition-colors"
              >
                <Upload size={24} className="mx-auto text-amber-400 mb-2" />
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">No documents uploaded</p>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">Click to upload Emirates ID, Passport, or Trade License</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {documents.map(doc => {
                  const statusKey = doc.verification_status ?? 'pending'
                  const IconComp  = docStatusIcon[statusKey] ?? User
                  return (
                    <div key={doc.id} className="border border-slate-100 dark:border-navy-700 rounded-xl p-3 text-center hover:border-accent-200 dark:hover:border-accent-900 transition-colors cursor-pointer">
                      <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2', docStatusColor[statusKey] ?? 'bg-slate-100 dark:bg-navy-700')}>
                        <IconComp size={14} className={docStatusTextColor[statusKey] ?? 'text-slate-400'} />
                      </div>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-tight">{doc.document_type?.replace(/_/g, ' ')}</p>
                      <p className={clsx('text-xs mt-1 capitalize', docStatusTextColor[statusKey] ?? 'text-slate-400')}>{statusKey}</p>
                    </div>
                  )
                })}
                <div
                  onClick={() => setShowUpload(true)}
                  className="border-2 border-dashed border-slate-200 dark:border-navy-600 rounded-xl p-3 text-center cursor-pointer hover:border-accent-400 transition-colors flex flex-col items-center justify-center gap-1"
                >
                  <Upload size={16} className="text-slate-300" />
                  <p className="text-xs text-slate-400">Add more</p>
                </div>
              </div>
            )}
          </Card>

          {/* AML Alerts */}
          {customerAlerts.length > 0 && (
            <Card padding={false} className="overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-navy-700 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">AML Alerts</p>
                <Badge variant={openAlerts.length > 0 ? 'danger' : 'success'} dot>
                  {openAlerts.length > 0 ? `${openAlerts.length} open` : 'All resolved'}
                </Badge>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-navy-700">
                {customerAlerts.map(alert => (
                  <div key={alert.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-navy-750 transition-colors">
                    <AlertTriangle size={14} className={
                      alert.severity === 'critical' ? 'text-purple-500' :
                      alert.severity === 'high'     ? 'text-red-500' :
                      'text-amber-500'
                    } />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{alert.alert_type}</p>
                      <p className="text-xs text-slate-400">{formatDate(alert.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {alert.status && (
                        <span className="text-xs text-slate-400 capitalize">{alert.status.replace('_', ' ')}</span>
                      )}
                      <Badge variant={alert.severity === 'critical' ? 'critical' : alert.severity === 'high' ? 'high' : 'medium'}>
                        {alert.severity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Final status for completed customers */}
          {isFinal && (
            <Card>
              <div className="flex items-center gap-4">
                {customer.kyc_status === 'verified' ? (
                  <>
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-950/40 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CheckCircle size={18} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-green-700 dark:text-green-400">Customer Approved</p>
                      <p className="text-xs text-slate-400">
                        Approved by {customer.approved_by?.full_name ?? '—'} on {customer.approved_at ? formatDate(customer.approved_at) : '—'}
                      </p>
                    </div>
                  </>
                ) : customer.kyc_status === 'suspended' ? (
                  <>
                    <div className="w-10 h-10 bg-slate-100 dark:bg-navy-700 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Lock size={18} className="text-slate-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Customer Suspended</p>
                      {customer.rejection_reason && (
                        <p className="text-xs text-slate-400 mt-0.5">Reason: {customer.rejection_reason}</p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-950/40 rounded-xl flex items-center justify-center flex-shrink-0">
                      <XCircle size={18} className="text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-red-700 dark:text-red-400">Customer Rejected</p>
                      {customer.rejection_reason && (
                        <p className="text-xs text-slate-400 mt-0.5">Reason: {customer.rejection_reason}</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Modals */}
      {showUpload  && <UploadDocModal customerId={id} onClose={() => setShowUpload(false)} />}
      {showSumsub  && <SumsubModal customerId={id} onClose={() => setShowSumsub(false)} />}
      {showReport  && <StatusReportModal customer={customer} alerts={customerAlerts} onClose={() => setShowReport(false)} />}
    </div>
  )
}
