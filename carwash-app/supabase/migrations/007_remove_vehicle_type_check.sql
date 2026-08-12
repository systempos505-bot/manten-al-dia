-- Mantén al Día · Auto Lavado
-- Migración 007: quitar la restricción vieja de vehicle_type. Ahora los
-- tipos de vehículos son configurables (tabla vehicle_types), así que ya
-- no tiene sentido limitarlos a los 4 valores fijos originales.
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query.

alter table public.vehicles drop constraint if exists vehicles_vehicle_type_check;
alter table public.vehicles alter column vehicle_type drop default;
