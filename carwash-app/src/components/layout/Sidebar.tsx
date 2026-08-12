import { useEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingCart,
  CalendarClock,
  Users,
  Package,
  Truck,
  UserRound,
  Wallet,
  Receipt,
  Building2,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  X,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import type { PermissionKey } from '../../types/database'

type NavItem =
  | { kind: 'link'; to: string; label: string; icon: typeof LayoutDashboard; end?: boolean; permission: PermissionKey | null }
  | {
      kind: 'group'
      key: string
      label: string
      icon: typeof LayoutDashboard
      basePath: string
      permission: PermissionKey | null
      adminOnly?: boolean
      links: { to: string; label: string; permission?: PermissionKey | null }[]
    }

const navItems: NavItem[] = [
  { kind: 'link', to: '/', label: 'Inicio', icon: LayoutDashboard, end: true, permission: null },
  { kind: 'link', to: '/pos', label: 'Punto de venta', icon: ShoppingCart, permission: 'pos' },
  { kind: 'link', to: '/citas', label: 'Citas', icon: CalendarClock, permission: 'citas' },
  {
    kind: 'group',
    key: 'clientes',
    label: 'Clientes',
    icon: Users,
    basePath: '/clientes',
    permission: 'clientes',
    links: [
      { to: '/clientes/crear', label: 'Crear Cliente' },
      { to: '/clientes/lista', label: 'Lista de Clientes' },
    ],
  },
  {
    kind: 'group',
    key: 'productos',
    label: 'Productos',
    icon: Package,
    basePath: '/productos',
    permission: 'catalogo_ver',
    links: [
      { to: '/productos/crear', label: 'Crear Producto', permission: 'catalogo_editar' },
      { to: '/productos/lista', label: 'Lista de Productos' },
      { to: '/productos/precios', label: 'Actualizar Precio', permission: 'catalogo_editar' },
      { to: '/productos/unidades', label: 'Unidades', permission: 'catalogo_editar' },
      { to: '/productos/categorias', label: 'Categorías', permission: 'catalogo_editar' },
    ],
  },
  {
    kind: 'group',
    key: 'compras',
    label: 'Compras',
    icon: Truck,
    basePath: '/compras',
    permission: 'compras',
    links: [
      { to: '/compras/crear', label: 'Crear Compra' },
      { to: '/compras/lista', label: 'Lista de Compras' },
    ],
  },
  {
    kind: 'group',
    key: 'proveedores',
    label: 'Proveedores',
    icon: Building2,
    basePath: '/proveedores',
    permission: 'compras',
    links: [
      { to: '/proveedores/crear', label: 'Crear Proveedor' },
      { to: '/proveedores/lista', label: 'Lista de Proveedores' },
    ],
  },
  {
    kind: 'group',
    key: 'empleados',
    label: 'Empleados',
    icon: UserRound,
    basePath: '/empleados',
    permission: 'empleados',
    links: [
      { to: '/empleados/crear', label: 'Crear Empleado' },
      { to: '/empleados/lista', label: 'Lista de Empleados' },
      { to: '/empleados/turnos', label: 'Turnos' },
    ],
  },
  { kind: 'link', to: '/caja', label: 'Caja', icon: Wallet, permission: 'caja' },
  {
    kind: 'group',
    key: 'gastos',
    label: 'Gastos',
    icon: Receipt,
    basePath: '/gastos',
    permission: 'caja',
    links: [
      { to: '/gastos/crear', label: 'Crear Gasto' },
      { to: '/gastos/lista', label: 'Lista de Gastos' },
      { to: '/gastos/categorias', label: 'Categoría de Gastos' },
    ],
  },
  {
    kind: 'group',
    key: 'reportes',
    label: 'Reportes',
    icon: BarChart3,
    basePath: '/reportes',
    permission: 'reportes',
    links: [
      { to: '/reportes/ventas', label: 'Ventas' },
      { to: '/reportes/gastos', label: 'Gastos' },
      { to: '/reportes/citas', label: 'Citas' },
      { to: '/reportes/inventario', label: 'Inventario' },
    ],
  },
  {
    kind: 'group',
    key: 'configuracion',
    label: 'Configuración',
    icon: SettingsIcon,
    basePath: '/configuracion',
    permission: 'configuracion',
    links: [
      { to: '/configuracion/empresa', label: 'Configuración de Empresa' },
      { to: '/configuracion/tipos-vehiculo', label: 'Tipos de Vehículo' },
      { to: '/configuracion/bahias', label: 'Bahías' },
    ],
  },
  {
    kind: 'group',
    key: 'usuarios',
    label: 'Gestión de usuarios',
    icon: ShieldCheck,
    basePath: '/usuarios',
    permission: null,
    adminOnly: true,
    links: [
      { to: '/usuarios', label: 'Usuarios' },
      { to: '/usuarios/roles', label: 'Roles' },
    ],
  },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

function NavGroup({
  icon,
  label,
  basePath,
  links: groupLinks,
  onNavigate,
  isOpen,
  onToggle,
  collapsed,
  onExpandInto,
}: {
  icon: ReactNode
  label: string
  basePath: string
  links: { to: string; label: string }[]
  onNavigate: () => void
  isOpen: boolean
  onToggle: () => void
  collapsed: boolean
  onExpandInto: () => void
}) {
  const location = useLocation()
  const active = location.pathname.startsWith(basePath)

  if (collapsed) {
    return (
      <button
        onClick={onExpandInto}
        title={label}
        className={`flex items-center justify-center rounded-xl p-2.5 transition ${
          active ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
        }`}
      >
        {icon}
      </button>
    )
  }

  return (
    <div>
      <button
        onClick={onToggle}
        className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
          active ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
        }`}
      >
        {icon}
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown size={16} className={`transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="ml-4 mt-1 grid gap-1 border-l border-white/10 pl-3">
          {groupLinks.map(({ to, label: linkLabel }) => (
            <NavLink
              key={to}
              to={to}
              end
              onClick={onNavigate}
              className={({ isActive }) =>
                `rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                  isActive ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {linkLabel}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { businessName, user, isAdmin, can, signOut, logoUrl } = useAuth()
  const location = useLocation()

  const [collapsed, setCollapsed] = useState(() => location.pathname.startsWith('/pos'))
  const prevPathRef = useRef(location.pathname)

  useEffect(() => {
    const enteredPos = location.pathname.startsWith('/pos') && !prevPathRef.current.startsWith('/pos')
    if (enteredPos) setCollapsed(true)
    prevPathRef.current = location.pathname
  }, [location.pathname])

  const visibleItems = navItems.filter((item) => {
    if (item.kind === 'group' && item.adminOnly) return isAdmin
    const permission = item.permission
    return permission === null || can(permission)
  })

  const activeGroupKey = visibleItems.find((item) => item.kind === 'group' && location.pathname.startsWith(item.basePath))
  const [openGroup, setOpenGroup] = useState<string | null>(activeGroupKey?.kind === 'group' ? activeGroupKey.key : null)

  function toggleGroup(key: string) {
    setOpenGroup((current) => (current === key ? null : key))
  }

  function expandInto(key: string) {
    setCollapsed(false)
    setOpenGroup(key)
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-slate-900/50 md:hidden" onClick={onClose} />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] shrink-0 bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-200 ease-out md:relative md:z-auto md:max-w-none md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        <button
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? 'Mostrar menú completo' : 'Ocultar menú'}
          className="absolute -right-3 top-9 z-10 hidden h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-slate-800 text-slate-300 shadow-md hover:bg-slate-700 hover:text-white md:flex"
        >
          {collapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
        </button>

        <div className={`flex h-full flex-col gap-6 overflow-y-auto p-5 ${collapsed ? 'md:px-2.5' : ''}`}>
          <div className={`flex items-start justify-between gap-2 ${collapsed ? 'md:justify-center' : ''}`}>
            <div className={`flex min-w-0 items-center gap-3 ${collapsed ? 'md:justify-center' : ''}`}>
              <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/10 text-2xl">
                {logoUrl ? <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" /> : '🚿'}
              </div>
              <div className={`min-w-0 ${collapsed ? 'md:hidden' : ''}`}>
                <p className="truncate font-bold leading-tight">{businessName || 'Auto Lavado'}</p>
                <p className="truncate text-xs text-slate-400">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 rounded-lg p-1.5 text-slate-300 hover:bg-white/10 md:hidden"
              aria-label="Cerrar menú"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="grid gap-1">
          {visibleItems.map((item) => {
            if (item.kind === 'link') {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  title={item.label}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                      collapsed ? 'md:justify-center md:px-2.5' : ''
                    } ${isActive ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`
                  }
                >
                  <Icon size={18} />
                  <span className={collapsed ? 'md:hidden' : ''}>{item.label}</span>
                </NavLink>
              )
            }
            const Icon = item.icon
            const visibleLinks = item.links.filter((l) => l.permission === undefined || l.permission === null || can(l.permission))
            return (
              <NavGroup
                key={item.key}
                icon={<Icon size={18} />}
                label={item.label}
                basePath={item.basePath}
                links={visibleLinks}
                onNavigate={onClose}
                isOpen={openGroup === item.key}
                onToggle={() => toggleGroup(item.key)}
                collapsed={collapsed}
                onExpandInto={() => expandInto(item.key)}
              />
            )
          })}
          </nav>

          <button
            onClick={() => signOut()}
            title="Cerrar sesión"
            className={`mt-auto flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white ${
              collapsed ? 'md:justify-center md:px-2.5' : ''
            }`}
          >
            <LogOut size={18} />
            <span className={collapsed ? 'md:hidden' : ''}>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  )
}
