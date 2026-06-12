import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, Shield, Calculator, Activity,
  FileText, UserCog, Settings, CreditCard, ChevronDown,
  ChevronRight, Building2, X, TrendingUp, AlertTriangle,
  Search, BarChart3, Receipt, DollarSign, BookOpen,
  Scale, FileBarChart, Eye, Layers
} from 'lucide-react'
import clsx from 'clsx'

const navGroups = [
  {
    label: null,
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    ],
  },
  {
    label: 'Customer & KYC',
    items: [
      { label: 'All Customers', icon: Users, path: '/kyc/customers' },
      { label: 'Add Customer', icon: Users, path: '/kyc/add-customer' },
    ],
  },
  {
    label: 'AML Compliance',
    items: [
      { label: 'AML Screening', icon: Shield, path: '/aml/screening' },
      { label: 'Alerts', icon: AlertTriangle, path: '/aml/alerts' },
      { label: 'Watchlist', icon: Eye, path: '/aml/watchlist' },
    ],
  },
  {
    label: 'Accounting',
    items: [
      { label: 'Invoices', icon: Receipt, path: '/accounting/invoices' },
      { label: 'Expenses', icon: DollarSign, path: '/accounting/expenses' },
      { label: 'Transactions', icon: Layers, path: '/accounting/transactions' },
      { label: 'Profit & Loss', icon: TrendingUp, path: '/accounting/profit-loss' },
      { label: 'Balance Sheet', icon: Scale, path: '/accounting/balance-sheet' },
      { label: 'VAT Reports', icon: FileBarChart, path: '/accounting/vat-reports' },
      { label: 'Corporate Tax', icon: BookOpen, path: '/accounting/corporate-tax' },
    ],
  },
  {
    label: 'Monitoring',
    items: [
      { label: 'Transaction Monitor', icon: Activity, path: '/monitoring' },
    ],
  },
  {
    label: 'Reports',
    items: [
      { label: 'Reports & STR', icon: FileText, path: '/reports' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'User Management', icon: UserCog, path: '/users' },
      { label: 'Settings', icon: Settings, path: '/settings' },
      { label: 'Billing', icon: CreditCard, path: '/billing' },
    ],
  },
]

function SidebarItem({ item, collapsed }) {
  const location = useLocation()
  const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
  const Icon = item.icon

  return (
    <NavLink to={item.path}>
      <motion.div
        whileHover={{ x: collapsed ? 0 : 2 }}
        className={clsx(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer relative group',
          isActive
            ? 'bg-accent-600/15 text-accent-400'
            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
        )}
      >
        {isActive && (
          <motion.div
            layoutId="sidebar-active"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent-500 rounded-full"
          />
        )}
        <Icon size={16} className={clsx('flex-shrink-0', isActive ? 'text-accent-400' : '')} />
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="truncate"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
        {collapsed && (
          <div className="absolute left-14 bg-navy-700 text-slate-200 text-xs px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
            {item.label}
          </div>
        )}
      </motion.div>
    </NavLink>
  )
}

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-full bg-navy-950 border-r border-navy-800/50 flex flex-col z-40 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-navy-800/50 flex-shrink-0">
        <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-700 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
          <Shield size={16} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="overflow-hidden"
            >
              <p className="text-white font-bold text-sm leading-tight">Al Merak AML</p>
              <p className="text-slate-500 text-xs">Compliance Platform</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto no-scrollbar py-3">
        {navGroups.map((group, gi) => (
          <div key={gi} className="mb-1">
            {group.label && !collapsed && (
              <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider px-4 py-2 mt-3">
                {group.label}
              </p>
            )}
            {group.label && collapsed && (
              <div className="mx-3 my-2 h-px bg-navy-800/60" />
            )}
            <div className="px-2 space-y-0.5">
              {group.items.map((item) => (
                <SidebarItem key={item.path} item={item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-navy-800/50 flex-shrink-0">
        <div className={clsx(
          'flex items-center gap-3 p-2 rounded-lg',
          collapsed ? 'justify-center' : ''
        )}>
          <div className="w-8 h-8 bg-gradient-to-br from-accent-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
            SZ
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-slate-200 text-xs font-semibold truncate">Sara Al Zaabi</p>
                <p className="text-slate-500 text-xs truncate">Super Admin</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  )
}
