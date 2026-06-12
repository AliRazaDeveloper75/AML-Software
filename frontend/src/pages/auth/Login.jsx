import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'

const STORAGE_KEY = 'almerak_remembered'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Pre-fill saved credentials on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const { email, password } = JSON.parse(saved)
        setForm({ email: email || '', password: password || '' })
        setRemember(true)
      }
    } catch {
      // ignore corrupt storage
    }
  }, [])

  const next = location.state?.from || '/dashboard'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Save or clear remembered credentials
    if (remember) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ email: form.email, password: form.password }))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }

    try {
      const result = await login(form.email, form.password)
      if (result.requires_2fa) {
        navigate('/auth/2fa')
      } else if (result.user?.is_staff) {
        navigate('/admin', { replace: true })
      } else {
        navigate(next, { replace: true })
      }
    } catch (err) {
      const d = err.response?.data
      const fieldMsg = d?.errors
        ? Object.values(d.errors).flat().filter(v => typeof v === 'string')[0]
        : null
      const msg = fieldMsg || d?.message || d?.detail
      if (err.response?.status === 423) {
        setError('Account temporarily locked after too many failed attempts. Try again in 30 minutes.')
      } else if (err.response?.status === 401) {
        setError('Invalid email or password.')
      } else {
        setError(msg || 'Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-navy flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-tight">Al Merak AML</p>
              <p className="text-slate-400 text-xs">Compliance Platform</p>
            </div>
          </div>
          <div className="space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold text-white leading-tight"
            >
              Enterprise AML <br />
              <span className="text-gradient">Compliance</span> for UAE
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-slate-400 text-base leading-relaxed"
            >
              Streamline your AML screening, KYC management, and accounting operations.
              Built for banks and compliance companies across the UAE.
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-12 grid grid-cols-3 gap-4"
          >
            {[
              { label: 'Active Customers', value: '1,872' },
              { label: 'Alerts Resolved', value: '12.4K' },
              { label: 'Compliance Rate', value: '97.8%' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
        <div className="relative z-10">
          <p className="text-slate-500 text-xs">
            Licensed by CBUAE · FATF Compliant · ISO 27001 Certified
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-surface-light dark:bg-navy-950">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-accent-600 rounded-lg flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-slate-100">Al Merak AML</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Welcome back</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">Sign in to your compliance dashboard</p>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@company.ae"
                  required
                  className="input-field pl-9"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                <Link to="/auth/forgot-password" className="text-xs text-accent-600 hover:text-accent-700 font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Enter your password"
                  required
                  className="input-field pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none group">
              <div className="relative flex-shrink-0">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-4 h-4 rounded border-2 border-slate-300 dark:border-slate-600 peer-checked:bg-accent-600 peer-checked:border-accent-600 transition-all flex items-center justify-center">
                  {remember && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                      <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
                Remember me
              </span>
            </label>

            <Button type="submit" loading={loading} className="w-full" icon={ArrowRight} iconPosition="right">
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            Don't have an account?{' '}
            <Link to="/auth/register" className="text-accent-600 hover:text-accent-700 font-medium">
              Request access
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
