import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import {
  Shield, AlertTriangle, Users, BarChart3, FileText, Activity,
  CheckCircle, ArrowRight, ChevronRight, Zap, Globe, Lock,
  TrendingUp, Eye, Database, Clock, Star, Building2
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const stagger = {
  show: { transition: { staggerChildren: 0.1 } },
}

function InView({ children, className }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function InViewGroup({ children, className }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const features = [
  {
    icon: Shield,
    title: 'AML Screening',
    desc: 'Real-time PEP, sanctions, and watchlist screening against 15+ global databases including OFAC, UN Security Council, and CBUAE lists.',
    color: 'from-blue-500 to-blue-700',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    iconColor: 'text-blue-600',
  },
  {
    icon: Users,
    title: 'Digital KYC',
    desc: 'Streamline customer onboarding with Emirates ID verification, document upload, risk scoring, and automated compliance workflows.',
    color: 'from-purple-500 to-purple-700',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    iconColor: 'text-purple-600',
  },
  {
    icon: Activity,
    title: 'Transaction Monitoring',
    desc: 'AI-powered real-time surveillance detecting structuring, layering, and suspicious patterns across all transaction channels.',
    color: 'from-red-500 to-red-700',
    bg: 'bg-red-50 dark:bg-red-950/30',
    iconColor: 'text-red-600',
  },
  {
    icon: BarChart3,
    title: 'Accounting Suite',
    desc: 'Complete UAE accounting with VAT 5% reporting, Corporate Tax 9% calculations, P&L, balance sheet, and FTA-ready returns.',
    color: 'from-green-500 to-green-700',
    bg: 'bg-green-50 dark:bg-green-950/30',
    iconColor: 'text-green-600',
  },
  {
    icon: FileText,
    title: 'STR/SAR Reporting',
    desc: 'Generate and submit Suspicious Transaction Reports directly to CBUAE. Full audit trail and regulatory documentation.',
    color: 'from-amber-500 to-amber-700',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    iconColor: 'text-amber-600',
  },
  {
    icon: Eye,
    title: 'Compliance Dashboard',
    desc: 'Unified view of your compliance posture, risk exposure, and regulatory obligations across FATF, CBUAE, and international frameworks.',
    color: 'from-teal-500 to-teal-700',
    bg: 'bg-teal-50 dark:bg-teal-950/30',
    iconColor: 'text-teal-600',
  },
]

const stats = [
  { value: '1,200+', label: 'Clients Protected', sub: 'Across the UAE' },
  { value: '99.98%', label: 'Uptime SLA', sub: 'Enterprise grade' },
  { value: '3.2M+', label: 'Transactions Monitored', sub: 'Every month' },
  { value: '97.8%', label: 'Compliance Rate', sub: 'Across all clients' },
]

const steps = [
  {
    num: '01',
    title: 'Onboard & Configure',
    desc: 'Set up your company profile, configure AML rules per CBUAE guidelines, and connect your data sources in under an hour.',
    icon: Building2,
  },
  {
    num: '02',
    title: 'Screen & Monitor',
    desc: 'Every customer and transaction is automatically screened against global watchlists and AML rules in real time.',
    icon: Eye,
  },
  {
    num: '03',
    title: 'Report & Comply',
    desc: 'Generate STRs, file VAT returns, and produce audit-ready compliance reports for regulators at the click of a button.',
    icon: FileText,
  },
]

const testimonials = [
  {
    quote: "Al Merak transformed our compliance operations. What used to take three analysts a full week now runs automatically. The CBUAE reporting alone saves us dozens of hours each quarter.",
    name: "Fatima Al Mansoori",
    title: "Chief Compliance Officer",
    company: "Emirates Capital Group",
    initials: "FM",
  },
  {
    quote: "The AML screening accuracy is exceptional. We reduced false positives by 78% compared to our previous solution, and the sanctions matching is instant.",
    name: "Ahmed Al Hashimi",
    title: "Head of Risk",
    company: "Gulf Commercial Bank",
    initials: "AH",
  },
  {
    quote: "Best investment we made. The integrated VAT and corporate tax module means we have one platform for everything — compliance, KYC, and full accounting.",
    name: "Sarah Johnson",
    title: "Finance Director",
    company: "Al Noor International FZCO",
    initials: "SJ",
  },
]

const trustedBy = [
  'Emirates NBD', 'Mashreq Bank', 'RAK Bank', 'ADIB', 'Al Hilal Bank', 'Commercial Bank of Dubai'
]

const complianceItems = [
  { label: 'CBUAE AML Framework', icon: Shield },
  { label: 'FATF 40 Recommendations', icon: Globe },
  { label: 'UAE Federal AML Law', icon: FileText },
  { label: 'DIFC / ADGM Regulations', icon: Building2 },
  { label: 'UN Security Council Sanctions', icon: Lock },
  { label: 'UAE Corporate Tax Law', icon: TrendingUp },
]

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden gradient-navy">
        {/* Grid background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />

        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 py-24 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-accent-600/20 border border-accent-500/30 text-accent-300 text-xs font-semibold px-4 py-2 rounded-full mb-8"
          >
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Trusted by 1,200+ UAE businesses · CBUAE Licensed
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6"
          >
            Enterprise AML Compliance
            <br />
            <span className="text-gradient bg-gradient-to-r from-accent-400 to-purple-400" style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Built for the UAE
            </span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            The complete platform for AML screening, digital KYC, transaction monitoring, and UAE accounting — all in one place. Stay compliant with CBUAE, FATF, and FTA requirements.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12"
          >
            <Link
              to="/auth/register"
              className="flex items-center gap-2 bg-accent-600 hover:bg-accent-700 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-sm"
            >
              Start Free Trial
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/features"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold px-6 py-3 rounded-xl transition-all border border-white/20 text-sm"
            >
              Explore Features
              <ChevronRight size={16} />
            </Link>
          </motion.div>

          {/* Trust signals */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-6 text-slate-400 text-xs"
          >
            {['No credit card required', '14-day free trial', 'CBUAE compliant', 'ISO 27001 certified'].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <CheckCircle size={12} className="text-green-400" />
                {item}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl px-8 hidden lg:block"
        >
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-t-2xl p-3 mx-auto shadow-2xl">
            {/* Fake browser chrome */}
            <div className="flex items-center gap-2 mb-3 px-1">
              {['bg-red-400', 'bg-amber-400', 'bg-green-400'].map(c => (
                <div key={c} className={`w-3 h-3 ${c} rounded-full opacity-60`} />
              ))}
              <div className="flex-1 bg-white/10 rounded-md h-5 mx-2" />
            </div>
            {/* Dashboard preview */}
            <div className="bg-slate-50 dark:bg-navy-900 rounded-xl p-4 grid grid-cols-4 gap-3">
              {[
                { label: 'Total Customers', value: '1,872', color: 'text-blue-600' },
                { label: 'AML Alerts', value: '34', color: 'text-red-600' },
                { label: 'Monthly Revenue', value: 'AED 920K', color: 'text-green-600' },
                { label: 'Compliance Score', value: '97.8%', color: 'text-purple-600' },
              ].map(card => (
                <div key={card.label} className="bg-white dark:bg-navy-800 rounded-lg p-3 border border-slate-100 dark:border-navy-700">
                  <p className="text-xs text-slate-400 mb-1">{card.label}</p>
                  <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Trusted By */}
      <section className="bg-slate-50 dark:bg-navy-900 border-y border-slate-100 dark:border-navy-800 py-10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-8">
            Trusted by leading UAE financial institutions
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {trustedBy.map((name) => (
              <div key={name} className="px-5 py-2 bg-white dark:bg-navy-800 rounded-lg border border-slate-100 dark:border-navy-700 shadow-card">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-white dark:bg-navy-950">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <InViewGroup className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <motion.div key={stat.value} variants={fadeUp} className="text-center">
                <p className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-1">{stat.value}</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{stat.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{stat.sub}</p>
              </motion.div>
            ))}
          </InViewGroup>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-slate-50 dark:bg-navy-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <InView className="text-center mb-16">
            <span className="inline-block text-xs font-bold text-accent-600 uppercase tracking-widest mb-3">Platform Features</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Everything compliance teams need
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              From customer onboarding to regulatory reporting — Al Merak covers every step of your compliance workflow.
            </p>
          </InView>

          <InViewGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <motion.div
                  key={f.title}
                  variants={fadeUp}
                  className="bg-white dark:bg-navy-800 border border-slate-100 dark:border-navy-700 rounded-2xl p-6 hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  <div className={`w-11 h-11 ${f.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                    <Icon size={20} className={f.iconColor} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                  <Link to="/features" className="inline-flex items-center gap-1 text-xs text-accent-600 font-semibold mt-4 hover:gap-2 transition-all">
                    Learn more <ChevronRight size={12} />
                  </Link>
                </motion.div>
              )
            })}
          </InViewGroup>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-white dark:bg-navy-950">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <InView className="text-center mb-16">
            <span className="inline-block text-xs font-bold text-accent-600 uppercase tracking-widest mb-3">How It Works</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Up and running in hours
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              No lengthy implementations. Al Merak is cloud-native and designed for rapid deployment.
            </p>
          </InView>

          <InViewGroup className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div key={step.num} variants={fadeUp} className="relative text-center">
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-full w-full h-px border-t-2 border-dashed border-slate-200 dark:border-navy-700 z-0" style={{ width: 'calc(100% - 2rem)' }} />
                  )}
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-accent-700 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                      <Icon size={26} className="text-white" />
                    </div>
                    <span className="text-xs font-bold text-accent-600 uppercase tracking-widest">{step.num}</span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1 mb-3">{step.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">{step.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </InViewGroup>
        </div>
      </section>

      {/* Compliance coverage */}
      <section className="py-24 bg-slate-50 dark:bg-navy-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <InView>
              <span className="inline-block text-xs font-bold text-accent-600 uppercase tracking-widest mb-3">Regulatory Coverage</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-5">
                Built for UAE regulatory requirements
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                Al Merak is purpose-built for the UAE regulatory landscape. Stay ahead of CBUAE circulars, FATF recommendations, and FTA requirements — all updated automatically.
              </p>
              <div className="space-y-3">
                {complianceItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-950/40 rounded-lg flex items-center justify-center flex-shrink-0">
                        <CheckCircle size={15} className="text-green-600" />
                      </div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.label}</p>
                    </div>
                  )
                })}
              </div>
            </InView>

            <InView>
              <div className="bg-white dark:bg-navy-800 rounded-2xl border border-slate-100 dark:border-navy-700 shadow-elevated overflow-hidden">
                {/* Mock compliance dashboard */}
                <div className="px-5 py-4 border-b border-slate-100 dark:border-navy-700 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Compliance Status</p>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Live
                  </span>
                </div>
                {[
                  { name: 'CBUAE AML Guidelines', score: 100, color: '#10b981' },
                  { name: 'FATF Recommendations', score: 100, color: '#10b981' },
                  { name: 'OFAC SDN Screening', score: 95, color: '#f59e0b' },
                  { name: 'UAE VAT Compliance', score: 100, color: '#10b981' },
                  { name: 'Corporate Tax (9%)', score: 88, color: '#f59e0b' },
                  { name: 'STR/SAR Reporting', score: 92, color: '#f59e0b' },
                ].map((item) => (
                  <div key={item.name} className="px-5 py-3 border-b border-slate-50 dark:border-navy-700 last:border-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{item.name}</p>
                      <p className="text-xs font-bold" style={{ color: item.color }}>{item.score}%</p>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-navy-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${item.score}%`, background: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </InView>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white dark:bg-navy-950">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <InView className="text-center mb-14">
            <span className="inline-block text-xs font-bold text-accent-600 uppercase tracking-widest mb-3">Client Stories</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">
              Trusted by compliance professionals
            </h2>
          </InView>
          <InViewGroup className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                className="bg-slate-50 dark:bg-navy-800 border border-slate-100 dark:border-navy-700 rounded-2xl p-6 flex flex-col gap-4"
              >
                <div className="flex items-center gap-1 mb-1">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed flex-1">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-navy-700">
                  <div className="w-9 h-9 bg-gradient-to-br from-accent-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.title} · {t.company}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </InViewGroup>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24 gradient-navy relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 bg-accent-600/20 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 text-center">
          <InView>
            <span className="inline-flex items-center gap-2 bg-accent-600/20 border border-accent-500/30 text-accent-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
              <Zap size={12} />
              14-day free trial · No credit card required
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-5">
              Ready to transform your compliance operations?
            </h2>
            <p className="text-slate-300 mb-8 max-w-xl mx-auto leading-relaxed">
              Join 1,200+ UAE businesses that trust Al Merak AML to manage their compliance, KYC, and accounting workflows.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/auth/register"
                className="flex items-center justify-center gap-2 bg-white text-navy-900 font-bold px-7 py-3.5 rounded-xl hover:bg-slate-100 transition-all shadow-lg hover:-translate-y-0.5 text-sm"
              >
                Start Free Trial
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/contact"
                className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold px-7 py-3.5 rounded-xl border border-white/20 transition-all text-sm"
              >
                Talk to Sales
              </Link>
            </div>
          </InView>
        </div>
      </section>
    </>
  )
}
