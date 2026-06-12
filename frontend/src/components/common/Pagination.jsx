import { ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

export default function Pagination({ page, total, perPage = 10, onChange }) {
  const totalPages = Math.ceil(total / perPage)
  const start = (page - 1) * perPage + 1
  const end = Math.min(page * perPage, total)

  const pages = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-navy-700">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Showing <span className="font-medium text-slate-700 dark:text-slate-300">{start}–{end}</span> of{' '}
        <span className="font-medium text-slate-700 dark:text-slate-300">{total}</span> results
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-700 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
        {pages.map((p, i) => (
          p === '...'
            ? <span key={i} className="px-2 text-slate-400 text-xs">…</span>
            : (
              <button
                key={p}
                onClick={() => onChange(p)}
                className={clsx(
                  'w-7 h-7 rounded-lg text-xs font-medium transition-colors',
                  p === page
                    ? 'bg-accent-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-700'
                )}
              >
                {p}
              </button>
            )
        ))}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-700 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
