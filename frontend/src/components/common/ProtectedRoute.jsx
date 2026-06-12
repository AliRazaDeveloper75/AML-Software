import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/**
 * Wraps a route requiring authentication.
 * - Redirects to /auth/login with ?next= if not authenticated.
 * - Optionally checks a specific permission.
 */
export default function ProtectedRoute({ children, permission = null }) {
  const { isAuthenticated, isLoading, hasPermission } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-navy-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location.pathname }} replace />
  }

  if (permission && !hasPermission(permission)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">403</p>
          <p className="text-slate-500 mt-2">You don't have permission to view this page.</p>
        </div>
      </div>
    )
  }

  return children
}
