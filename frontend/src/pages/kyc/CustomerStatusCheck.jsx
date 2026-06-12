import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Shield, CheckCircle, XCircle, AlertTriangle,
  RefreshCw, FileText, Loader2, Clock, User, Activity,
  ShieldAlert, Banknote, Newspaper, Fingerprint,
} from 'lucide-react'
import { useCustomer, useScreenCustomer } from '../../hooks/useKYC'
import { useAlerts } from '../../hooks/useAML'
import { formatDate } from '../../utils/helpers'
import clsx from 'clsx'

// ─── Check steps definition ──────────────────────────────────────────────────
const STEPS = [
  { id: 'kyc',      label: 'KYC Verification',       desc: 'Identity documents & registration',  icon: Fingerprint  },
  { id: 'pep',      label: 'PEP Database',            desc: '1.2M+ politically exposed persons', icon: User         },
  { id: 'ofac',     label: 'OFAC Sanctions (SDN)',    desc: 'US Office of Foreign Assets Control',icon: Shield       },
  { id: 'un',       label: 'UN Security Council',     desc: 'United Nations sanctions list',      icon: ShieldAlert  },
  { id: 'eu',       label: 'EU Consolidated List',    desc: 'European Union sanctions database',  icon: ShieldAlert  },
  { id: 'media',    label: 'Adverse Media',           desc: 'Global news & enforcement actions',  icon: Newspaper    },
  { id: 'tx',       label: 'Transaction Risk',        desc: 'Behavioural & volume risk scoring',  icon: Banknote     },
  { id: 'alerts',   label: 'AML Alert History',       desc: 'Open alerts & monitoring flags',     icon: Activity     },
]

// ─── Status helpers ───────────────────────────────────────────────────────────
function getStepResult(stepId, customer, alerts) {
  switch (stepId) {
    case 'kyc':    return customer.kyc_status === 'verified' ? 'pass' : customer.kyc_status === 'rejected' ? 'fail' : 'warn'
    case 'pep':    return customer.is_pep ? 'warn' : 'pass'
    case 'ofac':   return customer.sanctions_match ? 'fail' : 'pass'
    case 'un':     return customer.un_sanctions_match ? 'fail' : 'pass'
    case 'eu':     return customer.eu_sanctions_match ? 'fail' : 'pass'
    case 'media':  return customer.adverse_media ? 'warn' : 'pass'
    case 'tx': {
      const score = customer.risk_score ?? 0
      return score >= 80 ? 'fail' : score >= 50 ? 'warn' : 'pass'
    }
    case 'alerts': {
      const critical = alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length
      return critical > 0 ? 'fail' : alerts.length > 0 ? 'warn' : 'pass'
    }
    default: return 'pass'
  }
}

function getStepDetail(stepId, customer, alerts) {
  switch (stepId) {
    case 'kyc':    return customer.kyc_status === 'verified' ? 'Identity verified — documents accepted' : `Status: ${customer.kyc_status?.replace('_', ' ')}`
    case 'pep':    return customer.is_pep ? 'PEP match — Enhanced Due Diligence required' : 'No PEP match found'
    case 'ofac':   return customer.sanctions_match ? 'OFAC SDN match — PROHIBITED' : 'No OFAC SDN match'
    case 'un':     return customer.un_sanctions_match ? 'UN sanctions match — PROHIBITED' : 'No UN sanctions match'
    case 'eu':     return customer.eu_sanctions_match ? 'EU consolidated list match' : 'No EU match found'
    case 'media':  return customer.adverse_media ? 'Adverse media coverage found' : 'No adverse media found'
    case 'tx':     return `Risk score: ${customer.risk_score ?? 0}/100 · ${customer.risk_level ?? 'low'} risk`
    case 'alerts': return alerts.length === 0 ? 'No active AML alerts' : `${alerts.length} alert(s) — ${alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length} high/critical`
    default: return ''
  }
}

function getVerdict(customer, alerts) {
  const hasSanctions = customer.sanctions_match || customer.un_sanctions_match || customer.eu_sanctions_match
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length
  if (hasSanctions || criticalAlerts > 0) {
    return {
      level: 'danger',
      title: 'DO NOT PROCEED',
      subtitle: hasSanctions ? 'Sanctions match — prohibited under UAE AML Law' : `${criticalAlerts} critical AML alert(s) require immediate escalation`,
      bg: 'from-red-600 to-red-800',
      icon: XCircle,
    }
  }
  if (customer.is_pep || customer.adverse_media || (customer.risk_score ?? 0) >= 70) {
    return {
      level: 'warning',
      title: 'PROCEED WITH CAUTION',
      subtitle: customer.is_pep ? 'PEP — Enhanced Due Diligence & senior approval required' : `High risk score (${customer.risk_score}/100) — enhanced monitoring mandatory`,
      bg: 'from-amber-500 to-orange-600',
      icon: AlertTriangle,
    }
  }
  return {
    level: 'success',
    title: 'SAFE TO PROCEED',
    subtitle: 'All checks passed — no sanctions, PEP, or critical alerts detected',
    bg: 'from-emerald-500 to-teal-600',
    icon: CheckCircle,
  }
}

// ─── Step Card ────────────────────────────────────────────────────────────────
const resultStyle = {
  pass:    { bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-900/30', icon: CheckCircle,  iconCls: 'text-emerald-500', label: 'Clear',   labelCls: 'text-emerald-600 dark:text-emerald-400' },
  warn:    { bg: 'bg-amber-50 dark:bg-amber-950/20',     border: 'border-amber-200 dark:border-amber-900/30',     icon: AlertTriangle, iconCls: 'text-amber-500',  label: 'Caution', labelCls: 'text-amber-600 dark:text-amber-400'   },
  fail:    { bg: 'bg-red-50 dark:bg-red-950/20',         border: 'border-red-200 dark:border-red-900/30',         icon: XCircle,       iconCls: 'text-red-500',    label: 'MATCH',   labelCls: 'text-red-600 dark:text-red-400'       },
  loading: { bg: 'bg-slate-50 dark:bg-navy-750',         border: 'border-slate-200 dark:border-navy-600',         icon: Loader2,       iconCls: 'text-accent-500 animate-spin', label: 'Checking…', labelCls: 'text-slate-400' },
  pending: { bg: 'bg-slate-50 dark:bg-navy-750',         border: 'border-slate-200 dark:border-navy-600',         icon: Clock,         iconCls: 'text-slate-300 dark:text-slate-600', label: 'Waiting', labelCls: 'text-slate-300 dark:text-slate-600' },
}

function StepCard({ step, state, result, detail, index }) {
  const s = resultStyle[state] ?? resultStyle.pending
  const StepIcon = step.icon
  const StatusIcon = s.icon

  return (
    <div className={clsx(
      'flex items-center gap-4 p-4 rounded-xl border transition-all duration-500',
      s.bg, s.border,
      state === 'loading' ? 'shadow-md scale-[1.01]' : ''
    )}>
      {/* Step number + icon */}
      <div className={clsx(
        'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all',
        state === 'pass'    ? 'bg-emerald-100 dark:bg-emerald-950/40' :
        state === 'warn'    ? 'bg-amber-100 dark:bg-amber-950/40' :
        state === 'fail'    ? 'bg-red-100 dark:bg-red-950/40' :
        state === 'loading' ? 'bg-accent-100 dark:bg-accent-950/40' :
                              'bg-slate-100 dark:bg-navy-700'
      )}>
        <StepIcon size={18} className={clsx(
          state === 'pass'    ? 'text-emerald-500' :
          state === 'warn'    ? 'text-amber-500' :
          state === 'fail'    ? 'text-red-500' :
          state === 'loading' ? 'text-accent-500' :
                                'text-slate-300 dark:text-slate-600'
        )} />
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p className={clsx('text-sm font-semibold', state === 'pending' ? 'text-slate-400 dark:text-slate-600' : 'text-slate-800 dark:text-slate-200')}>
          {step.label}
        </p>
        <p className={clsx('text-xs mt-0.5', state === 'pending' ? 'text-slate-300 dark:text-slate-700' : 'text-slate-500 dark:text-slate-400')}>
          {state === 'pending' ? step.desc : detail}
        </p>
      </div>

      {/* Status */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <StatusIcon size={15} className={s.iconCls} />
        <span className={clsx('text-xs font-bold', s.labelCls)}>{s.label}</span>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CustomerStatusCheck() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: customer, isLoading: custLoading, refetch } = useCustomer(id)
  const { data: alertsData } = useAlerts({ customer: id, page_size: 50 })
  const { mutate: screen, isPending: screening } = useScreenCustomer(id)

  const alerts = alertsData?.results ?? []

  // Animate step reveals after data loads
  const [revealedIdx, setRevealedIdx] = useState(-1)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)

  const startAnimation = useCallback(() => {
    setRevealedIdx(-1)
    setDone(false)
    setRunning(true)
    let i = 0
    const tick = () => {
      setRevealedIdx(i)
      i++
      if (i < STEPS.length) {
        setTimeout(tick, 420)
      } else {
        setRunning(false)
        setDone(true)
      }
    }
    setTimeout(tick, 300)
  }, [])

  // Auto-run when data first loads
  useEffect(() => {
    if (customer && !custLoading && revealedIdx === -1 && !running) {
      startAnimation()
    }
  }, [customer, custLoading])

  const handleRescreen = () => {
    screen(undefined, {
      onSuccess: () => {
        refetch()
        startAnimation()
      },
    })
  }

  if (custLoading) {
    return (
      <div className="flex items-center justify-center h-72">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading customer data…</p>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-72 gap-3">
        <p className="text-slate-500">Customer not found.</p>
        <button onClick={() => navigate('/kyc/customers')} className="text-accent-600 text-sm hover:underline">← Back to list</button>
      </div>
    )
  }

  const verdict = done ? getVerdict(customer, alerts) : null
  const VerdictIcon = verdict?.icon

  const initials = customer.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="space-y-5 max-w-2xl mx-auto">

      {/* Back nav */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/kyc/customers/${id}`)}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
        >
          <ArrowLeft size={16} className="text-slate-500" />
        </button>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          KYC / {customer.full_name} / <span className="text-slate-800 dark:text-slate-200 font-medium">Status Check</span>
        </p>
      </div>

      {/* Customer Header */}
      <div className="bg-white dark:bg-navy-800 border border-slate-100 dark:border-navy-700 rounded-2xl p-5 shadow-card">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-accent-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">{customer.full_name}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {customer.customer_number} · {customer.customer_type} · {customer.nationality}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Last screened: {customer.last_screened_at ? formatDate(customer.last_screened_at) : 'Never'}
            </p>
          </div>
          <button
            onClick={handleRescreen}
            disabled={screening || running}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-600 hover:bg-accent-700 text-white text-sm font-semibold transition-all disabled:opacity-60"
          >
            <RefreshCw size={14} className={screening || running ? 'animate-spin' : ''} />
            {screening ? 'Scanning…' : 'Re-Screen'}
          </button>
        </div>
      </div>

      {/* Scanning label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">AML Compliance Checks</h2>
          {running && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-accent-50 dark:bg-accent-950/30 rounded-full">
              <div className="w-1.5 h-1.5 bg-accent-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-accent-600 dark:text-accent-400">Scanning…</span>
            </div>
          )}
          {done && (
            <span className="text-xs text-slate-400">{STEPS.length} checks completed · {new Date().toLocaleTimeString('en-AE')}</span>
          )}
        </div>
        <span className="text-xs text-slate-400">{Math.max(0, revealedIdx + 1)}/{STEPS.length}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-100 dark:bg-navy-700 rounded-full overflow-hidden -mt-3">
        <div
          className="h-full bg-accent-500 rounded-full transition-all duration-500"
          style={{ width: `${((revealedIdx + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Step Cards */}
      <div className="space-y-2.5">
        {STEPS.map((step, idx) => {
          const state =
            idx > revealedIdx    ? 'pending' :
            idx === revealedIdx && running ? 'loading' :
            getStepResult(step.id, customer, alerts)

          const result = state !== 'pending' && state !== 'loading'
            ? getStepResult(step.id, customer, alerts) : null
          const detail = result
            ? getStepDetail(step.id, customer, alerts) : ''

          return (
            <StepCard
              key={step.id}
              step={step}
              state={state}
              result={result}
              detail={detail}
              index={idx}
            />
          )
        })}
      </div>

      {/* Verdict Banner */}
      {done && verdict && (
        <div className={clsx(
          'rounded-2xl p-6 text-white bg-gradient-to-r shadow-elevated overflow-hidden relative',
          verdict.bg
        )}>
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_white_0%,_transparent_70%)]" />
          <div className="relative flex items-center gap-5">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <VerdictIcon size={28} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold opacity-80 tracking-widest uppercase mb-1">Final Verdict</p>
              <p className="text-2xl font-black">{verdict.title}</p>
              <p className="text-sm opacity-80 mt-1">{verdict.subtitle}</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="relative mt-5 pt-4 border-t border-white/20 grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Risk Score', value: `${customer.risk_score ?? 0}/100` },
              { label: 'AML Alerts', value: alerts.length },
              { label: 'Checks Failed', value: STEPS.filter(s => getStepResult(s.id, customer, alerts) === 'fail').length },
            ].map(s => (
              <div key={s.label}>
                <p className="text-xl font-black">{s.value}</p>
                <p className="text-xs opacity-70">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {done && (
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/kyc/customers/${id}`)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-navy-600 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-navy-750 transition-colors"
          >
            <User size={15} />
            View Customer Profile
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent-600 hover:bg-accent-700 text-white text-sm font-semibold transition-colors"
          >
            <FileText size={15} />
            Download Report
          </button>
        </div>
      )}

    </div>
  )
}
