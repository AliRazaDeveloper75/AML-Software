import { Search, X } from 'lucide-react'
import clsx from 'clsx'

export default function SearchBar({ value, onChange, placeholder = 'Search...', className }) {
  return (
    <div className={clsx(
      'flex items-center gap-2 bg-slate-50 dark:bg-navy-750 border border-slate-200 dark:border-navy-600 rounded-lg px-3 py-2',
      className
    )}>
      <Search size={14} className="text-slate-400 flex-shrink-0" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 outline-none min-w-0"
      />
      {value && (
        <button onClick={() => onChange('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <X size={13} />
        </button>
      )}
    </div>
  )
}
