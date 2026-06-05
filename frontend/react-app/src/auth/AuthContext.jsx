import { createContext, useContext, useEffect, useState } from 'react'
import { auth as authApi, getToken, clearTokens } from '../lib/api'

const AuthContext = createContext(null)

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)  // API user object (includes role, bhojanshalaId)
  const [loading, setLoading] = useState(true)

  // Hydrate from existing JWT on mount
  useEffect(() => {
    if (!getToken()) { setLoading(false); return }
    authApi.me()
      .then(({ data }) => setUser(data))
      .catch(() => clearTokens())
      .finally(() => setLoading(false))
  }, [])

  const signIn = async (email, password) => {
    const data = await authApi.login(email, password)  // stores token in localStorage
    setUser(data.user)
    return data
  }

  const signOut = async () => {
    await authApi.logout()
    setUser(null)
  }

  const refreshUser = async () => {
    try {
      const { data } = await authApi.me()
      setUser(data)
    } catch {
      clearTokens()
      setUser(null)
    }
  }

  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const isAdmin      = user?.role === 'ADMIN'

  return (
    <AuthContext.Provider value={{
      user, loading,
      isSuperAdmin, isAdmin,
      signIn, signOut, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
