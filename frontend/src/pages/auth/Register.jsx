import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { Shield, Mail, Lock, User, Building2, Phone, Eye, EyeOff, CheckCircle } from 'lucide-react'
import Button from '../../components/common/Button'
import { useAuth } from '../../context/AuthContext'
import api, { setToken } from '../../lib/api'

const EMIRATES = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah']
const LICENSE_TYPES = [
  { value: 'bank', label: 'Bank' },
  { value: 'exchange', label: 'Exchange House' },
  { value: 'broker', label: 'Broker' },
  { value: 'accounting', label: 'Accounting Firm' },
  { value: 'trading', label: 'Trading Company' },
  { value: 'fintech', label: 'FinTech' },
  { value: 'other', label: 'Other' },
]

const steps = ['Account', 'Company', 'Confirm']

export default function Register() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', password: '', phone: '',
    org_name: '', trade_license_no: '', license_type: 'other', emirate: 'Dubai',
  })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/register/', {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        org_name: form.org_name,
        trade_license_no: form.trade_license_no,
        license_type: form.license_type,
        emirate: form.emirate,
      })
      const payload = data.data ?? data
      setToken(payload.access)
      setUser(payload.user)
      navigate('/auth/otp-verify', { replace: true, state: { email: form.email, purpose: 'email_verify' } })
    } catch (err) {
      const d = err.response?.data
      let msg = 'Registration failed. Please try again.'
      if (d) {
        // Try field-level errors first (most specific)
        if (d.errors && typeof d.errors === 'object') {
          const fieldMsgs = Object.values(d.errors).flat().filter(v => typeof v === 'string')
          if (fieldMsgs.length) msg = fieldMsgs.join(' ')
        } else if (typeof d.message === 'string' && d.message !== 'Validation failed.') {
          msg = d.message
        } else if (typeof d.detail === 'string') {
          msg = d.detail
        }
      }
      setError(msg)
      setStep(0)
    } finally {
      setLoading(false)
    }
  }

  const next = () => {
    if (step < 2) { setStep(s => s + 1); return }
    handleSubmit()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-navy-950 p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-accent-600 rounded-lg flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
          <span className="font-bold text-slate-900 dark:text-slate-100">Al Merak AML</span>
        </div>

        <div className="bg-white dark:bg-navy-800 border border-slate-100 dark:border-navy-700 rounded-2xl shadow-card p-7">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Create your account</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Get started with Al Merak AML compliance platform</p>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-6">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                  i < step ? 'bg-green-500 text-white' :
                  i === step ? 'bg-accent-600 text-white' :
                  'bg-slate-100 dark:bg-navy-700 text-slate-400'
                }`}>
                  {i < step ? <CheckCircle size={12} /> : i + 1}
                </div>
                <span className={`text-xs font-medium ${i === step ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>{s}</span>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-px ${i < step ? 'bg-green-400' : 'bg-slate-200 dark:bg-navy-700'}`} />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">First Name</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" value={form.first_name} onChange={set('first_name')} placeholder="Sara" className="input-field pl-8" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Last Name</label>
                  <input type="text" value={form.last_name} onChange={set('last_name')} placeholder="Al Zaabi" className="input-field" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Work Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" value={form.email} onChange={set('email')} placeholder="you@company.ae" className="input-field pl-8" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Phone (optional)</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+971-50-000-0000" className="input-field pl-8" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={set('password')}
                    placeholder="Minimum 10 characters"
                    className="input-field pl-8 pr-10"
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <div className="mt-2 flex gap-1">
                  {[20, 40, 60, 80, 100].map(w => (
                    <div key={w} className={`h-1 flex-1 rounded-full transition-all ${form.password.length * 8 >= w ? 'bg-accent-500' : 'bg-slate-200 dark:bg-navy-700'}`} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Organization Name</label>
                <div className="relative">
                  <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={form.org_name} onChange={set('org_name')} placeholder="Al Zaabi Holdings LLC" className="input-field pl-8" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Trade License No.</label>
                <input type="text" value={form.trade_license_no} onChange={set('trade_license_no')} placeholder="DED-123456" className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">License Type</label>
                <select value={form.license_type} onChange={set('license_type')} className="input-field">
                  {LICENSE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Emirate</label>
                <select value={form.emirate} onChange={set('emirate')} className="input-field">
                  {EMIRATES.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="text-center py-2">
                <div className="w-12 h-12 bg-accent-100 dark:bg-accent-950/40 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <CheckCircle size={24} className="text-accent-600" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">Review & Submit</h3>
              </div>
              <div className="bg-slate-50 dark:bg-navy-900 rounded-xl p-4 text-sm space-y-2">
                <div className="flex justify-between"><span className="text-slate-500">Name</span><span className="font-medium text-slate-800 dark:text-slate-200">{form.first_name} {form.last_name}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="font-medium text-slate-800 dark:text-slate-200">{form.email}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Organization</span><span className="font-medium text-slate-800 dark:text-slate-200">{form.org_name}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Trade License</span><span className="font-medium text-slate-800 dark:text-slate-200">{form.trade_license_no}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Emirate</span><span className="font-medium text-slate-800 dark:text-slate-200">{form.emirate}</span></div>
              </div>
            </div>
          )}

          <Button onClick={next} loading={loading} className="w-full mt-6">
            {step < 2 ? 'Continue' : 'Create Account'}
          </Button>

          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="w-full mt-3 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              Back
            </button>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-5">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-accent-600 hover:text-accent-700 font-medium">Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}
