-- Mantén al Día · Auto Lavado
-- Migración 004: tipos de vehículos configurables por negocio.
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query.

-- =========================================================
-- Tipos de vehículos: configurables por cada negocio.
-- =========================================================
create table if not exists public.vehicle_types (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.vehicle_types enable row level security;

drop policy if exists "members select vehicle_types" on public.vehicle_types;
create policy "members select vehicle_types" on public.vehicle_types
  for select using (business_id in (select public.current_business_ids()));

drop policy if exists "admins write vehicle_types" on public.vehicle_types;
create policy "admins write vehicle_types" on public.vehicle_types
  for insert with check (public.is_business_admin(business_id));

drop policy if exists "admins update vehicle_types" on public.vehicle_types;
create policy "admins update vehicle_types" on public.vehicle_types
  for update using (public.is_business_admin(business_id));

drop policy if exists "admins delete vehicle_types" on public.vehicle_types;
create policy "admins delete vehicle_types" on public.vehicle_types
  for delete using (public.is_business_admin(business_id));

create index if not exists idx_vehicle_types_business on public.vehicle_types(business_id);

-- =========================================================
-- Trigger: cuando se crea un negocio, agregar tipos por defecto.
-- =========================================================
create or replace function public.create_default_vehicle_types()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.vehicle_types (business_id, name, sort_order, active)
  values
    (new.id, 'Auto', 0, true),
    (new.id, 'Camioneta', 1, true),
    (new.id, 'Moto', 2, true),
    (new.id, 'Otro', 3, true);
  return new;
end;
$$;

drop trigger if exists on_business_created_add_vehicle_types on public.businesses;
create trigger on_business_created_add_vehicle_types
  after insert on public.businesses
  for each row
  execute function public.create_default_vehicle_types();

-- Para negocios que ya existen y no tienen tipos (migración de datos):
insert into public.vehicle_types (business_id, name, sort_order, active)
select id, 'Auto', 0, true from public.businesses
where not exists (select 1 from public.vehicle_types where business_id = public.businesses.id)
on conflict do nothing;

insert into public.vehicle_types (business_id, name, sort_order, active)
select id, 'Camioneta', 1, true from public.businesses
where not exists (select 1 from public.vehicle_types vt where vt.business_id = public.businesses.id and vt.name = 'Camioneta')
on conflict do nothing;

insert into public.vehicle_types (business_id, name, sort_order, active)
select id, 'Moto', 2, true from public.businesses
where not exists (select 1 from public.vehicle_types vt where vt.business_id = public.businesses.id and vt.name = 'Moto')
on conflict do nothing;

insert into public.vehicle_types (business_id, name, sort_order, active)
select id, 'Otro', 3, true from public.businesses
where not exists (select 1 from public.vehicle_types vt where vt.business_id = public.businesses.id and vt.name = 'Otro')
on conflict do nothing;
