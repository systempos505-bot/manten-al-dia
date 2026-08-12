-- Mantén al Día · Auto Lavado
-- Migración 009: categorías de gastos configurables por negocio.
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query.

create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.expense_categories enable row level security;

drop policy if exists "members select expense_categories" on public.expense_categories;
create policy "members select expense_categories" on public.expense_categories
  for select using (business_id in (select public.current_business_ids()));

drop policy if exists "admins write expense_categories" on public.expense_categories;
create policy "admins write expense_categories" on public.expense_categories
  for insert with check (public.is_business_admin(business_id));

drop policy if exists "admins update expense_categories" on public.expense_categories;
create policy "admins update expense_categories" on public.expense_categories
  for update using (public.is_business_admin(business_id));

drop policy if exists "admins delete expense_categories" on public.expense_categories;
create policy "admins delete expense_categories" on public.expense_categories
  for delete using (public.is_business_admin(business_id));

create index if not exists idx_expense_categories_business on public.expense_categories(business_id);

-- =========================================================
-- Trigger: cuando se crea un negocio, agregar categorías por defecto.
-- =========================================================
create or replace function public.create_default_expense_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.expense_categories (business_id, name, sort_order, active)
  values
    (new.id, 'Renta', 0, true),
    (new.id, 'Agua', 1, true),
    (new.id, 'Luz', 2, true),
    (new.id, 'Sueldos', 3, true),
    (new.id, 'Mantenimiento', 4, true),
    (new.id, 'Insumos', 5, true),
    (new.id, 'Otro', 6, true);
  return new;
end;
$$;

drop trigger if exists on_business_created_add_expense_categories on public.businesses;
create trigger on_business_created_add_expense_categories
  after insert on public.businesses
  for each row
  execute function public.create_default_expense_categories();

-- Para negocios que ya existen y no tienen categorías (migración de datos):
insert into public.expense_categories (business_id, name, sort_order, active)
select id, 'Renta', 0, true from public.businesses
where not exists (select 1 from public.expense_categories where business_id = public.businesses.id)
on conflict do nothing;

insert into public.expense_categories (business_id, name, sort_order, active)
select id, 'Agua', 1, true from public.businesses
where not exists (select 1 from public.expense_categories ec where ec.business_id = public.businesses.id and ec.name = 'Agua')
on conflict do nothing;

insert into public.expense_categories (business_id, name, sort_order, active)
select id, 'Luz', 2, true from public.businesses
where not exists (select 1 from public.expense_categories ec where ec.business_id = public.businesses.id and ec.name = 'Luz')
on conflict do nothing;

insert into public.expense_categories (business_id, name, sort_order, active)
select id, 'Sueldos', 3, true from public.businesses
where not exists (select 1 from public.expense_categories ec where ec.business_id = public.businesses.id and ec.name = 'Sueldos')
on conflict do nothing;

insert into public.expense_categories (business_id, name, sort_order, active)
select id, 'Mantenimiento', 4, true from public.businesses
where not exists (select 1 from public.expense_categories ec where ec.business_id = public.businesses.id and ec.name = 'Mantenimiento')
on conflict do nothing;

insert into public.expense_categories (business_id, name, sort_order, active)
select id, 'Insumos', 5, true from public.businesses
where not exists (select 1 from public.expense_categories ec where ec.business_id = public.businesses.id and ec.name = 'Insumos')
on conflict do nothing;

insert into public.expense_categories (business_id, name, sort_order, active)
select id, 'Otro', 6, true from public.businesses
where not exists (select 1 from public.expense_categories ec where ec.business_id = public.businesses.id and ec.name = 'Otro')
on conflict do nothing;
