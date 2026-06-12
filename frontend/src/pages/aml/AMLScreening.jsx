import { useState, useCallback } from 'react'
import { Search, Shield, AlertTriangle, CheckCircle, Clock, RefreshCw, Download } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Card from '../../components/common/Card'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import { useScreenings } from '../../hooks/useAML'
import { formatDate } from '../../utils/helpers'
import clsx from 'clsx'

const resultConfig = {
  match: { label: 'Match Found', variant: 'danger', icon: AlertTriangle },
  clear: { label: 'Clear', variant: 'success', icon: CheckCircle },
  review: { label: 'Review', variant: 'warning', icon: Clock },
  pending: { label: 'Pending', variant: 'neutral', icon: Clock },
}

const statusToOverall = (s) => {
  if (s?.sanctions_result === 'match') return 'flagged'
  if (s?.pep_result === 'match') return 'review'
  return 'clear'
}

export default function AMLScreening() {
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [page, setPage] = useState(1)

  const params = {
    page,
    search: search || undefined,
    ...(selectedStatus !== 'all' ? { status: selectedStatus } : {}),
  }

  const { data, isLoading, isError } = useScreenings(params)
  const screenings = data?.results ?? []
  const totalCount = data?.count ?? 0

  const stats = {
    total: totalCount,
    clear: data?.stats?.clear ?? 0,
    review: data?.stats?.review ?? 0,
    flagged: data?.stats?.flagged ?? 0,
  }

  const handleSearch = useCallback((v) => { setSearch(v); setPage(1) }, [])
  const handleStatus = useCallback((v) => { setSelectedStatus(v); setPage(1) }, [])

  return (
    <div className="space-y-5">
      <PageHeader
        title="AML Screening"
        subtitle="PEP, sanctions, and watchlist screening for all customers"
        breadcrumb="AML Compliance"
        actions={
          <>
            <Button variant="outline" size="sm" icon={Download}>Export Results</Button>
            <Button size="sm" icon={RefreshCw}>Run Full Screening</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Screened', value: stats.total, icon: Shield, color: 'text-blue-600 bg-blue-100 dark:bg-blue-950/40' },
          { label: 'Clear', value: stats.clear, icon: CheckCircle, color: 'text-green-600 bg-green-100 dark:bg-green-950/40' },
          { label: 'Under Review', value: stats.review, icon: Clock, color: 'text-amber-600 bg-amber-100 dark:bg-amber-950/40' },
          { label: 'Flagged', value: stats.flagged, icon: AlertTriangle, color: 'text-red-600 bg-red-100 dark:bg-red-950/40' },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-navy-800 border border-slate-100 dark:border-navy-700 rounded-xl p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', s.color)}>
                <s.icon size={16} />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{s.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'PEP Screening', desc: 'Politically Exposed Persons database — 1.2M+ records', updated: 'Updated daily' },
          { label: 'Sanctions Screening', desc: 'OFAC SDN, UN Security Council, EU Consolidated List', updated: 'Updated hourly' },
          { label: 'Adverse Media', desc: 'Global news and regulatory enforcement database', updated: 'Updated in real-time' },
        ].map(s => (
          <Card key={s.label} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{s.label}</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-green-600 dark:text-green-400">Live</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{s.desc}</p>
            <p className="text-xs text-slate-400">{s.updated}</p>
          </Card>
        ))}
      </div>

      <div className="bg-white dark:bg-navy-800 border border-slate-100 dark:border-navy-700 rounded-xl shadow-card overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 dark:border-navy-700">
          <div className="flex items-center gap-2 flex-1 max-w-sm bg-slate-50 dark:bg-navy-750 border border-slate-200 dark:border-navy-600 rounded-lg px-3 py-2">
            <Search size={14} className="text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search customers..."
              className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {['all', 'flagged', 'review', 'clear'].map(t => (
              <button
                key={t}
                onClick={() => handleStatus(t)}
                className={clsx(
                  'px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all',
                  selectedStatus === t
                    ? 'bg-accent-600 text-white'
                    : 'bg-slate-100 dark:bg-navy-750 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-navy-700'
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {isError && (
          <div className="px-5 py-8 text-center text-sm text-red-500">Failed to load screenings.</div>
        )}

        <Table>
          <Thead>
            <tr>
              <Th>Customer</Th>
              <Th>PEP Check</Th>
              <Th>Sanctions Check</Th>
              <Th>Watchlist Check</Th>
              <Th>Overall Status</Th>
              <Th>Last Screened</Th>
              <Th align="right">Action</Th>
            </tr>
          </Thead>
          <Tbody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <Td key={j}><div className="h-4 bg-slate-100 dark:bg-navy-700 rounded animate-pulse w-3/4" /></Td>
                    ))}
                  </Tr>
                ))
              : screenings.map((s) => {
                  const overall = statusToOverall(s)
                  const OverallIcon = overall === 'flagged' ? AlertTriangle : overall === 'review' ? Clock : CheckCircle
                  const pepCfg = resultConfig[s.pep_result ?? 'clear']
                  const sanctionsCfg = resultConfig[s.sanctions_result ?? 'clear']
                  const watchlistCfg = resultConfig[s.watchlist_result ?? 'clear']
                  return (
                    <Tr key={s.id} highlight={overall === 'flagged'}>
                      <Td>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{s.customer_name}</p>
                          <p className="text-xs text-slate-400 font-mono">{s.customer_number}</p>
                        </div>
                      </Td>
                      {[pepCfg, sanctionsCfg, watchlistCfg].map((cfg, i) => {
                        const Icon = cfg.icon
                        return (
                          <Td key={i}>
                            <div className="flex items-center gap-1.5">
                              <Icon size={13} className={cfg.variant === 'danger' ? 'text-red-500' : cfg.variant === 'warning' ? 'text-amber-500' : 'text-green-500'} />
                              <Badge variant={cfg.variant}>{cfg.label}</Badge>
                            </div>
                          </Td>
                        )
                      })}
                      <Td>
                        <div className="flex items-center gap-1.5">
                          <OverallIcon size={13} className={overall === 'flagged' ? 'text-red-500' : overall === 'review' ? 'text-amber-500' : 'text-green-500'} />
                          <span className={clsx('text-xs font-semibold capitalize', overall === 'flagged' ? 'text-red-600' : overall === 'review' ? 'text-amber-600' : 'text-green-600')}>
                            {overall}
                          </span>
                        </div>
                      </Td>
                      <Td muted>{formatDate(s.screened_at)}</Td>
                      <Td align="right">
                        {overall !== 'clear' && <Button size="sm" variant="outline">Review</Button>}
                      </Td>
                    </Tr>
                  )
                })
            }
          </Tbody>
        </Table>
        <Pagination page={page} total={totalCount} perPage={20} onChange={setPage} />
      </div>
    </div>
  )
}
