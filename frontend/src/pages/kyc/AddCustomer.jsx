import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { User, Building2, Mail, Phone, MapPin, Globe, Save, ChevronRight } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import FileUpload from '../../components/common/FileUpload'
import Card from '../../components/common/Card'
import { TabLine } from '../../components/common/Tabs'
import { useCreateCustomer } from '../../hooks/useKYC'

const tabs = [
  { value: 'personal', label: 'Personal Info', icon: User },
  { value: 'documents', label: 'Documents', icon: Building2 },
  { value: 'risk', label: 'Risk Profile', icon: Globe },
]

export default function AddCustomer() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('personal')
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    customer_type: 'individual',
    first_name: '', last_name: '', company_name: '',
    email: '', phone: '', nationality: '',
    emirates_id: '', passport_number: '', date_of_birth: '',
    address: '', city: '', country: 'AE',
    industry: '', occupation: '', purpose_of_relationship: '',
    is_pep: false, source_of_funds: '',
    expected_monthly_volume: '', transaction_frequency: '',
  })

  const { mutateAsync: createCustomer, isPending } = useCreateCustomer()

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async () => {
    setError(null)
    try {
      const payload = {
        ...form,
        full_name: form.customer_type === 'individual'
          ? `${form.first_name} ${form.last_name}`.trim()
          : form.company_name,
      }
      await createCustomer(payload)
      navigate('/kyc/customers')
    } catch (err) {
      const msg = err?.response?.data?.detail
        ?? Object.values(err?.response?.data ?? {})[0]?.[0]
        ?? 'Failed to create customer. Please check your inputs.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    }
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader
        title="Add New Customer"
        subtitle="Complete KYC onboarding for a new customer"
        breadcrumb="KYC Management / Add Customer"
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate('/kyc/customers')}>
            Cancel
          </Button>
        }
      />

      {error && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <Card padding={false} className="overflow-hidden">
        <TabLine tabs={tabs} active={tab} onChange={setTab} className="px-5" />

        <div className="p-6">
          {tab === 'personal' && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Customer Type</label>
                <div className="flex gap-3">
                  {[{ value: 'individual', label: 'Individual' }, { value: 'corporate', label: 'Corporate' }].map(t => (
                    <button
                      key={t.value}
                      onClick={() => setForm(f => ({ ...f, customer_type: t.value }))}
                      className={`flex-1 py-2.5 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                        form.customer_type === t.value
                          ? 'border-accent-500 bg-accent-50 dark:bg-accent-950/30 text-accent-700 dark:text-accent-400'
                          : 'border-slate-200 dark:border-navy-600 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {form.customer_type === 'individual' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">First Name *</label>
                    <div className="relative"><User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" value={form.first_name} onChange={set('first_name')} placeholder="Mohammed" className="input-field pl-8" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Last Name *</label>
                    <input type="text" value={form.last_name} onChange={set('last_name')} placeholder="Al Rashid" className="input-field" required />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Company Name *</label>
                  <div className="relative"><Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" value={form.company_name} onChange={set('company_name')} placeholder="Al Rashid Trading LLC" className="input-field pl-8" required />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address *</label>
                  <div className="relative"><Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="email" value={form.email} onChange={set('email')} placeholder="customer@email.com" className="input-field pl-8" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Phone Number *</label>
                  <div className="relative"><Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+971-50-000-0000" className="input-field pl-8" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Emirates ID</label>
                  <input type="text" value={form.emirates_id} onChange={set('emirates_id')} placeholder="784-YYYY-XXXXXXX-X" className="input-field font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nationality *</label>
                  <div className="relative"><Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select value={form.nationality} onChange={set('nationality')} className="input-field pl-8">
                      <option value="">Select nationality</option>
                      <option value="AE">UAE</option>
                      <option value="SA">Saudi Arabia</option>
                      <option value="EG">Egypt</option>
                      <option value="IN">India</option>
                      <option value="PK">Pakistan</option>
                      <option value="GB">United Kingdom</option>
                      <option value="US">United States</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Date of Birth</label>
                  <input type="date" value={form.date_of_birth} onChange={set('date_of_birth')} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Industry</label>
                  <select value={form.industry} onChange={set('industry')} className="input-field">
                    <option value="">Select industry</option>
                    <option value="banking">Banking &amp; Finance</option>
                    <option value="real_estate">Real Estate</option>
                    <option value="trading">Trading</option>
                    <option value="technology">Technology</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="construction">Construction</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Residential Address</label>
                <div className="relative"><MapPin size={14} className="absolute left-3 top-3 text-slate-400" />
                  <textarea value={form.address} onChange={set('address')} placeholder="Full address..." rows={2} className="input-field pl-8 resize-none" />
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'documents' && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">UAE KYC Requirements</p>
                <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                  As per CBUAE guidelines, you must collect Emirates ID and at least one government-issued photo ID. For corporate customers, provide trade license and memorandum of association.
                </p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Documents can be uploaded after the customer profile is created. Submit the form first, then upload from the customer detail page.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FileUpload label="Emirates ID (Front)" accept="image/*,.pdf" description="JPG, PNG or PDF · Emirates ID front side" />
                <FileUpload label="Emirates ID (Back)" accept="image/*,.pdf" description="JPG, PNG or PDF · Emirates ID back side" />
                <FileUpload label="Passport" accept="image/*,.pdf" description="JPG, PNG or PDF · Valid passport biodata page" />
                <FileUpload label="Proof of Address" accept="image/*,.pdf" description="Utility bill, bank statement (max 3 months old)" />
                {form.customer_type === 'corporate' && (
                  <>
                    <FileUpload label="Trade License" accept="image/*,.pdf" description="Valid UAE trade license" />
                    <FileUpload label="Memorandum of Association" accept=".pdf" description="MOA / Articles of Association" />
                  </>
                )}
              </div>
            </motion.div>
          )}

          {tab === 'risk' && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Purpose of Relationship</label>
                  <select value={form.purpose_of_relationship} onChange={set('purpose_of_relationship')} className="input-field">
                    <option value="">Select purpose</option>
                    <option value="business">Business Operations</option>
                    <option value="investment">Investment</option>
                    <option value="savings">Personal Savings</option>
                    <option value="trade">Trade Finance</option>
                    <option value="real_estate">Real Estate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Source of Funds</label>
                  <select value={form.source_of_funds} onChange={set('source_of_funds')} className="input-field">
                    <option value="">Select source</option>
                    <option value="business_income">Business Income</option>
                    <option value="employment">Employment Income</option>
                    <option value="investments">Investments</option>
                    <option value="inheritance">Inheritance</option>
                    <option value="property_sale">Property Sale</option>
                    <option value="loans">Loans</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Expected Monthly Volume (AED)</label>
                  <select value={form.expected_monthly_volume} onChange={set('expected_monthly_volume')} className="input-field">
                    <option value="">Select range</option>
                    <option value="under_50k">Under 50,000</option>
                    <option value="50k_200k">50,000 – 200,000</option>
                    <option value="200k_500k">200,000 – 500,000</option>
                    <option value="500k_2m">500,000 – 2,000,000</option>
                    <option value="over_2m">Over 2,000,000</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Transaction Frequency</label>
                  <select value={form.transaction_frequency} onChange={set('transaction_frequency')} className="input-field">
                    <option value="">Select frequency</option>
                    <option value="occasional">Occasional (1–5/month)</option>
                    <option value="regular">Regular (6–20/month)</option>
                    <option value="frequent">Frequent (21–50/month)</option>
                    <option value="very_frequent">Very Frequent (50+/month)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Is the customer a Politically Exposed Person (PEP)?</label>
                <div className="flex gap-3">
                  {[
                    { value: true, label: 'Yes (PEP)', activeClass: 'border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400' },
                    { value: false, label: 'No', activeClass: 'border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400' },
                  ].map(opt => (
                    <button
                      key={String(opt.value)}
                      onClick={() => setForm(f => ({ ...f, is_pep: opt.value }))}
                      className={`flex-1 py-2 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        form.is_pep === opt.value
                          ? opt.activeClass
                          : 'border-slate-200 dark:border-navy-600 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {form.is_pep && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">Enhanced Due Diligence Required</p>
                  <p className="text-xs text-red-600 dark:text-red-500">
                    PEP customers require senior management approval and enhanced monitoring per CBUAE AML guidelines.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-navy-700 bg-slate-50 dark:bg-navy-750">
          {tab !== 'personal' && (
            <Button variant="ghost" onClick={() => setTab(tabs[tabs.findIndex(t => t.value === tab) - 1].value)}>
              Back
            </Button>
          )}
          <div className="ml-auto flex gap-3">
            {tab !== 'risk' ? (
              <Button
                icon={ChevronRight}
                iconPosition="right"
                onClick={() => setTab(tabs[tabs.findIndex(t => t.value === tab) + 1].value)}
              >
                Continue
              </Button>
            ) : (
              <Button icon={Save} loading={isPending} onClick={handleSubmit}>
                Save &amp; Submit for Review
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
