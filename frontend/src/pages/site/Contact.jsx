import { useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Mail, Phone, MapPin, Clock, Send, MessageCircle,
  Building2, Shield, CheckCircle, ChevronDown
} from 'lucide-react'
import Button from '../../components/common/Button'
import clsx from 'clsx'

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }
function InView({ children, className }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return <motion.div ref={ref} variants={fadeUp} initial="hidden" animate={inView ? 'show' : 'hidden'} className={className}>{children}</motion.div>
}

const contactOptions = [
  { icon: MessageCircle, label: 'Sales enquiry', desc: 'Talk to our team about plans and pricing', color: 'bg-accent-100 dark:bg-accent-950/40 text-accent-600' },
  { icon: Shield, label: 'Compliance demo', desc: 'See the platform with your own use case', color: 'bg-purple-100 dark:bg-purple-950/40 text-purple-600' },
  { icon: Building2, label: 'Enterprise', desc: 'Custom solutions for banks and large institutions', color: 'bg-green-100 dark:bg-green-950/40 text-green-600' },
]

const offices = [
  {
    city: 'Dubai (HQ)',
    address: 'Gate Village 4, DIFC\nDubai, UAE 506514',
    phone: '+971 4 200 0000',
    email: 'dubai@almerak.ae',
    hours: 'Sun–Thu, 8:00 AM – 6:00 PM GST',
  },
  {
    city: 'Abu Dhabi',
    address: 'Al Maryah Island\nADGM Square, Abu Dhabi',
    phone: '+971 2 300 0000',
    email: 'abudhabi@almerak.ae',
    hours: 'Sun–Thu, 8:00 AM – 5:00 PM GST',
  },
]

const faqs = [
  { q: 'How long does onboarding take?', a: "Most clients are fully onboarded within 1–5 business days. Our Customer Success team handles all data migration and initial configuration." },
  { q: 'Is Al Merak CBUAE approved?', a: "Yes. Al Merak is a licensed compliance technology provider under the Central Bank of the UAE framework. We update our platform with every CBUAE circular." },
  { q: 'Can we integrate with our existing banking system?', a: "Yes. We offer REST API and webhook integrations. Our team can work with your IT department to connect Al Merak to your core banking system, CRM, or ERP." },
  { q: 'What happens to our data?', a: "All data is stored in UAE-based cloud infrastructure (Microsoft Azure UAE North). We are ISO 27001 certified and GDPR compliant. You retain full ownership of your data." },
  { q: 'Do you offer a free trial?', a: "Yes — all plans include a 14-day free trial with no credit card required. You get full access to all features during the trial period." },
]

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', subject: 'Sales enquiry', message: '' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    setLoading(false)
    setSent(true)
  }

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 gradient-navy relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-accent-600/20 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-xs font-bold text-accent-400 uppercase tracking-widest mb-4 block">Get In Touch</span>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-5">Let's talk compliance</h1>
            <p className="text-slate-300 text-lg leading-relaxed">
              Our team of UAE compliance experts is here to help. Whether you need a demo, have a technical question, or want to discuss enterprise pricing — we're ready.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact options */}
      <section className="py-12 bg-slate-50 dark:bg-navy-900 border-b border-slate-100 dark:border-navy-800">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {contactOptions.map((opt) => {
              const Icon = opt.icon
              return (
                <InView key={opt.label}>
                  <button
                    onClick={() => setForm(f => ({ ...f, subject: opt.label }))}
                    className={clsx(
                      'w-full flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left',
                      form.subject === opt.label
                        ? 'border-accent-500 bg-accent-50 dark:bg-accent-950/20'
                        : 'border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 hover:border-accent-300'
                    )}
                  >
                    <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', opt.color)}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{opt.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{opt.desc}</p>
                    </div>
                  </button>
                </InView>
              )
            })}
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="py-20 bg-white dark:bg-navy-950">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-14">
            {/* Form */}
            <div className="lg:col-span-3">
              <InView>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Send us a message</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-7">We respond within 1 business hour during UAE working hours.</p>
              </InView>

              {sent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-2xl p-10 text-center"
                >
                  <div className="w-14 h-14 bg-green-100 dark:bg-green-950/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={28} className="text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Message sent!</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    Thank you, <strong>{form.name}</strong>. Our team will get back to you at <strong>{form.email}</strong> within 1 business hour.
                  </p>
                  <button onClick={() => { setSent(false); setForm({ name: '', email: '', company: '', phone: '', subject: 'Sales enquiry', message: '' }) }} className="text-sm text-accent-600 hover:text-accent-700 font-medium">
                    Send another message
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name *</label>
                      <input type="text" value={form.name} onChange={set('name')} required placeholder="Mohammed Al Rashid" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Work Email *</label>
                      <input type="email" value={form.email} onChange={set('email')} required placeholder="you@company.ae" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Company Name</label>
                      <input type="text" value={form.company} onChange={set('company')} placeholder="Emirates Trading LLC" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Phone Number</label>
                      <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+971 50 000 0000" className="input-field" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Subject *</label>
                    <select value={form.subject} onChange={set('subject')} className="input-field">
                      <option>Sales enquiry</option>
                      <option>Compliance demo</option>
                      <option>Enterprise</option>
                      <option>Technical support</option>
                      <option>Partnership</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Message *</label>
                    <textarea
                      rows={5}
                      value={form.message}
                      onChange={set('message')}
                      required
                      placeholder="Tell us about your compliance requirements, company size, and how we can help..."
                      className="input-field resize-none"
                    />
                  </div>
                  <div className="flex items-start gap-2">
                    <input type="checkbox" required id="privacy" className="rounded border-slate-300 text-accent-600 mt-0.5" />
                    <label htmlFor="privacy" className="text-xs text-slate-500 dark:text-slate-400">
                      I agree to Al Merak's <a href="#" className="text-accent-600 hover:underline">Privacy Policy</a> and consent to being contacted about my enquiry.
                    </label>
                  </div>
                  <Button type="submit" loading={loading} icon={Send} className="w-full justify-center py-3">
                    Send Message
                  </Button>
                </form>
              )}
            </div>

            {/* Info sidebar */}
            <div className="lg:col-span-2 space-y-6">
              {/* Offices */}
              {offices.map((office) => (
                <InView key={office.city}>
                  <div className="bg-slate-50 dark:bg-navy-800 border border-slate-100 dark:border-navy-700 rounded-2xl p-5">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">{office.city}</p>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <MapPin size={14} className="text-accent-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-500 dark:text-slate-400 whitespace-pre-line">{office.address}</p>
                      </div>
                      <a href={`tel:${office.phone}`} className="flex items-center gap-3 hover:text-accent-600 transition-colors">
                        <Phone size={14} className="text-accent-500 flex-shrink-0" />
                        <p className="text-xs text-slate-500 dark:text-slate-400">{office.phone}</p>
                      </a>
                      <a href={`mailto:${office.email}`} className="flex items-center gap-3 hover:text-accent-600 transition-colors">
                        <Mail size={14} className="text-accent-500 flex-shrink-0" />
                        <p className="text-xs text-slate-500 dark:text-slate-400">{office.email}</p>
                      </a>
                      <div className="flex items-center gap-3">
                        <Clock size={14} className="text-accent-500 flex-shrink-0" />
                        <p className="text-xs text-slate-500 dark:text-slate-400">{office.hours}</p>
                      </div>
                    </div>
                  </div>
                </InView>
              ))}

              {/* Response time */}
              <InView>
                <div className="bg-accent-600 rounded-2xl p-5 text-white">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <p className="text-xs font-semibold opacity-90">Team Online Now</p>
                  </div>
                  <p className="text-sm font-bold mb-1">Average response time</p>
                  <p className="text-2xl font-bold mb-3">&lt; 1 hour</p>
                  <p className="text-xs opacity-70">During UAE business hours (Sun–Thu, 8 AM–6 PM GST)</p>
                </div>
              </InView>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 bg-slate-50 dark:bg-navy-900">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <InView className="text-center mb-12">
            <span className="text-xs font-bold text-accent-600 uppercase tracking-widest mb-3 block">FAQs</span>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Frequently asked questions</h2>
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
                      exit={{ height: 0 }}
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
    </>
  )
}
