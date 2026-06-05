import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../utils/supabase/client'

const AuthContext = createContext(null)

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, bhojanshalas(id, name_en, name_gu, city_en, city_gu)')
    .eq('id', userId)
    .single()
  if (error) return null
  return data
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Hydrate from existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const p = await fetchProfile(session.user.id)
        setProfile(p)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          const p = await fetchProfile(session.user.id)
          setProfile(p)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  // Register is used by new admins who were pre-registered by Super Admin
  const register = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const refreshProfile = async () => {
    if (!user) return
    const p = await fetchProfile(user.id)
    setProfile(p)
  }

  const isSuperAdmin = profile?.role === 'super_admin'
  const isAdmin      = profile?.role === 'admin'

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      isSuperAdmin, isAdmin,
      signIn, register, signOut, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
