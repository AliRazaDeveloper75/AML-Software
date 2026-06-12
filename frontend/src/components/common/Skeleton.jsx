import clsx from 'clsx'

export function Skeleton({ className }) {
  return (
    <div className={clsx(
      'animate-pulse bg-slate-200 dark:bg-navy-700 rounded-lg',
      className
    )} />
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-navy-800 border border-slate-100 dark:border-navy-700 rounded-xl p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="space-y-0">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3.5 border-t border-slate-100 dark:border-navy-700">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" style={{ opacity: 1 - j * 0.1 }} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <CardSkeleton key={i} />)}
      </div>
      <div className="bg-white dark:bg-navy-800 border border-slate-100 dark:border-navy-700 rounded-xl shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-navy-700">
          <Skeleton className="h-4 w-32" />
        </div>
        <TableSkeleton />
      </div>
    </div>
  )
}
