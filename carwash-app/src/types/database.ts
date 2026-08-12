export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'otro'
export type VehicleType = 'auto' | 'camioneta' | 'moto' | 'otro'
export type CatalogItemType = 'service' | 'product'
export type AppointmentStatus =
  | 'pendiente'
  | 'confirmada'
  | 'en_espera'
  | 'en_proceso'
  | 'listo'
  | 'completada'
  | 'cancelada'
export type SaleStatus = 'completada' | 'cancelada'
export type CashMovementType = 'apertura' | 'ingreso' | 'egreso' | 'cierre' | 'ajuste'

export type MemberRole = 'admin' | 'staff'

export type PermissionKey =
  | 'pos'
  | 'citas'
  | 'clientes'
  | 'catalogo_ver'
  | 'catalogo_editar'
  | 'compras'
  | 'empleados'
  | 'caja'
  | 'reportes'
  | 'configuracion'

export interface RolePermission {
  id: string
  business_id: string
  role: 'staff'
  permission_key: PermissionKey
  allowed: boolean
  created_at: string
}

export interface CustomRole {
  id: string
  business_id: string
  name: string
  created_at: string
}

export interface CustomRolePermission {
  id: string
  business_id: string
  custom_role_id: string
  permission_key: PermissionKey
  allowed: boolean
}

export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
export type TimeFormat = '24h' | '12h'

export interface Business {
  id: string
  name: string
  owner_user_id: string
  currency: string
  date_format: DateFormat
  time_format: TimeFormat
  logo_url: string | null
  currency_decimals: number
  quantity_decimals: number
  created_at: string
  updated_at: string
}

export interface BusinessMember {
  id: string
  business_id: string
  user_id: string
  role: MemberRole
  custom_role_id: string | null
  email: string | null
  created_at: string
}

export interface BusinessInvite {
  id: string
  business_id: string
  code: string
  role: MemberRole
  created_by: string | null
  used_by: string | null
  used_at: string | null
  expires_at: string | null
  created_at: string
}

export interface Employee {
  id: string
  business_id: string
  full_name: string
  phone: string | null
  role: string
  commission_pct: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  business_id: string
  full_name: string
  phone: string | null
  email: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Vehicle {
  id: string
  business_id: string
  client_id: string
  vehicle_type: VehicleType
  brand: string | null
  model: string | null
  color: string | null
  plate: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface VehicleWithClient extends Vehicle {
  client?: Pick<Client, 'id' | 'full_name' | 'phone'> | null
}

export interface CatalogItem {
  id: string
  business_id: string
  type: CatalogItemType
  name: string
  description: string | null
  price: number
  cost: number
  sellable: boolean
  track_inventory: boolean
  stock_qty: number
  min_stock: number
  unit: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  business_id: string
  name: string
  phone: string | null
  email: string | null
  notes: string | null
  active: boolean
  created_at: string
}

export interface Purchase {
  id: string
  business_id: string
  supplier_name: string | null
  purchase_date: string
  notes: string | null
  total: number
  created_by: string | null
  created_at: string
}

export interface PurchaseItem {
  id: string
  purchase_id: string
  item_id: string
  qty: number
  unit_cost: number
  subtotal: number
}

export interface Bay {
  id: string
  business_id: string
  name: string
  active: boolean
  sort_order: number
  created_at: string
}

export interface VehicleTypeItem {
  id: string
  business_id: string
  name: string
  active: boolean
  sort_order: number
  created_at: string
}

export interface ExpenseCategoryItem {
  id: string
  business_id: string
  name: string
  active: boolean
  sort_order: number
  created_at: string
}

export interface Appointment {
  id: string
  business_id: string
  client_id: string | null
  vehicle_id: string | null
  employee_id: string | null
  bay_id: string | null
  scheduled_at: string
  duration_min: number
  status: AppointmentStatus
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface AppointmentItem {
  id: string
  appointment_id: string
  item_id: string
  qty: number
}

export interface Sale {
  id: string
  business_id: string
  client_id: string | null
  vehicle_id: string | null
  employee_id: string | null
  appointment_id: string | null
  sale_date: string
  payment_method: PaymentMethod
  subtotal: number
  discount: number
  total: number
  status: SaleStatus
  created_by: string | null
  created_at: string
}

export interface SaleItem {
  id: string
  sale_id: string
  item_id: string | null
  item_name: string
  item_type: CatalogItemType
  qty: number
  unit_price: number
  subtotal: number
  commission_pct: number
  commission_amount: number
}

export interface Shift {
  id: string
  business_id: string
  employee_id: string
  clock_in: string
  clock_out: string | null
  notes: string | null
  created_at: string
}

export interface Expense {
  id: string
  business_id: string
  category: string
  description: string | null
  amount: number
  expense_date: string
  payment_method: PaymentMethod
  created_by: string | null
  created_at: string
}

export interface CashMovement {
  id: string
  business_id: string
  movement_date: string
  type: CashMovementType
  amount: number
  description: string | null
  reference_type: string | null
  reference_id: string | null
  created_by: string | null
  created_at: string
}
