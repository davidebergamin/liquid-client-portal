alter table public.portal_settings
  add column if not exists stripe_maintenance_15_url text,
  add column if not exists stripe_maintenance_30_url text,
  add column if not exists stripe_maintenance_50_url text;
