import clsx from 'clsx'

const variants = {
  high: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  critical: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  low: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  success: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400',
}

const dots = {
  high: 'bg-red-500',
  critical: 'bg-purple-500',
  medium: 'bg-amber-500',
  low: 'bg-green-500',
  info: 'bg-blue-500',
  neutral: 'bg-slate-400',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  purple: 'bg-purple-500',
}

export default function Badge({ children, variant = 'neutral', dot = false, className }) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold',
      variants[variant] || variants.neutral,
      className
    )}>
      {dot && (
        <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', dots[variant] || dots.neutral)} />
      )}
      {children}
    </span>
  )
}
