import { motion } from 'framer-motion'
import clsx from 'clsx'

export default function Card({ children, className, hover = false, glass = false, padding = true, onClick }) {
  const base = clsx(
    glass
      ? 'bg-white/80 dark:bg-navy-800/60 backdrop-blur-md border border-white/20 dark:border-white/5'
      : 'bg-white dark:bg-navy-800 border border-slate-100 dark:border-navy-700',
    'rounded-xl shadow-card',
    padding && 'p-5',
    hover && 'hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200 cursor-pointer',
    onClick && 'cursor-pointer',
    className
  )

  if (hover || onClick) {
    return (
      <motion.div
        whileHover={{ y: -1, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        className={base}
        onClick={onClick}
      >
        {children}
      </motion.div>
    )
  }

  return <div className={base}>{children}</div>
}
