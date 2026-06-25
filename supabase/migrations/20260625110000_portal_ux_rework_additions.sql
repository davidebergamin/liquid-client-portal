-- Liquid Client Portal UX rework additions
-- Additive only: supports client payment confirmation and configurable booking URL.

alter table public.payments
  add column if not exists client_marked_paid_at timestamptz;

alter table public.portal_settings
  add column if not exists booking_url text;

-- Realtime read policies for admin live refresh.
-- Writes continue to go through trusted server actions using the service role.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'leads' and policyname = 'Realtime can read project updates'
  ) then
    create policy "Realtime can read project updates" on public.leads for select to anon using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'payments' and policyname = 'Realtime can read payment updates'
  ) then
    create policy "Realtime can read payment updates" on public.payments for select to anon using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'project_materials' and policyname = 'Realtime can read material updates'
  ) then
    create policy "Realtime can read material updates" on public.project_materials for select to anon using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'revision_requests' and policyname = 'Realtime can read revision updates'
  ) then
    create policy "Realtime can read revision updates" on public.revision_requests for select to anon using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'maintenance_requests' and policyname = 'Realtime can read maintenance updates'
  ) then
    create policy "Realtime can read maintenance updates" on public.maintenance_requests for select to anon using (true);
  end if;
end $$;
