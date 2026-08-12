import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { setDateTimeFormat } from '../lib/format'
import type { DateFormat, MemberRole, PermissionKey, TimeFormat } from '../types/database'

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
  secondaryCurrency: string | null
  exchangeRate: number
  currencyDecimals: number
  quantityDecimals: number
  dateFormat: DateFormat
  timeFormat: TimeFormat
  logoUrl: string | null
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
  const [secondaryCurrency, setSecondaryCurrency] = useState<string | null>(null)
  const [exchangeRate, setExchangeRate] = useState(1)
  const [currencyDecimals, setCurrencyDecimals] = useState(2)
  const [quantityDecimals, setQuantityDecimals] = useState(2)
  const [dateFormat, setDateFormat] = useState<DateFormat>('DD/MM/YYYY')
  const [timeFormat, setTimeFormat] = useState<TimeFormat>('24h')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [role, setRole] = useState<MemberRole | null>(null)
  const [permissions, setPermissions] = useState<Record<PermissionKey, boolean>>(emptyPermissions())

  function resetBusinessState() {
    setBusinessId(null)
    setBusinessName(null)
    setCurrency('MXN')
    setSecondaryCurrency(null)
    setExchangeRate(1)
    setCurrencyDecimals(2)
    setQuantityDecimals(2)
    setDateFormat('DD/MM/YYYY')
    setTimeFormat('24h')
    setLogoUrl(null)
    setRole(null)
    setPermissions(emptyPermissions())
    setDateTimeFormat('DD/MM/YYYY', '24h')
  }

  async function loadBusiness(userId: string) {
    const { data, error } = await supabase
      .from('business_members')
      .select(
        'business_id, role, custom_role_id, businesses(name, currency, secondary_currency, exchange_rate, currency_decimals, quantity_decimals, date_format, time_format, logo_url)',
      )
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()

    if (error || !data) {
      resetBusinessState()
      return
    }
    const businessIdValue = data.business_id as string
    const roleValue = data.role as MemberRole
    const customRoleId = data.custom_role_id as string | null
    setBusinessId(businessIdValue)
    setRole(roleValue)
    const business = data.businesses as unknown as {
      name: string
      currency: string
      secondary_currency: string | null
      exchange_rate: number
      currency_decimals: number
      quantity_decimals: number
      date_format: DateFormat
      time_format: TimeFormat
      logo_url: string | null
    } | null
    setBusinessName(business?.name ?? null)
    setCurrency(business?.currency || 'MXN')
    setSecondaryCurrency(business?.secondary_currency ?? null)
    setExchangeRate(business?.exchange_rate ?? 1)
    setCurrencyDecimals(business?.currency_decimals ?? 2)
    setQuantityDecimals(business?.quantity_decimals ?? 2)
    const df = business?.date_format || 'DD/MM/YYYY'
    const tf = business?.time_format || '24h'
    setDateFormat(df)
    setTimeFormat(tf)
    setDateTimeFormat(df, tf)
    setLogoUrl(business?.logo_url ?? null)

    if (roleValue === 'admin') {
      setPermissions(fullPermissions())
    } else if (customRoleId) {
      const { data: perms } = await supabase
        .from('custom_role_permissions')
        .select('permission_key, allowed')
        .eq('custom_role_id', customRoleId)
      const map = emptyPermissions()
      for (const p of perms ?? []) {
        map[p.permission_key as PermissionKey] = p.allowed
      }
      setPermissions(map)
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
        resetBusinessState()
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
    secondaryCurrency,
    exchangeRate,
    currencyDecimals,
    quantityDecimals,
    dateFormat,
    timeFormat,
    logoUrl,
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
