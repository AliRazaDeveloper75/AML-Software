import { motion } from 'framer-motion'
import clsx from 'clsx'

export default function PageHeader({ title, subtitle, actions, breadcrumb }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
    >
      <div>
        {breadcrumb && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-1 font-medium">{breadcrumb}</p>
        )}
        <h1 className="page-title">{title}</h1>
        {subtitle && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </motion.div>
  )
}
