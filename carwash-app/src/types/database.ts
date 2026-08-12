export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'otro'
export type VehicleType = 'auto' | 'camioneta' | 'moto' | 'otro'
export type CatalogItemType = 'service' | 'product'
export type AppointmentStatus = 'pendiente' | 'confirmada' | 'en_proceso' | 'completada' | 'cancelada'
export type SaleStatus = 'completada' | 'cancelada'
export type CashMovementType = 'apertura' | 'ingreso' | 'egreso' | 'cierre' | 'ajuste'

export type MemberRole = 'admin' | 'staff'

export interface Business {
  id: string
  name: string
  owner_user_id: string
  currency: string
  created_at: string
  updated_at: string
}

export interface BusinessMember {
  id: string
  business_id: string
  user_id: string
  role: MemberRole
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

export interface Appointment {
  id: string
  business_id: string
  client_id: string | null
  vehicle_id: string | null
  employee_id: string | null
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
