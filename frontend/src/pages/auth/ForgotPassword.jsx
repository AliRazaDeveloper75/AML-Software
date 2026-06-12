import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import Button from '../../components/common/Button'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    setLoading(false)
    setSent(true)
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
          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="w-14 h-14 bg-green-100 dark:bg-green-950/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Check your email</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                We've sent password reset instructions to <strong>{email}</strong>
              </p>
              <Button onClick={() => navigate('/auth/otp-verify')} className="w-full">
                Enter OTP Code
              </Button>
              <button onClick={() => setSent(false)} className="mt-3 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors w-full">
                Use a different email
              </button>
            </motion.div>
          ) : (
            <>
              <div className="mb-6">
                <div className="w-10 h-10 bg-accent-100 dark:bg-accent-950/40 rounded-xl flex items-center justify-center mb-4">
                  <Mail size={18} className="text-accent-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Forgot password?</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Enter your email and we'll send you a reset code.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@company.ae"
                      required
                      className="input-field pl-8"
                    />
                  </div>
                </div>
                <Button type="submit" loading={loading} className="w-full">
                  Send Reset Code
                </Button>
              </form>
            </>
          )}
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
