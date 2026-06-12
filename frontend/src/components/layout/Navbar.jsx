import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Menu, Search, Bell, Sun, Moon, ChevronDown,
  User, Settings, LogOut, Shield,
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import clsx from 'clsx'

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
}

function formatRole(role) {
  if (!role) return 'User'
  return role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function NotifDropdown({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-navy-800 rounded-xl shadow-elevated border border-slate-100 dark:border-navy-700 overflow-hidden z-50"
    >
      <div className="px-4 py-3 border-b border-slate-100 dark:border-navy-700">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</p>
      </div>
      <div className="px-4 py-8 text-center">
        <Bell size={20} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
        <p className="text-xs text-slate-400 dark:text-slate-500">No notifications yet</p>
      </div>
    </motion.div>
  )
}

function ProfileDropdown({ user, onClose }) {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = async () => {
    onClose()
    await logout()
    navigate('/auth/login')
  }

  const items = [
    { label: 'Settings', icon: Settings, action: () => { navigate('/settings'); onClose() } },
    { label: 'Sign Out', icon: LogOut, action: handleLogout, danger: true },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-navy-800 rounded-xl shadow-elevated border border-slate-100 dark:border-navy-700 overflow-hidden z-50"
    >
      <div className="px-4 py-3 border-b border-slate-100 dark:border-navy-700">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.full_name || '—'}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email || ''}</p>
        {user?.role && (
          <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-accent-100 dark:bg-accent-950/30 text-accent-700 dark:text-accent-400 text-xs rounded-full font-medium">
            <Shield size={10} />
            {formatRole(user.role)}
          </span>
        )}
        {user?.is_staff && (
          <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 text-xs rounded-full font-medium">
            <Shield size={10} />
            Platform Admin
          </span>
        )}
      </div>
      {items.map((item) => {
        const Icon = item.icon
        return (
          <button
            key={item.label}
            onClick={item.action}
            className={clsx(
              'w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors',
              item.danger
                ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-750'
            )}
          >
            <Icon size={15} />
            {item.label}
          </button>
        )
      })}
    </motion.div>
  )
}

export default function Navbar({ onMenuToggle }) {
  const { theme, toggleTheme } = useTheme()
  const { user } = useAuth()
  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [search, setSearch] = useState('')
  const notifRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initials = getInitials(user?.full_name)
  const roleLabel = user?.is_staff ? 'Platform Admin' : formatRole(user?.role)

  return (
    <header className="h-14 bg-white dark:bg-navy-900 border-b border-slate-100 dark:border-navy-800 flex items-center gap-4 px-4 sticky top-0 z-30 shadow-sm">
      <button onClick={onMenuToggle} className="btn-ghost p-2 -ml-1">
        <Menu size={18} />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md hidden sm:flex items-center gap-2 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg px-3 py-2">
        <Search size={14} className="text-slate-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search customers, alerts, transactions..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 outline-none"
        />
        <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-200 dark:bg-navy-700 text-slate-500 text-xs rounded font-mono">
          /
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-1">
        {/* Theme toggle */}
        <button onClick={toggleTheme} className="btn-ghost p-2">
          {theme === 'dark'
            ? <Sun size={16} className="text-amber-400" />
            : <Moon size={16} />
          }
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotifs(v => !v); setShowProfile(false) }}
            className="btn-ghost p-2 relative"
          >
            <Bell size={16} />
          </button>
          <AnimatePresence>
            {showNotifs && <NotifDropdown onClose={() => setShowNotifs(false)} />}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setShowProfile(v => !v); setShowNotifs(false) }}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
          >
            <div className="w-7 h-7 bg-gradient-to-br from-accent-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {initials || <User size={12} />}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                {user?.full_name || '—'}
              </p>
              <p className="text-xs text-slate-400 leading-tight">{roleLabel}</p>
            </div>
            <ChevronDown size={12} className="text-slate-400 hidden md:block" />
          </button>
          <AnimatePresence>
            {showProfile && <ProfileDropdown user={user} onClose={() => setShowProfile(false)} />}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
