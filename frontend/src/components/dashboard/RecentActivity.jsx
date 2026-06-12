import { Activity } from 'lucide-react'

export default function RecentActivity() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-navy-750 flex items-center justify-center mb-3">
        <Activity size={16} className="text-slate-400 dark:text-slate-500" />
      </div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">No activity yet</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Actions will appear here</p>
    </div>
  )
}
