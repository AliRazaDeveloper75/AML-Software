import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import {
  Shield, Target, Heart, Globe, Users, Award,
  ArrowRight, Linkedin, CheckCircle, TrendingUp
} from 'lucide-react'

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }
function InView({ children, className }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return <motion.div ref={ref} variants={fadeUp} initial="hidden" animate={inView ? 'show' : 'hidden'} className={className}>{children}</motion.div>
}

const values = [
  { icon: Shield, title: 'Integrity First', desc: 'We build tools that make financial systems safer. Every feature we ship serves compliance, not convenience at the expense of it.', color: 'bg-blue-100 dark:bg-blue-950/40 text-blue-600' },
  { icon: Target, title: 'Precision', desc: 'AML compliance requires zero tolerance for error. Our screening algorithms are tuned for maximum accuracy with minimum false positives.', color: 'bg-purple-100 dark:bg-purple-950/40 text-purple-600' },
  { icon: Heart, title: 'Client Success', desc: 'Our clients are compliance officers, accountants, and risk managers. We obsess over their daily workflows so they can focus on what matters.', color: 'bg-red-100 dark:bg-red-950/40 text-red-600' },
  { icon: Globe, title: 'UAE Expertise', desc: "We're UAE-native. We know CBUAE regulations, DIFC rules, and FTA requirements intimately — because we live and work under them too.", color: 'bg-green-100 dark:bg-green-950/40 text-green-600' },
]

const team = [
  { name: 'Sara Al Zaabi', title: 'Founder & CEO', bg: 'from-accent-500 to-purple-600', initials: 'SZ', bio: 'Former CBUAE examiner with 15 years in AML regulation. Built Al Merak to solve the compliance gaps she saw every day.', linkedin: '#' },
  { name: 'Ahmed Al Rashid', title: 'CTO', bg: 'from-blue-500 to-accent-600', initials: 'AR', bio: 'Ex-Google engineer. Leads the technology platform, AI screening engine, and cloud infrastructure.', linkedin: '#' },
  { name: 'Fatima Hassan', title: 'Chief Compliance Officer', bg: 'from-purple-500 to-pink-600', initials: 'FH', bio: 'CAMS certified. 12 years at Emirates NBD compliance. Ensures every feature meets regulatory standards.', linkedin: '#' },
  { name: 'Mohammed Al Ali', title: 'Head of Product', bg: 'from-green-500 to-teal-600', initials: 'MA', bio: 'Former compliance technology lead at Mashreq. Translates regulatory requirements into elegant product experiences.', linkedin: '#' },
  { name: 'Priya Sharma', title: 'Head of Engineering', bg: 'from-amber-500 to-orange-600', initials: 'PS', bio: 'Full-stack architect specializing in fintech and real-time systems. Previously at Stripe and Revolut.', linkedin: '#' },
  { name: 'Khalid Al Ameri', title: 'VP Sales & Partnerships', bg: 'from-teal-500 to-blue-600', initials: 'KA', bio: 'Built enterprise SaaS partnerships across the Gulf. Connects Al Merak with the financial institutions that need it most.', linkedin: '#' },
]

const milestones = [
  { year: '2020', event: 'Founded in Dubai by former CBUAE regulators with a mission to modernize AML compliance in the UAE.' },
  { year: '2021', event: 'Launched core AML screening and KYC platform. First 50 clients onboarded across banking and trading sectors.' },
  { year: '2022', event: 'Integrated UAE VAT reporting and launched real-time transaction monitoring. Series A funding secured.' },
  { year: '2023', event: 'Added Corporate Tax module ahead of UAE CT law. Expanded to 500+ clients. DIFC Innovation Hub member.' },
  { year: '2024', event: 'Launched AI-powered adverse media monitoring and API platform. Reached 1,000+ active clients.' },
  { year: '2025', event: 'Serving 1,200+ UAE businesses. Processing 3.2M+ transactions monthly. ISO 27001 certification achieved.' },
]

export default function About() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 gradient-navy relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-accent-600/15 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-block text-xs font-bold text-accent-400 uppercase tracking-widest mb-4">About Al Merak</span>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
              Fighting financial crime, <br />one transaction at a time
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Al Merak was founded by former UAE regulators and fintech engineers who saw firsthand how manual compliance processes were leaving financial institutions exposed. We built the platform we always wished existed.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-white dark:bg-navy-950">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <InView>
              <span className="text-xs font-bold text-accent-600 uppercase tracking-widest mb-3 block">Our Mission</span>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-5">
                Protecting the UAE financial system from illicit finance
              </h2>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-5">
                Financial crime costs the global economy over $3 trillion annually. In the UAE, as a major global financial hub, the stakes are especially high. Al Merak exists to give every regulated entity — from global banks to small money exchange houses — the same world-class compliance capabilities.
              </p>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
                We combine deep UAE regulatory expertise with cutting-edge technology to make compliance faster, more accurate, and more affordable for every business that needs it.
              </p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Founded', value: '2020', sub: 'Dubai, UAE' },
                  { label: 'Clients', value: '1,200+', sub: 'Across the GCC' },
                  { label: 'Team', value: '85+', sub: 'Compliance experts' },
                ].map(s => (
                  <div key={s.label} className="text-center p-3 bg-slate-50 dark:bg-navy-800 rounded-xl">
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{s.value}</p>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
                    <p className="text-xs text-slate-400">{s.sub}</p>
                  </div>
                ))}
              </div>
            </InView>

            <InView>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-accent-500/10 to-purple-500/10 rounded-3xl transform rotate-3" />
                <div className="relative bg-white dark:bg-navy-800 border border-slate-100 dark:border-navy-700 rounded-2xl p-7 shadow-elevated">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-accent-100 dark:bg-accent-950/40 rounded-2xl flex items-center justify-center">
                      <Award size={24} className="text-accent-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">Recognition & Certifications</p>
                      <p className="text-xs text-slate-400">Industry leading standards</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'CBUAE Licensed Compliance Technology Provider', icon: CheckCircle },
                      { label: 'ISO 27001 Information Security Certified', icon: CheckCircle },
                      { label: 'DIFC Innovation Hub Member 2023', icon: CheckCircle },
                      { label: 'ACAMS Regional Partner — GCC Chapter', icon: CheckCircle },
                      { label: 'UAE FinTech Forum — Best Compliance Solution 2024', icon: Award },
                      { label: 'Top 10 RegTech Startups — MEA Region 2024', icon: TrendingUp },
                    ].map(item => {
                      const Icon = item.icon
                      return (
                        <div key={item.label} className="flex items-center gap-3">
                          <Icon size={15} className="text-green-500 flex-shrink-0" />
                          <p className="text-sm text-slate-600 dark:text-slate-400">{item.label}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </InView>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-slate-50 dark:bg-navy-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <InView className="text-center mb-14">
            <span className="text-xs font-bold text-accent-600 uppercase tracking-widest mb-3 block">Our Values</span>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">What drives us</h2>
          </InView>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {values.map((v) => {
              const Icon = v.icon
              return (
                <InView key={v.title}>
                  <div className="bg-white dark:bg-navy-800 border border-slate-100 dark:border-navy-700 rounded-2xl p-6 flex gap-4 hover:shadow-elevated transition-all duration-200">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${v.color}`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">{v.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{v.desc}</p>
                    </div>
                  </div>
                </InView>
              )
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-white dark:bg-navy-950">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <InView className="text-center mb-14">
            <span className="text-xs font-bold text-accent-600 uppercase tracking-widest mb-3 block">Our Journey</span>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Building since 2020</h2>
          </InView>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200 dark:bg-navy-700" />
            <div className="space-y-8">
              {milestones.map((m, i) => (
                <InView key={m.year}>
                  <div className="flex gap-6">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 bg-accent-600 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm z-10 relative">
                        {m.year}
                      </div>
                    </div>
                    <div className="flex-1 pb-2 pt-2">
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{m.event}</p>
                    </div>
                  </div>
                </InView>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section id="team" className="py-20 bg-slate-50 dark:bg-navy-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <InView className="text-center mb-14">
            <span className="text-xs font-bold text-accent-600 uppercase tracking-widest mb-3 block">Leadership</span>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">Meet the team</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-sm">
              Regulators, engineers, and compliance professionals united by a common mission.
            </p>
          </InView>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {team.map((member) => (
              <InView key={member.name}>
                <div className="bg-white dark:bg-navy-800 border border-slate-100 dark:border-navy-700 rounded-2xl p-6 hover:shadow-elevated transition-all duration-200 group">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-14 h-14 bg-gradient-to-br ${member.bg} rounded-2xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0`}>
                      {member.initials}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{member.name}</p>
                      <p className="text-xs text-accent-600 dark:text-accent-400 font-semibold">{member.title}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{member.bio}</p>
                  <a href={member.linkedin} className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-accent-600 transition-colors mt-4 font-medium">
                    <Linkedin size={13} /> LinkedIn
                  </a>
                </div>
              </InView>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 gradient-navy relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <InView>
            <h2 className="text-3xl font-bold text-white mb-4">Join the Al Merak community</h2>
            <p className="text-slate-300 mb-8">Whether you're a bank, exchange house, or accounting firm — we have a plan for you.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/auth/register" className="flex items-center justify-center gap-2 bg-white text-navy-900 font-bold px-6 py-3 rounded-xl hover:bg-slate-100 transition-all text-sm">
                Get Started <ArrowRight size={16} />
              </Link>
              <Link to="/contact" className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold px-6 py-3 rounded-xl border border-white/20 transition-all text-sm">
                Contact Us
              </Link>
            </div>
          </InView>
        </div>
      </section>
    </>
  )
}
