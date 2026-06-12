import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import Button from './Button'

export default function EmptyState({ icon: Icon = Search, title, description, action, actionLabel }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="w-14 h-14 bg-slate-100 dark:bg-navy-700 rounded-2xl flex items-center justify-center mb-4">
        <Icon size={24} className="text-slate-400 dark:text-slate-500" />
      </div>
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">{description}</p>
      )}
      {action && (
        <div className="mt-4">
          <Button onClick={action} size="sm">{actionLabel}</Button>
        </div>
      )}
    </motion.div>
  )
}
