import { motion } from 'framer-motion'
import clsx from 'clsx'

export function Table({ children, className }) {
  return (
    <div className={clsx('overflow-x-auto', className)}>
      <table className="w-full">{children}</table>
    </div>
  )
}

export function Thead({ children }) {
  return (
    <thead className="bg-slate-50 dark:bg-navy-750">
      {children}
    </thead>
  )
}

export function Th({ children, className, align = 'left' }) {
  return (
    <th className={clsx(
      'px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap',
      align === 'right' && 'text-right',
      align === 'center' && 'text-center',
      className
    )}>
      {children}
    </th>
  )
}

export function Tbody({ children }) {
  return <tbody className="divide-y divide-slate-100 dark:divide-navy-700">{children}</tbody>
}

export function Tr({ children, onClick, className, highlight }) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClick}
      className={clsx(
        'transition-colors duration-150',
        onClick && 'cursor-pointer',
        highlight
          ? 'bg-red-50/50 dark:bg-red-950/10 hover:bg-red-50 dark:hover:bg-red-950/20'
          : 'hover:bg-slate-50 dark:hover:bg-navy-750',
        className
      )}
    >
      {children}
    </motion.tr>
  )
}

export function Td({ children, className, align = 'left', muted }) {
  return (
    <td className={clsx(
      'px-4 py-3.5 text-sm whitespace-nowrap',
      muted ? 'text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-slate-200',
      align === 'right' && 'text-right',
      align === 'center' && 'text-center',
      className
    )}>
      {children}
    </td>
  )
}
