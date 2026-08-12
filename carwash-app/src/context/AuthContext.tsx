import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { MemberRole, PermissionKey } from '../types/database'

const ALL_PERMISSIONS: PermissionKey[] = [
  'pos',
  'citas',
  'clientes',
  'catalogo_ver',
  'catalogo_editar',
  'compras',
  'empleados',
  'caja',
  'reportes',
  'configuracion',
]

interface AuthState {
  session: Session | null
  user: User | null
  businessId: string | null
  businessName: string | null
  currency: string
  role: MemberRole | null
  isAdmin: boolean
  permissions: Record<PermissionKey, boolean>
  can: (key: PermissionKey) => boolean
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

function emptyPermissions(): Record<PermissionKey, boolean> {
  return ALL_PERMISSIONS.reduce((acc, key) => ({ ...acc, [key]: false }), {} as Record<PermissionKey, boolean>)
}

function fullPermissions(): Record<PermissionKey, boolean> {
  return ALL_PERMISSIONS.reduce((acc, key) => ({ ...acc, [key]: true }), {} as Record<PermissionKey, boolean>)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState<string | null>(null)
  const [currency, setCurrency] = useState('MXN')
  const [role, setRole] = useState<MemberRole | null>(null)
  const [permissions, setPermissions] = useState<Record<PermissionKey, boolean>>(emptyPermissions())

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
      setPermissions(emptyPermissions())
      return
    }
    const businessIdValue = data.business_id as string
    const roleValue = data.role as MemberRole
    setBusinessId(businessIdValue)
    setRole(roleValue)
    const business = data.businesses as unknown as { name: string; currency: string } | null
    setBusinessName(business?.name ?? null)
    setCurrency(business?.currency || 'MXN')

    if (roleValue === 'admin') {
      setPermissions(fullPermissions())
    } else {
      const { data: perms } = await supabase
        .from('role_permissions')
        .select('permission_key, allowed')
        .eq('business_id', businessIdValue)
        .eq('role', 'staff')
      const map = emptyPermissions()
      for (const p of perms ?? []) {
        map[p.permission_key as PermissionKey] = p.allowed
      }
      setPermissions(map)
    }
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
        setPermissions(emptyPermissions())
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
    permissions,
    can: (key) => permissions[key] === true,
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
