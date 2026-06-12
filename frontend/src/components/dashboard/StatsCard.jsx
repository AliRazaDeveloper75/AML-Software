import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import clsx from 'clsx'

const colorMap = {
  blue: {
    icon: 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
    value: 'text-slate-900 dark:text-slate-100',
    trend: '',
    border: 'border-blue-100 dark:border-blue-900/30',
  },
  green: {
    icon: 'bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400',
    value: 'text-slate-900 dark:text-slate-100',
    trend: '',
    border: 'border-green-100 dark:border-green-900/30',
  },
  red: {
    icon: 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400',
    value: 'text-slate-900 dark:text-slate-100',
    trend: '',
    border: 'border-red-100 dark:border-red-900/30',
  },
  amber: {
    icon: 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
    value: 'text-slate-900 dark:text-slate-100',
    trend: '',
    border: 'border-amber-100 dark:border-amber-900/30',
  },
  purple: {
    icon: 'bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400',
    value: 'text-slate-900 dark:text-slate-100',
    trend: '',
    border: 'border-purple-100 dark:border-purple-900/30',
  },
}

export default function StatsCard({ label, value, subvalue, icon: Icon, color = 'blue', trend, trendValue, index = 0 }) {
  const colors = colorMap[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className="bg-white dark:bg-navy-800 border border-slate-100 dark:border-navy-700 rounded-xl p-5 shadow-card hover:shadow-elevated transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
        <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', colors.icon)}>
          <Icon size={17} />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <p className={clsx('text-2xl font-bold leading-none', colors.value)}>{value}</p>
      </div>
      <div className="flex items-center justify-between mt-3">
        {subvalue && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{subvalue}</p>
        )}
        {trend && trendValue && (
          <div className={clsx(
            'flex items-center gap-1 text-xs font-semibold',
            trend === 'up' ? 'text-green-600 dark:text-green-400' :
            trend === 'down' ? 'text-red-600 dark:text-red-400' :
            'text-slate-500 dark:text-slate-400'
          )}>
            {trend === 'up' && <TrendingUp size={12} />}
            {trend === 'down' && <TrendingDown size={12} />}
            {trend === 'neutral' && <Minus size={12} />}
            {trendValue}
          </div>
        )}
      </div>
    </motion.div>
  )
}
