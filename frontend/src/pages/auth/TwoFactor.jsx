import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { Shield, Smartphone, Key, ArrowLeft, CheckCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import clsx from 'clsx'

const methods = [
  { id: 'totp', icon: Smartphone, label: 'Authenticator App', desc: 'Google Authenticator or similar' },
  { id: 'sms', icon: Key, label: 'SMS Code', desc: 'Sent to your registered number' },
]

export default function TwoFactor() {
  const navigate = useNavigate()
  const location = useLocation()
  const { verify2FA, tempToken } = useAuth()
  const [method, setMethod] = useState('totp')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const next = location.state?.from || '/dashboard'

  const submit = async () => {
    if (code.length < 6) { setError('Please enter a valid 6-digit code.'); return }
    setError('')
    setLoading(true)
    try {
      await verify2FA(code)
      navigate(next, { replace: true })
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.detail
      if (err.response?.status === 400) {
        setError('Invalid or expired code. Please try again.')
      } else {
        setError(msg || 'Verification failed. Please try again.')
      }
      setCode('')
    } finally {
      setLoading(false)
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
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-accent-100 dark:bg-accent-950/40 rounded-xl flex items-center justify-center">
                <Shield size={18} className="text-accent-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Two-Factor Authentication</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Additional security required</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Your account is protected with 2FA. Enter the verification code to continue.
            </p>
          </div>

          {/* Method selector */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {methods.map((m) => {
              const Icon = m.icon
              return (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={clsx(
                    'flex flex-col items-center gap-2 p-3 rounded-xl border-2 text-center transition-all',
                    method === m.id
                      ? 'border-accent-500 bg-accent-50 dark:bg-accent-950/30'
                      : 'border-slate-200 dark:border-navy-600 hover:border-slate-300'
                  )}
                >
                  <Icon size={20} className={method === m.id ? 'text-accent-600' : 'text-slate-400'} />
                  <div>
                    <p className={clsx('text-xs font-semibold', method === m.id ? 'text-accent-700 dark:text-accent-400' : 'text-slate-600 dark:text-slate-300')}>
                      {m.label}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{m.desc}</p>
                  </div>
                  {method === m.id && <CheckCircle size={14} className="text-accent-500" />}
                </button>
              )
            })}
          </div>

          {method === 'totp' && (
            <div className="mb-4 p-3 bg-slate-50 dark:bg-navy-750 rounded-xl">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Open your authenticator app and enter the 6-digit code for <strong>Al Merak AML</strong>
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {method === 'totp' ? 'Authenticator Code' : 'SMS Code'}
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="000000"
              autoFocus
              className="input-field text-center text-xl tracking-widest font-mono"
            />
          </div>

          <Button onClick={submit} loading={loading} className="w-full">
            Verify &amp; Sign In
          </Button>

          <div className="mt-4 text-center">
            <button className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
              Having trouble? Contact support
            </button>
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
