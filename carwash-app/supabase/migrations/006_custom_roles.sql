-- Mantén al Día · Auto Lavado
-- Migración 006: roles personalizados. El Administrador y el Operador
-- (staff) siguen siendo la base del sistema de seguridad; los roles
-- personalizados son variantes de "Operador" con su propio conjunto de
-- permisos de pantallas dentro de la app.
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query.

create table if not exists public.custom_roles (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.custom_roles enable row level security;

drop policy if exists "members select custom_roles" on public.custom_roles;
create policy "members select custom_roles" on public.custom_roles
  for select using (business_id in (select public.current_business_ids()));

drop policy if exists "admins write custom_roles" on public.custom_roles;
create policy "admins write custom_roles" on public.custom_roles
  for insert with check (public.is_business_admin(business_id));

drop policy if exists "admins update custom_roles" on public.custom_roles;
create policy "admins update custom_roles" on public.custom_roles
  for update using (public.is_business_admin(business_id));

drop policy if exists "admins delete custom_roles" on public.custom_roles;
create policy "admins delete custom_roles" on public.custom_roles
  for delete using (public.is_business_admin(business_id));

create index if not exists idx_custom_roles_business on public.custom_roles(business_id);

-- =========================================================
-- Permisos de cada rol personalizado.
-- =========================================================
create table if not exists public.custom_role_permissions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  custom_role_id uuid not null references public.custom_roles(id) on delete cascade,
  permission_key text not null,
  allowed boolean not null default false,
  unique (custom_role_id, permission_key)
);

alter table public.custom_role_permissions enable row level security;

drop policy if exists "members select custom_role_permissions" on public.custom_role_permissions;
create policy "members select custom_role_permissions" on public.custom_role_permissions
  for select using (business_id in (select public.current_business_ids()));

drop policy if exists "admins write custom_role_permissions" on public.custom_role_permissions;
create policy "admins write custom_role_permissions" on public.custom_role_permissions
  for insert with check (public.is_business_admin(business_id));

drop policy if exists "admins update custom_role_permissions" on public.custom_role_permissions;
create policy "admins update custom_role_permissions" on public.custom_role_permissions
  for update using (public.is_business_admin(business_id));

drop policy if exists "admins delete custom_role_permissions" on public.custom_role_permissions;
create policy "admins delete custom_role_permissions" on public.custom_role_permissions
  for delete using (public.is_business_admin(business_id));

create index if not exists idx_custom_role_permissions_role on public.custom_role_permissions(custom_role_id);

-- =========================================================
-- Cada usuario (con rol base "staff") puede además pertenecer a un rol
-- personalizado, que define qué pantallas puede usar.
-- =========================================================
alter table public.business_members add column if not exists custom_role_id uuid references public.custom_roles(id) on delete set null;
