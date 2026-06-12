import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AdminRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/auth/login" replace />
  if (!user?.is_staff) return <Navigate to="/dashboard" replace />

  return children
}
