-- Mantén al Día · Auto Lavado
-- Migración 013: moneda secundaria y tasa de cambio (editable), para
-- calcular el cambio/vuelto cuando el cliente paga en otra moneda.
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query.

alter table public.businesses add column if not exists secondary_currency text;
alter table public.businesses add column if not exists exchange_rate numeric(12,4) not null default 1;
