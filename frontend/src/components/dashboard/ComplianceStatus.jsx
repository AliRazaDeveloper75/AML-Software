import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react'
import clsx from 'clsx'

const checks = [
  { label: 'CBUAE AML Guidelines', status: 'compliant', lastChecked: '2025-05-11' },
  { label: 'FATF Recommendations', status: 'compliant', lastChecked: '2025-05-10' },
  { label: 'UN Security Council Sanctions', status: 'compliant', lastChecked: '2025-05-11' },
  { label: 'OFAC SDN Screening', status: 'warning', lastChecked: '2025-05-09' },
  { label: 'EU Consolidated List', status: 'compliant', lastChecked: '2025-05-10' },
  { label: 'UAE VAT Compliance', status: 'compliant', lastChecked: '2025-05-08' },
  { label: 'Corporate Tax Filing', status: 'pending', lastChecked: '2025-04-30' },
  { label: 'STR/SAR Reporting', status: 'warning', lastChecked: '2025-05-07' },
]

const statusMap = {
  compliant: { icon: CheckCircle, color: 'text-green-500', label: 'Compliant' },
  warning: { icon: AlertCircle, color: 'text-amber-500', label: 'Action Required' },
  pending: { icon: Clock, color: 'text-blue-500', label: 'Pending Review' },
  failed: { icon: XCircle, color: 'text-red-500', label: 'Non-Compliant' },
}

export default function ComplianceStatus() {
  const compliant = checks.filter(c => c.status === 'compliant').length
  const score = Math.round((compliant / checks.length) * 100)

  return (
    <div>
      {/* Score */}
      <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-navy-750 rounded-xl mb-4">
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 -rotate-90">
            <circle cx="32" cy="32" r="26" fill="none" stroke="#e2e8f0" strokeWidth="4" className="dark:stroke-navy-600" />
            <circle
              cx="32" cy="32" r="26" fill="none"
              stroke={score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'}
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 26}`}
              strokeDashoffset={`${2 * Math.PI * 26 * (1 - score / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{score}%</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Compliance Score</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{compliant}/{checks.length} checks passing</p>
          <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
            {score >= 80 ? 'Good Standing' : score >= 60 ? 'Needs Attention' : 'Critical Issues'}
          </p>
        </div>
      </div>

      {/* Checks */}
      <div className="space-y-1">
        {checks.map((check, i) => {
          const cfg = statusMap[check.status]
          const Icon = cfg.icon
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-navy-750 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Icon size={13} className={cfg.color} />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{check.label}</span>
              </div>
              <div className="text-right">
                <p className={clsx('text-xs font-semibold', cfg.color)}>{cfg.label}</p>
                <p className="text-xs text-slate-400">{check.lastChecked}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
