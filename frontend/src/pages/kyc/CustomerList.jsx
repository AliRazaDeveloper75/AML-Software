import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Download, Users, Eye, MoreHorizontal, AlertTriangle, CheckCircle } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import SearchBar from '../../components/common/SearchBar'
import Pagination from '../../components/common/Pagination'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/common/Table'
import { useCustomers } from '../../hooks/useKYC'
import { formatDate } from '../../utils/helpers'
import clsx from 'clsx'

const kycVariant = { verified: 'success', pending: 'warning', rejected: 'danger', under_review: 'info' }
const kycLabel = { verified: 'Verified', pending: 'Pending', rejected: 'Rejected', under_review: 'Under Review' }
const riskVariant = { high: 'high', critical: 'critical', medium: 'medium', low: 'low' }

const FILTER_PARAM = {
  'All': {},
  'Low Risk': { risk_level: 'low' },
  'Medium Risk': { risk_level: 'medium' },
  'High Risk': { risk_level: 'high' },
  'PEP': { is_pep: true },
  'Sanctions': { sanctions_match: true },
}
const filters = Object.keys(FILTER_PARAM)

export default function CustomerList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [page, setPage] = useState(1)

  const params = { page, search: search || undefined, ...FILTER_PARAM[activeFilter] }
  const { data, isLoading, isError } = useCustomers(params)

  const customers = data?.results ?? []
  const totalCount = data?.count ?? 0
  const totalPages = data?.total_pages ?? 1

  const handleFilterChange = useCallback((f) => {
    setActiveFilter(f)
    setPage(1)
  }, [])

  const handleSearchChange = useCallback((v) => {
    setSearch(v)
    setPage(1)
  }, [])

  const summaryCards = [
    { label: 'Total', value: totalCount, icon: Users, color: 'text-blue-600 bg-blue-100 dark:bg-blue-950/40' },
    { label: 'Verified', value: data?.stats?.verified ?? '—', icon: CheckCircle, color: 'text-green-600 bg-green-100 dark:bg-green-950/40' },
    { label: 'High Risk', value: data?.stats?.high_risk ?? '—', icon: AlertTriangle, color: 'text-red-600 bg-red-100 dark:bg-red-950/40' },
    { label: 'PEP/Sanctions', value: data?.stats?.pep_or_sanctions ?? '—', icon: AlertTriangle, color: 'text-purple-600 bg-purple-100 dark:bg-purple-950/40' },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Customer Management"
        subtitle={`${totalCount} total customers`}
        breadcrumb="KYC Management"
        actions={
          <>
            <Button variant="outline" size="sm" icon={Download}>Export</Button>
            <Button size="sm" icon={Plus} onClick={() => navigate('/kyc/add-customer')}>
              Add Customer
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {summaryCards.map((s) => (
          <div key={s.label} className="bg-white dark:bg-navy-800 border border-slate-100 dark:border-navy-700 rounded-xl p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center', s.color)}>
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

      <div className="bg-white dark:bg-navy-800 border border-slate-100 dark:border-navy-700 rounded-xl shadow-card overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-5 py-3.5 border-b border-slate-100 dark:border-navy-700">
          <SearchBar
            value={search}
            onChange={handleSearchChange}
            placeholder="Search name, ID, email..."
            className="flex-1 max-w-sm"
          />
          <div className="flex items-center gap-1.5 flex-wrap">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                className={clsx(
                  'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                  activeFilter === f
                    ? 'bg-accent-600 text-white'
                    : 'bg-slate-100 dark:bg-navy-750 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-navy-700'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {isError && (
          <div className="px-5 py-8 text-center text-sm text-red-500">
            Failed to load customers. Please try again.
          </div>
        )}

        <Table>
          <Thead>
            <tr>
              <Th>Customer</Th>
              <Th>Type</Th>
              <Th>KYC Status</Th>
              <Th>Risk Level</Th>
              <Th>Risk Score</Th>
              <Th>PEP</Th>
              <Th>Sanctions</Th>
              <Th>Last Activity</Th>
              <Th align="right">Actions</Th>
            </tr>
          </Thead>
          <Tbody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <Tr key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <Td key={j}>
                        <div className="h-4 bg-slate-100 dark:bg-navy-700 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                      </Td>
                    ))}
                  </Tr>
                ))
              : customers.map((c) => (
                  <Tr
                    key={c.id}
                    onClick={() => navigate(`/kyc/customers/${c.id}`)}
                    highlight={c.sanctions_match}
                  >
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {c.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{c.full_name}</p>
                          <p className="text-xs text-slate-400 font-mono">{c.customer_number}</p>
                        </div>
                      </div>
                    </Td>
                    <Td muted>{c.customer_type}</Td>
                    <Td>
                      <Badge variant={kycVariant[c.kyc_status] ?? 'neutral'} dot>
                        {kycLabel[c.kyc_status] ?? c.kyc_status}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge variant={riskVariant[c.risk_level] ?? 'neutral'} dot>
                        {c.risk_level ? c.risk_level.charAt(0).toUpperCase() + c.risk_level.slice(1) : '—'}
                      </Badge>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-200 dark:bg-navy-700 rounded-full overflow-hidden">
                          <div
                            className={clsx('h-full rounded-full transition-all', c.risk_score >= 80 ? 'bg-red-500' : c.risk_score >= 60 ? 'bg-amber-500' : 'bg-green-500')}
                            style={{ width: `${c.risk_score ?? 0}%` }}
                          />
                        </div>
                        <span className={clsx('text-xs font-semibold', c.risk_score >= 80 ? 'text-red-600' : c.risk_score >= 60 ? 'text-amber-600' : 'text-green-600')}>
                          {c.risk_score ?? '—'}
                        </span>
                      </div>
                    </Td>
                    <Td>
                      {c.is_pep
                        ? <Badge variant="warning" dot>PEP</Badge>
                        : <span className="text-xs text-slate-400">No</span>
                      }
                    </Td>
                    <Td>
                      {c.sanctions_match
                        ? <Badge variant="danger" dot>Match</Badge>
                        : <span className="text-xs text-slate-400">Clear</span>
                      }
                    </Td>
                    <Td muted>{formatDate(c.last_activity ?? c.created_at)}</Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/kyc/customers/${c.id}`) }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-700 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <Eye size={14} />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-700 text-slate-400 transition-colors">
                          <MoreHorizontal size={14} />
                        </button>
                      </div>
                    </Td>
                  </Tr>
                ))
            }
          </Tbody>
        </Table>

        <Pagination page={page} total={totalCount} perPage={20} onChange={setPage} />
      </div>
    </div>
  )
}
