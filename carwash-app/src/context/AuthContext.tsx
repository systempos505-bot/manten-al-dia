import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { MemberRole } from '../types/database'

interface AuthState {
  session: Session | null
  user: User | null
  businessId: string | null
  businessName: string | null
  currency: string
  role: MemberRole | null
  isAdmin: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (
    email: string,
    password: string,
    opts: { businessName?: string; inviteCode?: string },
  ) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshBusiness: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState<string | null>(null)
  const [currency, setCurrency] = useState('MXN')
  const [role, setRole] = useState<MemberRole | null>(null)

  async function loadBusiness(userId: string) {
    const { data, error } = await supabase
      .from('business_members')
      .select('business_id, role, businesses(name, currency)')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()

    if (error || !data) {
      setBusinessId(null)
      setBusinessName(null)
      setCurrency('MXN')
      setRole(null)
      return
    }
    setBusinessId(data.business_id as string)
    setRole(data.role as MemberRole)
    const business = data.businesses as unknown as { name: string; currency: string } | null
    setBusinessName(business?.name ?? null)
    setCurrency(business?.currency || 'MXN')
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session?.user) {
        loadBusiness(data.session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession?.user) {
        loadBusiness(newSession.user.id)
      } else {
        setBusinessId(null)
        setBusinessName(null)
        setCurrency('MXN')
        setRole(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  async function signUp(email: string, password: string, opts: { businessName?: string; inviteCode?: string }) {
    const data = opts.inviteCode
      ? { invite_code: opts.inviteCode.trim() }
      : { business_name: opts.businessName || 'Mi Auto Lavado' }
    const { error } = await supabase.auth.signUp({ email, password, options: { data } })
    return { error: error?.message ?? null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function refreshBusiness() {
    if (session?.user) await loadBusiness(session.user.id)
  }

  const value: AuthState = {
    session,
    user: session?.user ?? null,
    businessId,
    businessName,
    currency,
    role,
    isAdmin: role === 'admin',
    loading,
    signIn,
    signUp,
    signOut,
    refreshBusiness,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
