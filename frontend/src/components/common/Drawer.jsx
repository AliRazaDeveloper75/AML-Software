import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import clsx from 'clsx'

export default function Drawer({ open, onClose, title, subtitle, children, footer, width = 'w-[480px]' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={clsx(
              'relative h-full bg-white dark:bg-navy-800 shadow-2xl border-l border-slate-100 dark:border-navy-700 flex flex-col',
              width
            )}
          >
            <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 dark:border-navy-700 flex-shrink-0">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
                {subtitle && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors ml-4"
              >
                <X size={16} className="text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {children}
            </div>
            {footer && (
              <div className="px-6 py-4 border-t border-slate-100 dark:border-navy-700 flex items-center justify-end gap-3 flex-shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
