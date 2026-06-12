import { Link } from 'react-router-dom'
import { Shield, Mail, Phone, MapPin, Linkedin, Twitter, Globe } from 'lucide-react'

const footerLinks = {
  Product: [
    { label: 'AML Screening', href: '/features#aml' },
    { label: 'KYC Management', href: '/features#kyc' },
    { label: 'Transaction Monitoring', href: '/features#monitoring' },
    { label: 'Accounting Suite', href: '/features#accounting' },
    { label: 'STR/SAR Reports', href: '/features#reports' },
    { label: 'API Access', href: '/features#api' },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Careers', href: '/about#careers' },
    { label: 'Contact', href: '/contact' },
    { label: 'Blog', href: '/blog' },
    { label: 'Press', href: '/press' },
  ],
  Compliance: [
    { label: 'CBUAE Guidelines', href: '#' },
    { label: 'FATF Standards', href: '#' },
    { label: 'UAE AML Law', href: '#' },
    { label: 'DIFC Regulations', href: '#' },
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
  ],
  Support: [
    { label: 'Documentation', href: '#' },
    { label: 'Help Center', href: '#' },
    { label: 'API Reference', href: '#' },
    { label: 'Status Page', href: '#' },
    { label: 'Security', href: '#' },
    { label: 'Compliance FAQs', href: '#' },
  ],
}

const certifications = [
  { label: 'ISO 27001', sub: 'Information Security' },
  { label: 'CBUAE', sub: 'Licensed & Regulated' },
  { label: 'FATF', sub: 'Compliant Platform' },
  { label: 'SOC 2', sub: 'Type II Certified' },
]

export default function SiteFooter() {
  return (
    <footer className="bg-navy-950 text-slate-400 border-t border-navy-800">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 bg-gradient-to-br from-accent-500 to-accent-700 rounded-xl flex items-center justify-center">
                <Shield size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">Al Merak AML</p>
                <p className="text-slate-500 text-xs">Compliance Platform</p>
              </div>
            </Link>
            <p className="text-sm leading-relaxed mb-6">
              Enterprise AML compliance and accounting software built for UAE financial institutions and regulated entities.
            </p>
            <div className="space-y-2.5">
              <a href="mailto:info@almerak.ae" className="flex items-center gap-2 text-sm hover:text-white transition-colors">
                <Mail size={14} className="text-accent-500 flex-shrink-0" />
                info@almerak.ae
              </a>
              <a href="tel:+97142000000" className="flex items-center gap-2 text-sm hover:text-white transition-colors">
                <Phone size={14} className="text-accent-500 flex-shrink-0" />
                +971 4 200 0000
              </a>
              <div className="flex items-start gap-2 text-sm">
                <MapPin size={14} className="text-accent-500 flex-shrink-0 mt-0.5" />
                <span>Gate Village 4, DIFC<br />Dubai, UAE 506514</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-6">
              {[Linkedin, Twitter, Globe].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-8 h-8 bg-navy-800 hover:bg-navy-700 rounded-lg flex items-center justify-center transition-colors"
                >
                  <Icon size={14} className="text-slate-400 hover:text-white" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <p className="text-white text-xs font-bold uppercase tracking-wider mb-4">{section}</p>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Certifications bar */}
      <div className="border-t border-navy-800">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 flex-wrap justify-center sm:justify-start">
            {certifications.map((cert) => (
              <div key={cert.label} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <div>
                  <p className="text-xs font-bold text-white leading-tight">{cert.label}</p>
                  <p className="text-xs text-slate-500 leading-tight">{cert.sub}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 text-center sm:text-right">
            © 2025 Al Merak Compliance Solutions LLC. All rights reserved.<br className="hidden sm:block" />
            Regulated by CBUAE · UAE Financial Services
          </p>
        </div>
      </div>
    </footer>
  )
}
