-- Track when a client dismisses the portal welcome screen.
-- Backfill for existing clients: see 20260626130000_portal_welcome_skip_existing_clients.sql

alter table public.leads
  add column if not exists portal_welcome_seen_at timestamptz;
