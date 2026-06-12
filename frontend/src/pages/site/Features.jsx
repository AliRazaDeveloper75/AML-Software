import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import {
  Shield, Users, Activity, BarChart3, FileText, Eye,
  CheckCircle, ArrowRight, Database, Globe, Lock,
  AlertTriangle, TrendingUp, Receipt, Scale, BookOpen, Zap
} from 'lucide-react'

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }
const stagger = { show: { transition: { staggerChildren: 0.08 } } }

function InView({ children, className }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return <motion.div ref={ref} variants={fadeUp} initial="hidden" animate={inView ? 'show' : 'hidden'} className={className}>{children}</motion.div>
}
function InViewGroup({ children, className }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? 'show' : 'hidden'} className={className}>{children}</motion.div>
}

const modules = [
  {
    id: 'aml',
    icon: Shield,
    label: 'AML Screening',
    title: 'Real-time AML screening across 15+ global databases',
    desc: "Stop financial crime before it happens. Al Merak's AML engine screens every customer and transaction against the world's most comprehensive watchlist databases — instantly.",
    color: 'from-blue-500 to-blue-700',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    features: [
      'OFAC SDN, EU Consolidated, UN Security Council lists',
      'PEP database — 1.2M+ politically exposed persons',
      'Real-time screening with sub-second response',
      'Automatic re-screening when watchlists update',
      'False positive management & risk scoring',
      'Adverse media monitoring — 100,000+ global sources',
    ],
    metrics: [{ label: 'Databases', value: '15+' }, { label: 'PEP Records', value: '1.2M' }, { label: 'Accuracy', value: '99.9%' }],
  },
  {
    id: 'kyc',
    icon: Users,
    label: 'KYC Management',
    title: 'Digital KYC onboarding for UAE customers',
    desc: 'Streamline customer onboarding while meeting CBUAE Know Your Customer requirements. Emirates ID verification, document collection, and risk scoring — all automated.',
    color: 'from-purple-500 to-purple-700',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
    features: [
      'Emirates ID verification & OCR extraction',
      'Passport and trade license scanning',
      'Drag-and-drop document upload & preview',
      'Automated risk scoring (0–100)',
      'Enhanced Due Diligence workflow for PEPs',
      'KYC expiry tracking & renewal alerts',
    ],
    metrics: [{ label: 'Avg Onboarding', value: '4 min' }, { label: 'Doc Types', value: '20+' }, { label: 'Risk Accuracy', value: '97%' }],
  },
  {
    id: 'monitoring',
    icon: Activity,
    label: 'Transaction Monitoring',
    title: 'AI-powered real-time transaction surveillance',
    desc: 'Detect structuring, layering, and suspicious activity patterns across all channels. Configurable AML rules aligned with CBUAE CTR and STR requirements.',
    color: 'from-red-500 to-red-700',
    bg: 'bg-red-50 dark:bg-red-950/30',
    iconColor: 'text-red-600 dark:text-red-400',
    features: [
      'Real-time monitoring with instant alerts',
      'Cash Transaction Reporting (CTR) automation',
      'Structuring & layering pattern detection',
      'High-risk jurisdiction transaction flags',
      'Configurable AML rule engine',
      'Velocity checks & round-amount detection',
    ],
    metrics: [{ label: 'Transactions/mo', value: '3.2M+' }, { label: 'Alert Time', value: '<1sec' }, { label: 'False Positives', value: '-78%' }],
  },
  {
    id: 'accounting',
    icon: BarChart3,
    label: 'Accounting Suite',
    title: 'Complete UAE accounting — VAT, corporate tax, and more',
    desc: 'The only AML platform with a full integrated accounting module. Handle VAT 5%, Corporate Tax 9%, and all UAE financial reporting in one place.',
    color: 'from-green-500 to-green-700',
    bg: 'bg-green-50 dark:bg-green-950/30',
    iconColor: 'text-green-600 dark:text-green-400',
    features: [
      'UAE VAT 5% — automated calculation & FTA filing',
      'Corporate Tax 9% — full CT200 return preparation',
      'Invoice management with VAT-compliant templates',
      'Profit & Loss and Balance Sheet generation',
      'Expense tracking by category',
      'Multi-currency support (AED, USD, EUR)',
    ],
    metrics: [{ label: 'VAT Return', value: 'Automated' }, { label: 'Tax Rate', value: '9% CT' }, { label: 'Filing Time', value: '-90%' }],
  },
  {
    id: 'reports',
    icon: FileText,
    label: 'Reports & STR',
    title: 'STR/SAR filing and compliance reporting',
    desc: 'Generate Suspicious Transaction Reports and Suspicious Activity Reports in CBUAE-approved format. One-click submission and full audit trail.',
    color: 'from-amber-500 to-amber-700',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    features: [
      'CBUAE STR/SAR report generation',
      'Direct submission workflow to CBUAE goAML',
      'Audit log — immutable record of all actions',
      'Quarterly and annual compliance reports',
      'PDF and Excel export for regulators',
      'Role-based access — compliance officer approval workflow',
    ],
    metrics: [{ label: 'Report Types', value: '8+' }, { label: 'Filing Time', value: '5 min' }, { label: 'Audit Trail', value: '7 years' }],
  },
  {
    id: 'api',
    icon: Database,
    label: 'API & Integrations',
    title: 'Enterprise API for seamless integration',
    desc: "Connect Al Merak to your core banking system, CRM, or any internal tool. Our REST API and webhooks make integration straightforward for any technical team.",
    color: 'from-teal-500 to-teal-700',
    bg: 'bg-teal-50 dark:bg-teal-950/30',
    iconColor: 'text-teal-600 dark:text-teal-400',
    features: [
      'RESTful API with full documentation',
      'Real-time webhooks for alerts and events',
      'Sandbox environment for testing',
      'SDK libraries (Python, Node.js, PHP)',
      'Core banking system connectors',
      '99.99% uptime SLA for API endpoints',
    ],
    metrics: [{ label: 'API Uptime', value: '99.99%' }, { label: 'Response', value: '<50ms' }, { label: 'Integrations', value: '30+' }],
  },
]

export default function Features() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 gradient-navy relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-accent-600/15 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-xs font-bold text-accent-400 uppercase tracking-widest mb-4 block">Platform Features</span>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-5 leading-tight">
              Every tool your compliance team needs
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8">
              Six fully integrated modules — AML, KYC, monitoring, accounting, reporting, and API — built specifically for UAE regulatory requirements.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {modules.map(m => (
                <a
                  key={m.id}
                  href={`#${m.id}`}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-semibold rounded-lg border border-white/20 transition-all"
                >
                  {m.label}
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Module sections */}
      {modules.map((module, i) => {
        const Icon = module.icon
        const isEven = i % 2 === 0
        return (
          <section
            key={module.id}
            id={module.id}
            className={`py-24 ${isEven ? 'bg-white dark:bg-navy-950' : 'bg-slate-50 dark:bg-navy-900'}`}
          >
            <div className="max-w-7xl mx-auto px-5 sm:px-8">
              <div className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${!isEven ? 'lg:[&>*:first-child]:order-last' : ''}`}>
                {/* Text side */}
                <InView>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 ${module.bg} rounded-lg mb-5`}>
                    <Icon size={14} className={module.iconColor} />
                    <span className={`text-xs font-bold ${module.iconColor} uppercase tracking-wider`}>{module.label}</span>
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4 leading-tight">{module.title}</h2>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-7">{module.desc}</p>

                  <div className="space-y-2.5 mb-8">
                    {module.features.map(f => (
                      <div key={f} className="flex items-center gap-2.5">
                        <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                        <p className="text-sm text-slate-600 dark:text-slate-400">{f}</p>
                      </div>
                    ))}
                  </div>

                  <Link
                    to="/auth/register"
                    className="inline-flex items-center gap-2 bg-accent-600 hover:bg-accent-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm shadow-sm"
                  >
                    Try {module.label} Free
                    <ArrowRight size={14} />
                  </Link>
                </InView>

                {/* Metrics / visual side */}
                <InView>
                  <div className="space-y-4">
                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-4">
                      {module.metrics.map(m => (
                        <div key={m.label} className="bg-white dark:bg-navy-800 border border-slate-100 dark:border-navy-700 rounded-2xl p-4 text-center shadow-card">
                          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{m.value}</p>
                          <p className="text-xs text-slate-400 mt-1">{m.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Feature card */}
                    <div className="bg-white dark:bg-navy-800 border border-slate-100 dark:border-navy-700 rounded-2xl shadow-elevated overflow-hidden">
                      <div className={`h-1.5 bg-gradient-to-r ${module.color}`} />
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-10 h-10 ${module.bg} rounded-xl flex items-center justify-center`}>
                            <Icon size={18} className={module.iconColor} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{module.label}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                              <span className="text-xs text-green-600 dark:text-green-400 font-medium">Live & Active</span>
                            </div>
                          </div>
                        </div>

                        {/* Mock UI rows */}
                        <div className="space-y-2">
                          {[0.85, 0.65, 0.9, 0.4].map((w, j) => (
                            <div key={j} className="flex items-center gap-3">
                              <div className={`w-6 h-6 ${module.bg} rounded-md flex-shrink-0`} />
                              <div className="flex-1 space-y-1">
                                <div className="h-2.5 bg-slate-100 dark:bg-navy-700 rounded-full" style={{ width: `${w * 100}%` }} />
                                <div className="h-2 bg-slate-50 dark:bg-navy-750 rounded-full" style={{ width: `${w * 60}%` }} />
                              </div>
                              <div className={`px-2 py-0.5 ${module.bg} rounded-full`}>
                                <div className="h-2 w-10 bg-current opacity-30 rounded-full" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </InView>
              </div>
            </div>
          </section>
        )
      })}

      {/* Security section */}
      <section className="py-20 bg-white dark:bg-navy-950">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <InView className="text-center mb-14">
            <span className="text-xs font-bold text-accent-600 uppercase tracking-widest mb-3 block">Security & Trust</span>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">Enterprise-grade security</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-sm">
              Your data and your clients' data is protected by the highest security standards in the industry.
            </p>
          </InView>
          <InViewGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Lock, title: 'AES-256 Encryption', desc: 'All data encrypted at rest and in transit using military-grade encryption.' },
              { icon: Globe, title: 'UAE Data Residency', desc: 'All data stored in Microsoft Azure UAE North data centers. Never leaves the UAE.' },
              { icon: Shield, title: 'ISO 27001 Certified', desc: 'Independently audited information security management system.' },
              { icon: Zap, title: '99.99% Uptime', desc: 'Enterprise SLA with 24/7 monitoring and automatic failover.' },
            ].map(s => {
              const Icon = s.icon
              return (
                <motion.div key={s.title} variants={fadeUp} className="bg-slate-50 dark:bg-navy-800 border border-slate-100 dark:border-navy-700 rounded-2xl p-5">
                  <div className="w-10 h-10 bg-accent-100 dark:bg-accent-950/40 rounded-xl flex items-center justify-center mb-4">
                    <Icon size={18} className="text-accent-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">{s.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{s.desc}</p>
                </motion.div>
              )
            })}
          </InViewGroup>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 gradient-navy relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <InView>
            <h2 className="text-3xl font-bold text-white mb-4">Ready to see it in action?</h2>
            <p className="text-slate-300 mb-8">Start your 14-day free trial — no credit card, no commitment.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/auth/register" className="flex items-center justify-center gap-2 bg-white text-navy-900 font-bold px-6 py-3 rounded-xl hover:bg-slate-100 transition-all text-sm">
                Start Free Trial <ArrowRight size={16} />
              </Link>
              <Link to="/contact" className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold px-6 py-3 rounded-xl border border-white/20 transition-all text-sm">
                Request Demo
              </Link>
            </div>
          </InView>
        </div>
      </section>
    </>
  )
}
