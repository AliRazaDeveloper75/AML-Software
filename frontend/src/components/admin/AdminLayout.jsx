import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Building2, Users, CreditCard,
  Shield, LogOut, ChevronLeft, ChevronRight, Bell,
  Moon, Sun, ExternalLink,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import clsx from 'clsx'

const navItems = [
  { label: 'Overview', icon: LayoutDashboard, path: '/admin' },
  { label: 'Organizations', icon: Building2, path: '/admin/organizations' },
  { label: 'Users', icon: Users, path: '/admin/users' },
  { label: 'Billing', icon: CreditCard, path: '/admin/billing' },
]

function NavItem({ item, collapsed }) {
  return (
    <NavLink
      to={item.path}
      end={item.path === '/admin'}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium',
          isActive
            ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
        )
      }
    >
      <item.icon size={18} className="flex-shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  )
}

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const sidebarW = collapsed ? 64 : 220

  const handleLogout = async () => {
    await logout()
    navigate('/auth/login')
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarW }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="flex-shrink-0 flex flex-col border-r border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 overflow-hidden"
        style={{ width: sidebarW }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 h-16 border-b border-slate-200 dark:border-white/5">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield size={16} className="text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-slate-900 dark:text-white text-sm font-bold leading-tight truncate">Al Merak</p>
              <p className="text-violet-500 dark:text-violet-400 text-xs truncate">Admin Panel</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavItem key={item.path} item={item} collapsed={collapsed} />
          ))}
        </nav>

        {/* Go to App link */}
        {!collapsed && (
          <div className="px-3 pb-2">
            <NavLink
              to="/dashboard"
              className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <ExternalLink size={13} />
              Switch to App
            </NavLink>
          </div>
        )}

        {/* User + collapse */}
        <div className="p-3 border-t border-slate-200 dark:border-white/5 space-y-2">
          {!collapsed && (
            <div className="flex items-center gap-2 px-2 py-1">
              <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {user?.full_name?.[0] ?? 'A'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs text-slate-800 dark:text-slate-200 font-medium truncate">{user?.full_name}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">Platform Admin</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all text-sm"
          >
            <LogOut size={16} className="flex-shrink-0" />
            {!collapsed && 'Sign Out'}
          </button>
          <button
            onClick={() => setCollapsed(v => !v)}
            className="flex items-center justify-center w-full py-1.5 text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 transition-colors"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
      </motion.aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-slate-900/50 backdrop-blur">
          <div>
            <h1 className="text-slate-900 dark:text-slate-100 font-semibold text-sm">Platform Administration</h1>
            <p className="text-slate-500 dark:text-slate-500 text-xs">Manage organizations, users, and billing across the platform</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
              <Bell size={15} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
