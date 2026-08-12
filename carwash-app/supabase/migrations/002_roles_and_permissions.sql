-- Mantén al Día · Auto Lavado
-- Migración 002: usuarios múltiples con roles y permisos + invitaciones.
-- Ejecutar UNA VEZ en: Supabase Dashboard > SQL Editor > New query.
-- Es seguro volver a ejecutarla si algo falla a la mitad.

-- =========================================================
-- Columna de correo en business_members (para mostrar el equipo)
-- =========================================================
alter table public.business_members add column if not exists email text;

update public.business_members bm
set email = u.email
from auth.users u
where bm.user_id = u.id and bm.email is null;

-- =========================================================
-- Función: ¿el usuario actual es administrador de este negocio?
-- =========================================================
create or replace function public.is_business_admin(target_business_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.business_members
    where business_id = target_business_id
      and user_id = auth.uid()
      and role = 'admin'
  );
$$ language sql stable security definer set search_path = public;

-- =========================================================
-- Invitaciones: el admin genera un código, otra persona lo usa al
-- registrarse para unirse al mismo negocio (en vez de crear uno nuevo).
-- =========================================================
create table if not exists public.business_invites (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  code text not null unique,
  role text not null default 'staff' check (role in ('admin', 'staff')),
  created_by uuid references auth.users(id),
  used_by uuid references auth.users(id),
  used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.business_invites enable row level security;

drop policy if exists "admins manage invites" on public.business_invites;
create policy "admins manage invites" on public.business_invites
  for all using (public.is_business_admin(business_id))
  with check (public.is_business_admin(business_id));

-- =========================================================
-- Alta de usuario nuevo: crea negocio propio, o se une a uno existente
-- si trae un código de invitación válido en sus metadatos de registro.
-- =========================================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_business_id uuid;
  matched_invite public.business_invites;
begin
  if coalesce(new.raw_user_meta_data->>'invite_code', '') <> '' then
    select * into matched_invite
      from public.business_invites
      where code = new.raw_user_meta_data->>'invite_code'
        and used_by is null
        and (expires_at is null or expires_at > now())
      limit 1;

    if matched_invite.id is not null then
      insert into public.business_members (business_id, user_id, role, email)
      values (matched_invite.business_id, new.id, matched_invite.role, new.email);

      update public.business_invites
        set used_by = new.id, used_at = now()
        where id = matched_invite.id;

      return new;
    end if;
  end if;

  insert into public.businesses (name, owner_user_id)
  values (coalesce(new.raw_user_meta_data->>'business_name', 'Mi Auto Lavado'), new.id)
  returning id into new_business_id;

  insert into public.business_members (business_id, user_id, role, email)
  values (new_business_id, new.id, 'admin', new.email);

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- =========================================================
-- Los movimientos automáticos de caja/gastos deben registrarse sin
-- importar si quien generó la venta/compra es administrador o no.
-- =========================================================
create or replace function public.apply_sale_cash_movement()
returns trigger as $$
begin
  if new.status = 'completada' then
    insert into public.cash_movements (business_id, movement_date, type, amount, description, reference_type, reference_id, created_by)
    values (new.business_id, new.sale_date, 'ingreso', new.total, 'Venta', 'sale', new.id, new.created_by);
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

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
$$ language plpgsql security definer set search_path = public;

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
$$ language plpgsql security definer set search_path = public;

-- =========================================================
-- Permisos más finos: solo administradores pueden cambiar
-- configuración del negocio, catálogo, empleados, compras y finanzas.
-- El resto del equipo puede operar el día a día (ventas, citas, clientes).
-- =========================================================

drop policy if exists "members update business" on public.businesses;
drop policy if exists "admins update business" on public.businesses;
create policy "admins update business" on public.businesses
  for update using (public.is_business_admin(id));

drop policy if exists "members all employees" on public.employees;
drop policy if exists "members select employees" on public.employees;
create policy "members select employees" on public.employees
  for select using (business_id in (select public.current_business_ids()));
drop policy if exists "admins write employees" on public.employees;
create policy "admins write employees" on public.employees
  for insert with check (public.is_business_admin(business_id));
drop policy if exists "admins update employees" on public.employees;
create policy "admins update employees" on public.employees
  for update using (public.is_business_admin(business_id));
drop policy if exists "admins delete employees" on public.employees;
create policy "admins delete employees" on public.employees
  for delete using (public.is_business_admin(business_id));

drop policy if exists "members all catalog_items" on public.catalog_items;
drop policy if exists "members select catalog_items" on public.catalog_items;
create policy "members select catalog_items" on public.catalog_items
  for select using (business_id in (select public.current_business_ids()));
drop policy if exists "admins write catalog_items" on public.catalog_items;
create policy "admins write catalog_items" on public.catalog_items
  for insert with check (public.is_business_admin(business_id));
drop policy if exists "admins update catalog_items" on public.catalog_items;
create policy "admins update catalog_items" on public.catalog_items
  for update using (public.is_business_admin(business_id));
drop policy if exists "admins delete catalog_items" on public.catalog_items;
create policy "admins delete catalog_items" on public.catalog_items
  for delete using (public.is_business_admin(business_id));

drop policy if exists "members all purchases" on public.purchases;
drop policy if exists "members select purchases" on public.purchases;
create policy "members select purchases" on public.purchases
  for select using (business_id in (select public.current_business_ids()));
drop policy if exists "admins write purchases" on public.purchases;
create policy "admins write purchases" on public.purchases
  for insert with check (public.is_business_admin(business_id));
drop policy if exists "admins update purchases" on public.purchases;
create policy "admins update purchases" on public.purchases
  for update using (public.is_business_admin(business_id));
drop policy if exists "admins delete purchases" on public.purchases;
create policy "admins delete purchases" on public.purchases
  for delete using (public.is_business_admin(business_id));

drop policy if exists "members all purchase_items" on public.purchase_items;
drop policy if exists "admins manage purchase_items" on public.purchase_items;
create policy "admins manage purchase_items" on public.purchase_items
  for all using (purchase_id in (select id from public.purchases where public.is_business_admin(business_id)))
  with check (purchase_id in (select id from public.purchases where public.is_business_admin(business_id)));

drop policy if exists "members all expenses" on public.expenses;
drop policy if exists "admins manage expenses" on public.expenses;
create policy "admins manage expenses" on public.expenses
  for all using (public.is_business_admin(business_id))
  with check (public.is_business_admin(business_id));

drop policy if exists "members all cash_movements" on public.cash_movements;
drop policy if exists "admins manage cash_movements" on public.cash_movements;
create policy "admins manage cash_movements" on public.cash_movements
  for all using (public.is_business_admin(business_id))
  with check (public.is_business_admin(business_id));
