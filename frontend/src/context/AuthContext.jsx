/**
 * AuthContext — single source of truth for authentication state.
 *
 * State stored:
 *   user        — { id, email, full_name, role, permissions[], org }
 *   isLoading   — initial token validation in progress
 *   tempToken   — set when backend returns requires_2fa: true
 *
 * On mount:
 *   If access_token exists in localStorage → fetch /auth/me/ to hydrate user.
 *   On 401 → silent refresh via interceptor → re-fetch or logout.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api, { setToken, clearToken } from '../lib/api'
import queryClient from '../lib/queryClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [tempToken, setTempToken] = useState(null)  // 2FA pending state

  // ── Hydrate user on mount ────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setIsLoading(false)
      return
    }
    api.get('/auth/me/')
      .then(({ data }) => setUser(data.data ?? data))
      .catch(() => clearToken())
      .finally(() => setIsLoading(false))
  }, [])

  // ── Listen for forced logout events (from axios interceptor) ─
  useEffect(() => {
    const handler = () => logout(false)
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [])

  // ── Login ────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login/', { email, password })
    // Backend wraps success as { success, requires_2fa } OR { success, data: { access, user } }

    if (data.requires_2fa) {
      setTempToken(data.temp_token)
      return { requires_2fa: true }
    }

    const payload = data.data ?? data
    setToken(payload.access)
    setUser(payload.user)
    return { requires_2fa: false, user: payload.user }
  }, [])

  // ── Verify 2FA code ──────────────────────────────────────────
  const verify2FA = useCallback(async (code) => {
    if (!tempToken) throw new Error('No pending 2FA session.')
    const { data } = await api.post('/auth/2fa/verify/', {
      temp_token: tempToken,
      code,
    })
    const payload = data.data ?? data
    setToken(payload.access)
    // 2FA verify only returns the token — fetch user separately
    const meRes = await api.get('/auth/me/')
    setUser(meRes.data.data ?? meRes.data)
    setTempToken(null)
  }, [tempToken])

  // ── Logout ───────────────────────────────────────────────────
  const logout = useCallback(async (callApi = true) => {
    if (callApi) {
      try { await api.post('/auth/logout/') } catch (_) {}
    }
    clearToken()
    setUser(null)
    setTempToken(null)
    queryClient.clear()
  }, [])

  // ── Helpers ──────────────────────────────────────────────────
  const hasPermission = useCallback((perm) => {
    if (!user) return false
    return user.permissions?.includes(perm) || user.permissions?.includes('*')
  }, [user])

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      isLoading,
      tempToken,
      isAuthenticated: !!user,
      isAdmin: !!user?.is_staff,
      login,
      verify2FA,
      logout,
      hasPermission,
      org: user?.organization ?? null,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
