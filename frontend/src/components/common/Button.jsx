import { motion } from 'framer-motion'
import clsx from 'clsx'

const variants = {
  primary: 'bg-accent-600 hover:bg-accent-700 active:bg-accent-800 text-white shadow-sm hover:shadow-md',
  secondary: 'bg-slate-100 hover:bg-slate-200 dark:bg-navy-700 dark:hover:bg-navy-600 text-slate-700 dark:text-slate-200',
  ghost: 'hover:bg-slate-100 dark:hover:bg-navy-700 text-slate-600 dark:text-slate-300',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
  outline: 'border border-slate-200 dark:border-navy-600 hover:bg-slate-50 dark:hover:bg-navy-750 text-slate-700 dark:text-slate-200',
  success: 'bg-green-600 hover:bg-green-700 text-white shadow-sm',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-lg gap-2',
  lg: 'px-5 py-2.5 text-sm rounded-xl gap-2',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  className,
  onClick,
  type = 'button',
  ...props
}) {
  return (
    <motion.button
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {!loading && Icon && iconPosition === 'left' && <Icon size={14} className="flex-shrink-0" />}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon size={14} className="flex-shrink-0" />}
    </motion.button>
  )
}
