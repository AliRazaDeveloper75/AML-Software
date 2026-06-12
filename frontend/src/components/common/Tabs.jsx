import { motion } from 'framer-motion'
import clsx from 'clsx'

export default function Tabs({ tabs, active, onChange, className }) {
  return (
    <div className={clsx('flex items-center gap-1 bg-slate-100 dark:bg-navy-750 rounded-xl p-1', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={clsx(
            'relative flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200',
            active === tab.value
              ? 'text-slate-900 dark:text-slate-100'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          )}
        >
          {active === tab.value && (
            <motion.div
              layoutId="tab-bg"
              className="absolute inset-0 bg-white dark:bg-navy-700 rounded-lg shadow-sm"
            />
          )}
          <span className="relative z-10">{tab.label}</span>
          {tab.count !== undefined && (
            <span className={clsx(
              'relative z-10 px-1.5 py-0.5 text-xs rounded-full font-semibold',
              active === tab.value
                ? 'bg-accent-100 text-accent-700 dark:bg-accent-950/50 dark:text-accent-400'
                : 'bg-slate-200 dark:bg-navy-600 text-slate-600 dark:text-slate-400'
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

export function TabLine({ tabs, active, onChange, className }) {
  return (
    <div className={clsx('flex items-center border-b border-slate-100 dark:border-navy-700', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={clsx(
            'relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
            active === tab.value
              ? 'text-accent-600 dark:text-accent-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          )}
        >
          {tab.icon && <tab.icon size={14} />}
          {tab.label}
          {tab.count !== undefined && (
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-navy-700 text-slate-600 dark:text-slate-400 font-semibold">
              {tab.count}
            </span>
          )}
          {active === tab.value && (
            <motion.div
              layoutId="tab-line"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-500 rounded-full"
            />
          )}
        </button>
      ))}
    </div>
  )
}
