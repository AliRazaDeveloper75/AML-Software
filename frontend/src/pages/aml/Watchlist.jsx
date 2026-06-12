import { useState } from 'react'
import { Eye, Globe, Clock, RefreshCw, Plus } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Card from '../../components/common/Card'
import SearchBar from '../../components/common/SearchBar'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/common/Table'
import { useWatchlists } from '../../hooks/useAML'
import { formatDate } from '../../utils/helpers'
import clsx from 'clsx'

export default function Watchlist() {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('lists')

  const { data, isLoading } = useWatchlists()
  const watchlists = data?.results ?? data ?? []

  const activeLists = watchlists.filter(w => w.status === 'active')
  const totalRecords = watchlists.reduce((acc, w) => acc + (w.entry_count ?? 0), 0)

  const customEntries = watchlists
    .filter(w => w.is_custom)
    .flatMap(w => w.entries ?? [])
    .filter(e => !search || e.name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-5">
      <PageHeader
        title="Watchlist Monitoring"
        subtitle="Global sanctions, PEP, and adverse media watchlists"
        breadcrumb="AML Compliance"
        actions={
          <>
            <Button variant="outline" size="sm" icon={RefreshCw}>Refresh All</Button>
            <Button size="sm" icon={Plus}>Add Custom Entry</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Active Lists', value: activeLists.length, color: 'text-blue-600 bg-blue-100 dark:bg-blue-950/40' },
          { label: 'Total Records', value: isLoading ? '—' : totalRecords.toLocaleString(), color: 'text-slate-600 bg-slate-100 dark:bg-slate-800' },
          { label: 'Custom Entries', value: customEntries.length, color: 'text-purple-600 bg-purple-100 dark:bg-purple-950/40' },
          { label: 'Matches Today', value: data?.matches_today ?? '—', color: 'text-red-600 bg-red-100 dark:bg-red-950/40' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-navy-800 border border-slate-100 dark:border-navy-700 rounded-xl p-4 shadow-card flex items-center gap-3">
            <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', s.color)}>
              <Globe size={16} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{s.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1 bg-slate-100 dark:bg-navy-750 rounded-xl p-1 w-fit">
        {[{ value: 'lists', label: 'Watchlists' }, { value: 'custom', label: 'Custom Entries' }].map(t => (
          <button
            key={t.value}
            onClick={() => setActiveTab(t.value)}
            className={clsx(
              'px-4 py-2 text-sm font-medium rounded-lg transition-all',
              activeTab === t.value
                ? 'bg-white dark:bg-navy-700 text-slate-800 dark:text-slate-200 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'lists' && (
        <div className="space-y-3">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-navy-700 rounded-xl animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 dark:bg-navy-700 rounded animate-pulse w-1/3" />
                    <div className="h-3 bg-slate-100 dark:bg-navy-700 rounded animate-pulse w-1/2" />
                  </div>
                </Card>
              ))
            : watchlists.filter(w => !w.is_custom).map((wl) => (
                <Card key={wl.id} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-accent-100 dark:bg-accent-950/40 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Globe size={18} className="text-accent-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{wl.name}</p>
                      {wl.jurisdiction && <Badge variant="info">{wl.jurisdiction}</Badge>}
                      <Badge variant="success" dot>Active</Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{wl.authority ?? wl.source}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{(wl.entry_count ?? 0).toLocaleString()}</p>
                    <p className="text-xs text-slate-400">records</p>
                  </div>
                  {wl.last_updated && (
                    <div className="text-right flex-shrink-0 hidden sm:block">
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock size={11} />
                        Updated {formatDate(wl.last_updated)}
                      </div>
                    </div>
                  )}
                  <Button variant="ghost" size="sm" icon={Eye}>View</Button>
                </Card>
              ))
          }
          {!isLoading && watchlists.filter(w => !w.is_custom).length === 0 && (
            <div className="text-center py-12 text-sm text-slate-400">No watchlists configured.</div>
          )}
        </div>
      )}

      {activeTab === 'custom' && (
        <div className="bg-white dark:bg-navy-800 border border-slate-100 dark:border-navy-700 rounded-xl shadow-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-navy-700 flex items-center justify-between">
            <SearchBar value={search} onChange={setSearch} placeholder="Search custom entries..." className="max-w-sm" />
            <Button size="sm" icon={Plus}>Add Entry</Button>
          </div>
          <Table>
            <Thead>
              <tr>
                <Th>Name</Th>
                <Th>Type</Th>
                <Th>Reason</Th>
                <Th>Added By</Th>
                <Th>Date Added</Th>
                <Th>Status</Th>
                <Th align="right">Actions</Th>
              </tr>
            </Thead>
            <Tbody>
              {customEntries.length === 0 ? (
                <Tr>
                  <Td colSpan={7}>
                    <div className="text-center py-8 text-sm text-slate-400">No custom entries.</div>
                  </Td>
                </Tr>
              ) : (
                customEntries.map(entry => (
                  <Tr key={entry.id} highlight={entry.status === 'active'}>
                    <Td>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{entry.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{entry.reference_id ?? entry.id}</p>
                      </div>
                    </Td>
                    <Td muted>{entry.entity_type}</Td>
                    <Td muted>{entry.reason}</Td>
                    <Td muted>{entry.added_by_name}</Td>
                    <Td muted>{formatDate(entry.created_at)}</Td>
                    <Td>
                      <Badge variant={entry.status === 'active' ? 'danger' : 'warning'} dot>
                        {entry.status === 'active' ? 'Active' : 'Pending Review'}
                      </Badge>
                    </Td>
                    <Td align="right">
                      <Button size="sm" variant="ghost" icon={Eye}>View</Button>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </div>
      )}
    </div>
  )
}
