import { CreditCard } from 'lucide-react'

export default function AdminBilling() {
  return (
    <div className="flex flex-col items-center justify-center h-80 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
        <CreditCard size={24} className="text-slate-600" />
      </div>
      <h2 className="text-slate-300 font-semibold mb-1">Billing Management</h2>
      <p className="text-slate-600 text-sm">Stripe integration — coming soon</p>
    </div>
  )
}
