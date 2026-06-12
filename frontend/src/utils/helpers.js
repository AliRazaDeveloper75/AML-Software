export const formatCurrency = (amount, currency = 'AED') => {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatNumber = (num) => {
  return new Intl.NumberFormat('en-AE').format(num)
}

export const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-AE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export const formatDateTime = (dateStr) => {
  return new Date(dateStr).toLocaleString('en-AE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const timeAgo = (dateStr) => {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return formatDate(dateStr)
}

export const getRiskColor = (level) => {
  const map = {
    critical: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400',
    high: 'text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400',
    medium: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400',
    low: 'text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400',
  }
  return map[level] || map.low
}

export const getStatusColor = (status) => {
  const map = {
    active: 'text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400',
    inactive: 'text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400',
    verified: 'text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400',
    pending: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400',
    rejected: 'text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400',
    under_review: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400',
    open: 'text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400',
    closed: 'text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400',
    escalated: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400',
    paid: 'text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400',
    overdue: 'text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400',
    draft: 'text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400',
    completed: 'text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400',
    flagged: 'text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400',
    frozen: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400',
    reported: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400',
    filed: 'text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400',
  }
  return map[status] || map.inactive
}

export const getRiskScoreColor = (score) => {
  if (score >= 80) return 'text-red-600'
  if (score >= 60) return 'text-amber-600'
  if (score >= 40) return 'text-yellow-600'
  return 'text-green-600'
}

export const truncate = (str, len = 30) => {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '...' : str
}

export const classNames = (...classes) => {
  return classes.filter(Boolean).join(' ')
}
