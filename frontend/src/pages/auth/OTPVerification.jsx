import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Shield, ArrowLeft, RefreshCw, Mail } from 'lucide-react'
import Button from '../../components/common/Button'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'

function maskEmail(email = '') {
  const [local, domain] = email.split('@')
  if (!domain) return email
  const visible = local.slice(0, 2)
  return `${visible}${'*'.repeat(Math.max(local.length - 2, 3))}@${domain}`
}

export default function OTPVerification() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { setUser } = useAuth()

  const email = state?.email ?? ''
  const purpose = state?.purpose ?? 'email_verify'

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const refs = useRef([])

  useEffect(() => {
    refs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleChange = (i, val) => {
    if (!/^\d*$/.test(val)) return
    const next = [...otp]
    next[i] = val.slice(-1)
    setOtp(next)
    if (val && i < 5) refs.current[i + 1]?.focus()
  }

  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      refs.current[i - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = [...otp]
    text.split('').forEach((c, i) => { next[i] = c })
    setOtp(next)
    refs.current[Math.min(text.length, 5)]?.focus()
  }

  const submit = async () => {
    const code = otp.join('')
    if (code.length < 6) { setError('Please enter the 6-digit code'); return }
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/otp/verify/', { code, purpose })
      // Refresh user so email_verified is updated
      const { data } = await api.get('/auth/me/')
      setUser(data.data ?? data)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.detail || 'Invalid or expired code.'
      setError(msg)
      setOtp(['', '', '', '', '', ''])
      refs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    setError('')
    setSuccessMsg('')
    try {
      await api.post('/auth/otp/resend/', { purpose })
      setCountdown(60)
      setOtp(['', '', '', '', '', ''])
      refs.current[0]?.focus()
      setSuccessMsg('A new code has been sent to your email.')
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend code.'
      setError(msg)
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-navy-950 p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-accent-600 rounded-lg flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
          <span className="font-bold text-slate-900 dark:text-slate-100">Al Merak AML</span>
        </div>

        <div className="bg-white dark:bg-navy-800 border border-slate-100 dark:border-navy-700 rounded-2xl shadow-card p-7">
          <div className="text-center mb-7">
            <div className="w-14 h-14 bg-accent-100 dark:bg-accent-950/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail size={26} className="text-accent-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Verify your email</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              We sent a 6-digit code to{' '}
              <strong className="text-slate-700 dark:text-slate-300">{email ? maskEmail(email) : 'your email'}</strong>
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs px-3 py-2 rounded-lg mb-4 text-center">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 text-xs px-3 py-2 rounded-lg mb-4 text-center">
              {successMsg}
            </div>
          )}

          <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => refs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKey(i, e)}
                className={`w-11 h-12 text-center text-lg font-bold rounded-xl border-2 outline-none transition-all bg-slate-50 dark:bg-navy-750 text-slate-900 dark:text-slate-100 ${
                  digit
                    ? 'border-accent-500 bg-accent-50 dark:bg-accent-950/30'
                    : 'border-slate-200 dark:border-navy-600 focus:border-accent-400'
                }`}
              />
            ))}
          </div>

          <Button onClick={submit} loading={loading} className="w-full mb-4">
            Verify Email
          </Button>

          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Resend code in <span className="font-semibold text-slate-700 dark:text-slate-300">{countdown}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="flex items-center gap-1.5 text-sm text-accent-600 hover:text-accent-700 font-medium mx-auto transition-colors disabled:opacity-50"
              >
                <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
                {resending ? 'Sending…' : 'Resend code'}
              </button>
            )}
          </div>
        </div>

        <Link
          to="/auth/login"
          className="flex items-center justify-center gap-2 mt-5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Sign In
        </Link>
      </motion.div>
    </div>
  )
}
