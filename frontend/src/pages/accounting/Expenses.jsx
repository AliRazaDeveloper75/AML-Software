import { useState } from 'react'
import { Plus, Download, DollarSign } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Card from '../../components/common/Card'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/common/Table'
import { formatCurrency, formatDate } from '../../utils/helpers'

const expenses = [
  { id: 'EXP-001', date: '2025-05-10', category: 'Salaries', description: 'Staff payroll - May 2025', amount: 380000, vendor: 'Internal', status: 'approved' },
  { id: 'EXP-002', date: '2025-05-08', category: 'Technology', description: 'AWS Cloud Services - April invoice', amount: 24500, vendor: 'Amazon Web Services', status: 'approved' },
  { id: 'EXP-003', date: '2025-05-07', category: 'Subscriptions', description: 'World-Check AML Database', amount: 18000, vendor: 'Refinitiv', status: 'approved' },
  { id: 'EXP-004', date: '2025-05-05', category: 'Office', description: 'DIFC office rent - May 2025', amount: 65000, vendor: 'DIFC Properties', status: 'pending' },
  { id: 'EXP-005', date: '2025-05-03', category: 'Legal', description: 'Compliance legal advisory', amount: 32000, vendor: 'Al Tamimi & Co', status: 'approved' },
  { id: 'EXP-006', date: '2025-05-01', category: 'Marketing', description: 'Digital marketing Q2 campaign', amount: 45000, vendor: 'Media Agency LLC', status: 'pending' },
]

const categoryColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6']
const expByCategory = [
  { name: 'Salaries', value: 380000 },
  { name: 'Office', value: 65000 },
  { name: 'Marketing', value: 45000 },
  { name: 'Legal', value: 32000 },
  { name: 'Technology', value: 24500 },
  { name: 'Subscriptions', value: 18000 },
]

export default function Expenses() {
  const total = expenses.reduce((a, e) => a + e.amount, 0)
  const statusV = { approved: 'success', pending: 'warning', rejected: 'danger' }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Expenses"
        subtitle="Track and manage company expenses"
        breadcrumb="Accounting"
        actions={
          <>
            <Button variant="outline" size="sm" icon={Download}>Export</Button>
            <Button size="sm" icon={Plus}>Add Expense</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Expenses', value: formatCurrency(total), color: 'text-slate-800 dark:text-slate-100' },
              { label: 'Approved', value: formatCurrency(expenses.filter(e => e.status === 'approved').reduce((a,e) => a+e.amount, 0)), color: 'text-green-600' },
              { label: 'Pending', value: formatCurrency(expenses.filter(e => e.status === 'pending').reduce((a,e) => a+e.amount, 0)), color: 'text-amber-600' },
            ].map(s => (
              <Card key={s.label} className="text-center py-4">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{s.label}</p>
              </Card>
            ))}
          </div>

          <div className="bg-white dark:bg-navy-800 border border-slate-100 dark:border-navy-700 rounded-xl shadow-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-navy-700">
              <h3 className="section-title">Expense List</h3>
            </div>
            <Table>
              <Thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Description</Th>
                  <Th>Category</Th>
                  <Th>Vendor</Th>
                  <Th align="right">Amount</Th>
                  <Th>Status</Th>
                </tr>
              </Thead>
              <Tbody>
                {expenses.map(exp => (
                  <Tr key={exp.id}>
                    <Td muted>{formatDate(exp.date)}</Td>
                    <Td>
                      <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{exp.description}</p>
                      <p className="text-xs text-slate-400 font-mono">{exp.id}</p>
                    </Td>
                    <Td><Badge variant="info">{exp.category}</Badge></Td>
                    <Td muted>{exp.vendor}</Td>
                    <Td align="right"><span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(exp.amount)}</span></Td>
                    <Td><Badge variant={statusV[exp.status]} dot>{exp.status.charAt(0).toUpperCase() + exp.status.slice(1)}</Badge></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
        </div>

        <Card>
          <h3 className="section-title mb-4">By Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={expByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {expByCategory.map((_, i) => (
                  <Cell key={i} fill={categoryColors[i]} />
                ))}
              </Pie>
              <Tooltip formatter={v => [formatCurrency(v), '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-2">
            {expByCategory.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: categoryColors[i] }} />
                  <span className="text-xs text-slate-600 dark:text-slate-400">{item.name}</span>
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
