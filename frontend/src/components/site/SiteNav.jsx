import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Menu, X, Sun, Moon, ChevronDown, ArrowRight } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import clsx from 'clsx'

const navLinks = [
  { label: 'Product', href: '/features', hasDropdown: true,
    dropdown: [
      { label: 'AML Screening', desc: 'PEP, sanctions & watchlist checks', href: '/features#aml' },
      { label: 'KYC Management', desc: 'Digital onboarding & document verification', href: '/features#kyc' },
      { label: 'Transaction Monitoring', desc: 'Real-time suspicious activity detection', href: '/features#monitoring' },
      { label: 'Accounting Suite', desc: 'VAT, corporate tax & financial reports', href: '/features#accounting' },
    ],
  },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

function NavDropdown({ items }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-white dark:bg-navy-800 rounded-2xl shadow-elevated border border-slate-100 dark:border-navy-700 overflow-hidden z-50 p-2"
    >
      {items.map((item) => (
        <Link
          key={item.label}
          to={item.href}
          className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-navy-750 transition-colors group"
        >
          <div className="w-8 h-8 bg-accent-100 dark:bg-accent-950/40 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-accent-200 dark:group-hover:bg-accent-900/50 transition-colors">
            <Shield size={14} className="text-accent-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.label}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
          </div>
        </Link>
      ))}
    </motion.div>
  )
}

export default function SiteNav() {
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setActiveDropdown(null)
  }, [location.pathname])

  return (
    <>
      <header className={clsx(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/90 dark:bg-navy-950/90 backdrop-blur-md shadow-sm border-b border-slate-100/80 dark:border-navy-800/80'
          : 'bg-transparent'
      )}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-700 rounded-lg flex items-center justify-center shadow-sm">
              <Shield size={16} className="text-white" />
            </div>
            <div className="leading-tight">
              <p className={clsx('font-bold text-sm', scrolled || mobileOpen ? 'text-slate-900 dark:text-slate-100' : 'text-white')}>
                Al Merak AML
              </p>
              <p className={clsx('text-xs', scrolled || mobileOpen ? 'text-slate-400' : 'text-white/60')}>
                Compliance Platform
              </p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <div
                key={link.label}
                className="relative"
                onMouseEnter={() => link.hasDropdown && setActiveDropdown(link.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  to={link.href}
                  className={clsx(
                    'flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    scrolled
                      ? 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  )}
                >
                  {link.label}
                  {link.hasDropdown && <ChevronDown size={13} className={clsx('transition-transform', activeDropdown === link.label && 'rotate-180')} />}
                </Link>
                <AnimatePresence>
                  {link.hasDropdown && activeDropdown === link.label && (
                    <NavDropdown items={link.dropdown} />
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>

          {/* Right actions */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                scrolled
                  ? 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-navy-800'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              )}
            >
              {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>
            <Link
              to="/auth/login"
              className={clsx(
                'px-4 py-2 text-sm font-semibold rounded-lg transition-colors',
                scrolled
                  ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              )}
            >
              Sign in
            </Link>
            <Link
              to="/auth/register"
              className="px-4 py-2 text-sm font-semibold bg-accent-600 hover:bg-accent-700 text-white rounded-lg transition-colors shadow-sm"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile toggle */}
          <div className="flex lg:hidden items-center gap-2">
            <button onClick={toggleTheme} className={clsx('p-2 rounded-lg', scrolled || mobileOpen ? 'text-slate-500' : 'text-white/80')}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={() => setMobileOpen(v => !v)}
              className={clsx('p-2 rounded-lg transition-colors', scrolled || mobileOpen ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800' : 'text-white hover:bg-white/10')}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed top-16 left-0 right-0 z-40 bg-white dark:bg-navy-900 border-b border-slate-100 dark:border-navy-800 shadow-elevated overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-5 py-4 space-y-1">
              {navLinks.map((link) => (
                <div key={link.label}>
                  <Link
                    to={link.href}
                    className="block px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-navy-800 rounded-xl transition-colors"
                  >
                    {link.label}
                  </Link>
                  {link.hasDropdown && (
                    <div className="pl-4 mt-1 space-y-1">
                      {link.dropdown.map(sub => (
                        <Link key={sub.label} to={sub.href} className="block px-3 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition-colors">
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="pt-3 border-t border-slate-100 dark:border-navy-800 flex flex-col gap-2">
                <Link to="/auth/login" className="text-center py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-navy-700 rounded-xl hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors">
                  Sign in
                </Link>
                <Link to="/auth/register" className="text-center py-2.5 text-sm font-semibold bg-accent-600 hover:bg-accent-700 text-white rounded-xl transition-colors">
                  Get Started Free
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
