-- Mantén al Día · Auto Lavado
-- Esquema completo para Supabase (Postgres).
-- Ejecutar de una sola vez en: Supabase Dashboard > SQL Editor > New query.
-- Seguro de ejecutar varias veces (usa IF NOT EXISTS / OR REPLACE donde aplica).

-- =========================================================
-- EXTENSIONES
-- =========================================================
create extension if not exists "pgcrypto";

-- =========================================================
-- FUNCIONES DE UTILIDAD
-- =========================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =========================================================
-- NEGOCIOS Y MEMBRESÍAS (multi-negocio, aislado por RLS)
-- =========================================================
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Mi Auto Lavado',
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  currency text not null default 'MXN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin', 'staff')),
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

-- Función SECURITY DEFINER para evitar recursión de RLS al resolver membresías.
create or replace function public.current_business_ids()
returns setof uuid as $$
  select business_id from public.business_members where user_id = auth.uid();
$$ language sql stable security definer set search_path = public;

-- Alta automática de negocio al registrarse un usuario nuevo.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_business_id uuid;
begin
  insert into public.businesses (name, owner_user_id)
  values (coalesce(new.raw_user_meta_data->>'business_name', 'Mi Auto Lavado'), new.id)
  returning id into new_business_id;

  insert into public.business_members (business_id, user_id, role)
  values (new_business_id, new.id, 'admin');

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- EMPLEADOS (roster interno, no requiere cuenta de acceso)
-- =========================================================
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  full_name text not null,
  phone text,
  role text not null default 'lavador',
  commission_pct numeric(5,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- CLIENTES Y VEHÍCULOS
-- =========================================================
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  vehicle_type text not null default 'Auto',
  brand text,
  model text,
  color text,
  plate text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- CATÁLOGO: SERVICIOS Y PRODUCTOS (con inventario opcional)
-- =========================================================
create table if not exists public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  type text not null check (type in ('service','product')),
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  cost numeric(10,2) not null default 0,
  sellable boolean not null default true,
  track_inventory boolean not null default false,
  stock_qty numeric(10,2) not null default 0,
  min_stock numeric(10,2) not null default 0,
  unit text not null default 'pza',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- COMPRAS (reabastecimiento de inventario)
-- =========================================================
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  supplier_name text,
  purchase_date date not null default current_date,
  notes text,
  total numeric(10,2) not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  item_id uuid not null references public.catalog_items(id),
  qty numeric(10,2) not null,
  unit_cost numeric(10,2) not null,
  subtotal numeric(10,2) not null
);

-- =========================================================
-- CITAS / AGENDA
-- =========================================================
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  employee_id uuid references public.employees(id) on delete set null,
  scheduled_at timestamptz not null,
  duration_min integer not null default 45,
  status text not null default 'pendiente' check (status in ('pendiente','confirmada','en_proceso','completada','cancelada')),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.appointment_items (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  item_id uuid not null references public.catalog_items(id),
  qty numeric(10,2) not null default 1
);

-- =========================================================
-- VENTAS / PUNTO DE VENTA (POS)
-- =========================================================
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  employee_id uuid references public.employees(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  sale_date timestamptz not null default now(),
  payment_method text not null default 'efectivo' check (payment_method in ('efectivo','tarjeta','transferencia','otro')),
  subtotal numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  status text not null default 'completada' check (status in ('completada','cancelada')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  item_id uuid references public.catalog_items(id),
  item_name text not null,
  item_type text not null default 'service',
  qty numeric(10,2) not null default 1,
  unit_price numeric(10,2) not null,
  subtotal numeric(10,2) not null,
  commission_pct numeric(5,2) not null default 0,
  commission_amount numeric(10,2) not null default 0
);

-- =========================================================
-- TURNOS DE EMPLEADOS
-- =========================================================
create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  clock_in timestamptz not null default now(),
  clock_out timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

-- =========================================================
-- GASTOS
-- =========================================================
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  category text not null default 'General',
  description text,
  amount numeric(10,2) not null,
  expense_date date not null default current_date,
  payment_method text not null default 'efectivo' check (payment_method in ('efectivo','tarjeta','transferencia','otro')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- =========================================================
-- CUENTAS / CAJA (libro de movimientos de efectivo)
-- =========================================================
create table if not exists public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  movement_date timestamptz not null default now(),
  type text not null check (type in ('apertura','ingreso','egreso','cierre','ajuste')),
  amount numeric(10,2) not null,
  description text,
  reference_type text,
  reference_id uuid,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- =========================================================
-- TRIGGERS DE NEGOCIO
-- =========================================================

-- Compra de insumos: sube el stock del catálogo.
create or replace function public.apply_purchase_item_stock()
returns trigger as $$
begin
  update public.catalog_items
    set stock_qty = stock_qty + new.qty
    where id = new.item_id;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_purchase_items_stock on public.purchase_items;
create trigger trg_purchase_items_stock
  after insert on public.purchase_items
  for each row execute function public.apply_purchase_item_stock();

-- Venta: descuenta stock de los artículos que llevan control de inventario.
create or replace function public.apply_sale_item_stock()
returns trigger as $$
begin
  update public.catalog_items
    set stock_qty = stock_qty - new.qty
    where id = new.item_id and track_inventory = true;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_sale_items_stock on public.sale_items;
create trigger trg_sale_items_stock
  after insert on public.sale_items
  for each row execute function public.apply_sale_item_stock();

-- Compra registrada: genera automáticamente un gasto de categoría "Compras".
create or replace function public.apply_purchase_expense()
returns trigger as $$
begin
  insert into public.expenses (business_id, category, description, amount, expense_date, payment_method, created_by)
  values (
    new.business_id,
    'Compras',
    coalesce('Compra a ' || new.supplier_name, 'Compra de inventario'),
    new.total,
    new.purchase_date,
    'efectivo',
    new.created_by
  );
  return new;
end;
$$ language plpgsql security invoker set search_path = public;

drop trigger if exists trg_purchase_expense on public.purchases;
create trigger trg_purchase_expense
  after insert on public.purchases
  for each row execute function public.apply_purchase_expense();

-- Gasto registrado: crea el movimiento de egreso en caja.
create or replace function public.apply_expense_cash_movement()
returns trigger as $$
begin
  insert into public.cash_movements (business_id, movement_date, type, amount, description, reference_type, reference_id, created_by)
  values (
    new.business_id,
    new.expense_date::timestamptz,
    'egreso',
    new.amount,
    new.category || case when new.description is not null then ': ' || new.description else '' end,
    'expense',
    new.id,
    new.created_by
  );
  return new;
end;
$$ language plpgsql security invoker set search_path = public;

drop trigger if exists trg_expense_cash_movement on public.expenses;
create trigger trg_expense_cash_movement
  after insert on public.expenses
  for each row execute function public.apply_expense_cash_movement();

-- Venta completada: crea el movimiento de ingreso en caja.
create or replace function public.apply_sale_cash_movement()
returns trigger as $$
begin
  if new.status = 'completada' then
    insert into public.cash_movements (business_id, movement_date, type, amount, description, reference_type, reference_id, created_by)
    values (
      new.business_id,
      new.sale_date,
      'ingreso',
      new.total,
      'Venta',
      'sale',
      new.id,
      new.created_by
    );
  end if;
  return new;
end;
$$ language plpgsql security invoker set search_path = public;

drop trigger if exists trg_sale_cash_movement on public.sales;
create trigger trg_sale_cash_movement
  after insert on public.sales
  for each row execute function public.apply_sale_cash_movement();

-- updated_at automático
do $$
declare
  t text;
begin
  foreach t in array array['businesses','employees','clients','vehicles','catalog_items','appointments']
  loop
    execute format('drop trigger if exists set_updated_at on public.%I;', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.employees enable row level security;
alter table public.clients enable row level security;
alter table public.vehicles enable row level security;
alter table public.catalog_items enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_items enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.shifts enable row level security;
alter table public.expenses enable row level security;
alter table public.cash_movements enable row level security;

create policy "members select business" on public.businesses
  for select using (id in (select public.current_business_ids()));
create policy "members update business" on public.businesses
  for update using (id in (select public.current_business_ids()));

create policy "members select membership" on public.business_members
  for select using (business_id in (select public.current_business_ids()));

-- Política genérica reutilizada por todas las tablas operativas: los
-- miembros del negocio pueden leer y escribir todo lo que pertenece a su
-- propio business_id.
do $$
declare
  t text;
begin
  foreach t in array array[
    'employees','clients','vehicles','catalog_items',
    'purchases','appointments','sales','shifts','expenses','cash_movements'
  ]
  loop
    execute format('create policy "members all %1$s" on public.%1$I for all using (business_id in (select public.current_business_ids())) with check (business_id in (select public.current_business_ids()));', t);
  end loop;
end $$;

-- Tablas hijas sin business_id propio: heredan el acceso a través del padre.
create policy "members all purchase_items" on public.purchase_items
  for all using (purchase_id in (select id from public.purchases where business_id in (select public.current_business_ids())))
  with check (purchase_id in (select id from public.purchases where business_id in (select public.current_business_ids())));

create policy "members all appointment_items" on public.appointment_items
  for all using (appointment_id in (select id from public.appointments where business_id in (select public.current_business_ids())))
  with check (appointment_id in (select id from public.appointments where business_id in (select public.current_business_ids())));

create policy "members all sale_items" on public.sale_items
  for all using (sale_id in (select id from public.sales where business_id in (select public.current_business_ids())))
  with check (sale_id in (select id from public.sales where business_id in (select public.current_business_ids())));

-- =========================================================
-- ÍNDICES
-- =========================================================
create index if not exists idx_clients_business on public.clients(business_id);
create index if not exists idx_vehicles_business on public.vehicles(business_id, client_id);
create index if not exists idx_catalog_items_business on public.catalog_items(business_id, type);
create index if not exists idx_appointments_business_date on public.appointments(business_id, scheduled_at);
create index if not exists idx_sales_business_date on public.sales(business_id, sale_date);
create index if not exists idx_sale_items_sale on public.sale_items(sale_id);
create index if not exists idx_shifts_business on public.shifts(business_id, employee_id);
create index if not exists idx_expenses_business_date on public.expenses(business_id, expense_date);
create index if not exists idx_cash_movements_business_date on public.cash_movements(business_id, movement_date);
