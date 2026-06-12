import { useState } from 'react'
import { motion } from 'framer-motion'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const sidebarW = collapsed ? 64 : 240

  return (
    <div className="min-h-screen bg-surface-light dark:bg-navy-950">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
      <motion.div
        animate={{ marginLeft: sidebarW }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="flex flex-col min-h-screen"
      >
        <Navbar onMenuToggle={() => setCollapsed(v => !v)} />
        <main className="flex-1 p-5 md:p-6 overflow-auto">
          {children}
        </main>
      </motion.div>
    </div>
  )
}
