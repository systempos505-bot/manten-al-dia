-- Mantén al Día · Auto Lavado
-- Migración 005: permisos editables por rol (solo para "Operador"; el
-- Administrador siempre tiene acceso completo, para evitar que alguien se
-- quede sin poder administrar su propio negocio).
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query.

create table if not exists public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  role text not null check (role = 'staff'),
  permission_key text not null,
  allowed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (business_id, role, permission_key)
);

alter table public.role_permissions enable row level security;

drop policy if exists "members select role_permissions" on public.role_permissions;
create policy "members select role_permissions" on public.role_permissions
  for select using (business_id in (select public.current_business_ids()));

drop policy if exists "admins write role_permissions" on public.role_permissions;
create policy "admins write role_permissions" on public.role_permissions
  for insert with check (public.is_business_admin(business_id));

drop policy if exists "admins update role_permissions" on public.role_permissions;
create policy "admins update role_permissions" on public.role_permissions
  for update using (public.is_business_admin(business_id));

drop policy if exists "admins delete role_permissions" on public.role_permissions;
create policy "admins delete role_permissions" on public.role_permissions
  for delete using (public.is_business_admin(business_id));

create index if not exists idx_role_permissions_business on public.role_permissions(business_id);

-- =========================================================
-- Trigger: al crear un negocio, sembrar los permisos por defecto del
-- Operador (los mismos que ya existían fijos en la app).
-- =========================================================
create or replace function public.create_default_role_permissions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.role_permissions (business_id, role, permission_key, allowed)
  values
    (new.id, 'staff', 'pos', true),
    (new.id, 'staff', 'citas', true),
    (new.id, 'staff', 'clientes', true),
    (new.id, 'staff', 'catalogo_ver', true),
    (new.id, 'staff', 'catalogo_editar', false),
    (new.id, 'staff', 'compras', false),
    (new.id, 'staff', 'empleados', false),
    (new.id, 'staff', 'caja', false),
    (new.id, 'staff', 'reportes', false),
    (new.id, 'staff', 'configuracion', false);
  return new;
end;
$$;

drop trigger if exists on_business_created_add_role_permissions on public.businesses;
create trigger on_business_created_add_role_permissions
  after insert on public.businesses
  for each row
  execute function public.create_default_role_permissions();

-- Para negocios que ya existen: sembrar los permisos por defecto si aún no los tienen.
insert into public.role_permissions (business_id, role, permission_key, allowed)
select b.id, 'staff', p.key, p.default_allowed
from public.businesses b
cross join (values
  ('pos', true),
  ('citas', true),
  ('clientes', true),
  ('catalogo_ver', true),
  ('catalogo_editar', false),
  ('compras', false),
  ('empleados', false),
  ('caja', false),
  ('reportes', false),
  ('configuracion', false)
) as p(key, default_allowed)
where not exists (
  select 1 from public.role_permissions rp
  where rp.business_id = b.id and rp.role = 'staff' and rp.permission_key = p.key
);
