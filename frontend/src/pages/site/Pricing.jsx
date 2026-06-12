import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import {
  CheckCircle, XCircle, ArrowRight, Zap, Shield, Building2,
  HelpCircle, ChevronDown, Star, Users, CreditCard, Phone
} from 'lucide-react'
import clsx from 'clsx'

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }
function InView({ children, className }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return <motion.div ref={ref} variants={fadeUp} initial="hidden" animate={inView ? 'show' : 'hidden'} className={className}>{children}</motion.div>
}

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    icon: Zap,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-950/40',
    monthlyPrice: 299,
    annualPrice: 249,
    description: 'For small businesses and startups getting compliant.',
    highlight: false,
    badge: null,
    features: {
      included: [
        'Up to 200 KYC screenings/month',
        'AML sanctions screening',
        'Basic transaction monitoring',
        'VAT reporting (quarterly)',
        'Standard reports (PDF)',
        '2 user seats',
        'Email support',
        '99.5% uptime SLA',
        '14-day free trial',
      ],
      excluded: [
        'Corporate Tax module',
        'Real-time monitoring',
        'API access',
        'Custom watchlists',
        'Priority support',
        'Custom integrations',
        'Dedicated account manager',
        'White-label options',
      ],
    },
    cta: 'Start Free Trial',
    ctaLink: '/auth/register',
  },
  {
    id: 'professional',
    name: 'Professional',
    icon: Shield,
    color: 'text-accent-500',
    bgColor: 'bg-accent-100 dark:bg-accent-950/40',
    monthlyPrice: 799,
    annualPrice: 649,
    description: 'For regulated entities with full compliance requirements.',
    highlight: true,
    badge: 'Most Popular',
    features: {
      included: [
        'Unlimited KYC screenings',
        'AML + PEP + adverse media screening',
        'Real-time transaction monitoring',
        'VAT + Corporate Tax (9%) module',
        'All report types + scheduling',
        '10 user seats',
        'API access (10K calls/month)',
        'Custom watchlists',
        'Priority email & chat support',
        '99.9% uptime SLA',
        '14-day free trial',
      ],
      excluded: [
        'Unlimited API calls',
        'Dedicated account manager',
        'Custom integrations',
        'White-label options',
        'On-site training',
      ],
    },
    cta: 'Start Free Trial',
    ctaLink: '/auth/register',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Building2,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-950/40',
    monthlyPrice: null,
    annualPrice: null,
    description: 'For banks, financial institutions, and large enterprises.',
    highlight: false,
    badge: null,
    features: {
      included: [
        'Unlimited everything',
        'Full AML / KYC / screening suite',
        'Advanced AI risk scoring',
        'Unlimited API calls',
        'Custom integrations (core banking, CRM)',
        'Unlimited user seats',
        'Dedicated account manager',
        'On-site training & onboarding',
        'White-label available',
        'Custom SLA (99.99%)',
        'CBUAE regulatory reporting',
        'Regulatory update guarantee',
      ],
      excluded: [],
    },
    cta: 'Contact Sales',
    ctaLink: '/contact',
  },
]

const featureComparison = [
  { category: 'KYC & Screening', features: [
    { name: 'KYC screenings per month', starter: '200', professional: 'Unlimited', enterprise: 'Unlimited' },
    { name: 'AML sanctions screening', starter: true, professional: true, enterprise: true },
    { name: 'PEP screening', starter: false, professional: true, enterprise: true },
    { name: 'Adverse media monitoring', starter: false, professional: true, enterprise: true },
    { name: 'Custom watchlists', starter: false, professional: true, enterprise: true },
    { name: 'AI risk scoring', starter: false, professional: false, enterprise: true },
  ]},
  { category: 'Transaction Monitoring', features: [
    { name: 'Transaction monitoring', starter: 'Basic', professional: 'Real-time', enterprise: 'Real-time + AI' },
    { name: 'Suspicious activity alerts', starter: true, professional: true, enterprise: true },
    { name: 'AML rule customization', starter: false, professional: true, enterprise: true },
    { name: 'Pattern detection', starter: false, professional: false, enterprise: true },
  ]},
  { category: 'Accounting & Tax', features: [
    { name: 'UAE VAT reporting (5%)', starter: true, professional: true, enterprise: true },
    { name: 'Corporate Tax (9%) module', starter: false, professional: true, enterprise: true },
    { name: 'Invoicing', starter: true, professional: true, enterprise: true },
    { name: 'Profit & Loss statement', starter: false, professional: true, enterprise: true },
    { name: 'Balance sheet', starter: false, professional: true, enterprise: true },
  ]},
  { category: 'Reporting & API', features: [
    { name: 'Compliance reports', starter: 'Standard', professional: 'All types', enterprise: 'Custom + regulatory' },
    { name: 'Scheduled report delivery', starter: false, professional: true, enterprise: true },
    { name: 'API access', starter: false, professional: '10K calls/mo', enterprise: 'Unlimited' },
    { name: 'Webhooks', starter: false, professional: true, enterprise: true },
    { name: 'Custom integrations', starter: false, professional: false, enterprise: true },
  ]},
  { category: 'Users & Support', features: [
    { name: 'User seats', starter: '2', professional: '10', enterprise: 'Unlimited' },
    { name: 'Role-based access control', starter: true, professional: true, enterprise: true },
    { name: 'Support', starter: 'Email', professional: 'Priority email & chat', enterprise: 'Dedicated manager' },
    { name: 'Uptime SLA', starter: '99.5%', professional: '99.9%', enterprise: '99.99% custom' },
    { name: 'On-site training', starter: false, professional: false, enterprise: true },
  ]},
]

const faqs = [
  { q: 'Is there a free trial?', a: 'Yes — both Starter and Professional plans include a 14-day free trial with no credit card required. You get full access to all features during the trial.' },
  { q: 'Can I switch plans at any time?', a: 'Yes. You can upgrade or downgrade your plan at any time. Upgrades take effect immediately. Downgrades take effect at the end of your current billing cycle.' },
  { q: 'What currency are the prices in?', a: 'All prices are in UAE Dirhams (AED). Payment is processed securely through our payment provider. We accept all major credit cards and bank transfers for enterprise clients.' },
  { q: 'Do you offer annual billing discounts?', a: 'Yes — switching to annual billing saves you approximately 20% compared to monthly billing. Enterprise plans are priced individually based on your requirements.' },
  { q: 'What happens after my trial ends?', a: 'You will be prompted to select a plan and add a payment method. Your data is never deleted — you can also continue at any time by selecting a plan.' },
  { q: 'Is my data secure and stored in the UAE?', a: 'Yes. All data is stored in UAE-based Microsoft Azure infrastructure (UAE North region). We are ISO 27001 certified and fully CBUAE compliant.' },
  { q: 'Do you offer custom pricing for banks?', a: 'Yes. Enterprise pricing is custom-quoted based on transaction volume, user count, integrations required, and regulatory reporting needs. Contact our sales team for a quote.' },
]

const testimonials = [
  { name: 'Hassan Al Farsi', title: 'CFO, Gulf Trading LLC', plan: 'Professional', quote: 'We evaluated four AML platforms. Al Merak was the only one that actually understood CBUAE requirements without us having to explain them.', stars: 5 },
  { name: 'Reem Al Mansoori', title: 'Compliance Head, Dubai Exchange', plan: 'Enterprise', quote: 'The Enterprise plan paid for itself in the first quarter. We reduced compliance staffing costs by 40% while improving our screening accuracy.', stars: 5 },
  { name: 'James Park', title: 'Director, Korea Trade Dubai', plan: 'Starter', quote: 'Perfect for a small trading company like ours. We went from spreadsheets to full AML compliance in under a week.', stars: 5 },
]

function FeatureCell({ value }) {
  if (value === true) return <CheckCircle size={16} className="text-green-500 mx-auto" />
  if (value === false) return <XCircle size={16} className="text-slate-300 dark:text-slate-600 mx-auto" />
  return <span className="text-xs text-slate-600 dark:text-slate-400">{value}</span>
}

export default function Pricing() {
  const [annual, setAnnual] = useState(true)
  const [openFaq, setOpenFaq] = useState(null)

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 gradient-navy relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-accent-600/20 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-xs font-bold text-accent-400 uppercase tracking-widest mb-4 block">Pricing</span>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-5">
              Simple, transparent pricing
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed mb-8">
              No hidden fees. No per-transaction charges. One flat price covers your entire compliance stack.
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-1">
              <button
                onClick={() => setAnnual(false)}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                  !annual ? 'bg-white text-navy-900' : 'text-slate-300 hover:text-white'
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2',
                  annual ? 'bg-white text-navy-900' : 'text-slate-300 hover:text-white'
                )}
              >
                Annual
                <span className="text-xs font-bold bg-green-500 text-white px-1.5 py-0.5 rounded-full">Save 20%</span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-20 bg-slate-50 dark:bg-navy-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {plans.map((plan, i) => {
              const Icon = plan.icon
              const price = annual ? plan.annualPrice : plan.monthlyPrice
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className={clsx(
                    'relative rounded-2xl border overflow-hidden',
                    plan.highlight
                      ? 'border-accent-500 shadow-2xl shadow-accent-500/20 bg-white dark:bg-navy-800 ring-2 ring-accent-500'
                      : 'border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800'
                  )}
                >
                  {plan.badge && (
                    <div className="absolute top-0 inset-x-0 text-center">
                      <span className="inline-block bg-accent-600 text-white text-xs font-bold px-4 py-1 rounded-b-lg">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className={clsx('p-7', plan.badge && 'pt-10')}>
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', plan.bgColor)}>
                        <Icon size={20} className={plan.color} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">{plan.name}</p>
                      </div>
                    </div>

                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">{plan.description}</p>

                    {/* Price */}
                    <div className="mb-6">
                      {price ? (
                        <div className="flex items-end gap-1">
                          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1.5">AED</span>
                          <span className="text-4xl font-bold text-slate-900 dark:text-slate-100">{price.toLocaleString()}</span>
                          <span className="text-sm text-slate-400 mb-1.5">/month</span>
                        </div>
                      ) : (
                        <div>
                          <p className="text-4xl font-bold text-slate-900 dark:text-slate-100">Custom</p>
                          <p className="text-sm text-slate-400 mt-1">Tailored to your institution</p>
                        </div>
                      )}
                      {price && annual && (
                        <p className="text-xs text-green-600 font-semibold mt-1">
                          Save AED {((plan.monthlyPrice - plan.annualPrice) * 12).toLocaleString()} annually
                        </p>
                      )}
                    </div>

                    {/* CTA */}
                    <Link
                      to={plan.ctaLink}
                      className={clsx(
                        'w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all mb-7',
                        plan.highlight
                          ? 'bg-accent-600 text-white hover:bg-accent-700 shadow-lg shadow-accent-600/25'
                          : plan.id === 'enterprise'
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-navy-900 hover:bg-slate-800 dark:hover:bg-slate-100'
                          : 'bg-slate-100 dark:bg-navy-700 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-navy-600'
                      )}
                    >
                      {plan.cta} <ArrowRight size={14} />
                    </Link>

                    {/* Features included */}
                    <div className="space-y-2.5">
                      {plan.features.included.map(f => (
                        <div key={f} className="flex items-start gap-2.5">
                          <CheckCircle size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-slate-600 dark:text-slate-400">{f}</span>
                        </div>
                      ))}
                      {plan.features.excluded.map(f => (
                        <div key={f} className="flex items-start gap-2.5 opacity-40">
                          <XCircle size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-slate-500 dark:text-slate-500 line-through">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Trust signals */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
            {[
              '14-day free trial',
              'No credit card required',
              'Cancel anytime',
              'UAE data residency',
              'CBUAE compliant',
            ].map(t => (
              <div key={t} className="flex items-center gap-1.5">
                <CheckCircle size={13} className="text-green-500" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-20 bg-white dark:bg-navy-950 overflow-x-auto">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <InView className="text-center mb-12">
            <span className="text-xs font-bold text-accent-600 uppercase tracking-widest mb-3 block">Compare Plans</span>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Everything side by side</h2>
          </InView>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-navy-700">
            <table className="w-full min-w-[600px]">
              {/* Table header */}
              <thead>
                <tr className="bg-slate-50 dark:bg-navy-800 border-b border-slate-200 dark:border-navy-700">
                  <th className="text-left px-5 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400 w-2/5">Feature</th>
                  {plans.map(plan => (
                    <th key={plan.id} className={clsx('px-4 py-4 text-center text-sm font-bold', plan.highlight ? 'text-accent-600' : 'text-slate-900 dark:text-slate-100')}>
                      {plan.name}
                      {plan.highlight && <span className="ml-1 text-xs font-normal text-accent-400">★</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureComparison.map((group) => (
                  <>
                    <tr key={group.category} className="bg-slate-50/50 dark:bg-navy-800/50">
                      <td colSpan={4} className="px-5 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {group.category}
                      </td>
                    </tr>
                    {group.features.map(feature => (
                      <tr key={feature.name} className="border-t border-slate-100 dark:border-navy-800 hover:bg-slate-50 dark:hover:bg-navy-800/50 transition-colors">
                        <td className="px-5 py-3 text-sm text-slate-700 dark:text-slate-300">{feature.name}</td>
                        <td className="px-4 py-3 text-center"><FeatureCell value={feature.starter} /></td>
                        <td className={clsx('px-4 py-3 text-center', 'bg-accent-50/30 dark:bg-accent-950/10')}><FeatureCell value={feature.professional} /></td>
                        <td className="px-4 py-3 text-center"><FeatureCell value={feature.enterprise} /></td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-slate-50 dark:bg-navy-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <InView className="text-center mb-12">
            <span className="text-xs font-bold text-accent-600 uppercase tracking-widest mb-3 block">Testimonials</span>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Trusted by UAE businesses</h2>
          </InView>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <InView key={t.name}>
                <div className="bg-white dark:bg-navy-800 border border-slate-100 dark:border-navy-700 rounded-2xl p-6">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star key={j} size={13} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-accent-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {t.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t.name}</p>
                      <p className="text-xs text-slate-400">{t.title}</p>
                    </div>
                    <div className="ml-auto">
                      <span className="text-xs font-semibold text-accent-600 bg-accent-50 dark:bg-accent-950/40 px-2 py-0.5 rounded-full">{t.plan}</span>
                    </div>
                  </div>
                </div>
              </InView>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise CTA banner */}
      <section className="py-16 bg-white dark:bg-navy-950">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <InView>
            <div className="gradient-navy rounded-3xl p-10 relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-pattern opacity-20" />
              <div className="absolute right-0 top-0 w-80 h-full bg-accent-600/10 blur-3xl" />
              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 size={18} className="text-accent-400" />
                    <span className="text-xs font-bold text-accent-400 uppercase tracking-widest">Enterprise</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3">Need a custom solution for your bank?</h2>
                  <p className="text-slate-300 text-sm leading-relaxed max-w-lg">
                    We work with banks, exchange houses, and financial institutions of all sizes. Custom API integrations, CBUAE regulatory reporting, white-label options, and dedicated support.
                  </p>
                  <div className="flex flex-wrap gap-4 mt-5">
                    {['Custom volume pricing', 'Dedicated account manager', 'On-site implementation', 'Regulatory reporting'].map(f => (
                      <div key={f} className="flex items-center gap-1.5 text-sm text-slate-300">
                        <CheckCircle size={13} className="text-accent-400" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-3 flex-shrink-0">
                  <Link to="/contact" className="flex items-center justify-center gap-2 bg-white text-navy-900 font-bold px-6 py-3 rounded-xl hover:bg-slate-100 transition-all text-sm whitespace-nowrap">
                    <Phone size={14} /> Talk to Sales
                  </Link>
                  <Link to="/contact" className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold px-6 py-3 rounded-xl border border-white/20 transition-all text-sm whitespace-nowrap">
                    Request a Demo
                  </Link>
                </div>
              </div>
            </div>
          </InView>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 bg-slate-50 dark:bg-navy-900">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <InView className="text-center mb-12">
            <span className="text-xs font-bold text-accent-600 uppercase tracking-widest mb-3 block">FAQs</span>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Pricing questions answered</h2>
          </InView>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <InView key={i}>
                <div className="bg-white dark:bg-navy-800 border border-slate-100 dark:border-navy-700 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                  >
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 pr-4">{faq.q}</p>
                    <ChevronDown size={16} className={clsx('text-slate-400 flex-shrink-0 transition-transform', openFaq === i && 'rotate-180')} />
                  </button>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      className="overflow-hidden"
                    >
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed px-5 pb-4">{faq.a}</p>
                    </motion.div>
                  )}
                </div>
              </InView>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 gradient-navy relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <InView>
            <h2 className="text-3xl font-bold text-white mb-4">Start your free trial today</h2>
            <p className="text-slate-300 mb-8 text-sm leading-relaxed">
              14 days free. No credit card. Cancel anytime. Full platform access from day one.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/auth/register" className="flex items-center justify-center gap-2 bg-white text-navy-900 font-bold px-6 py-3 rounded-xl hover:bg-slate-100 transition-all text-sm">
                Start Free Trial <ArrowRight size={16} />
              </Link>
              <Link to="/contact" className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold px-6 py-3 rounded-xl border border-white/20 transition-all text-sm">
                Talk to Sales
              </Link>
            </div>
            <p className="text-slate-400 text-xs mt-6">
              Serving 1,200+ UAE businesses · CBUAE Licensed · ISO 27001 Certified
            </p>
          </InView>
        </div>
      </section>
    </>
  )
}
