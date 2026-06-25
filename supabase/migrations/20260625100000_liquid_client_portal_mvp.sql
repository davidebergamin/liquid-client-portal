-- Liquid Client Portal MVP
-- Extends the existing lead/moodboard schema into a project delivery portal.

alter table public.leads
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists status text not null default 'onboarding',
  add column if not exists next_action text,
  add column if not exists draft_url text,
  add column if not exists published_url text,
  add column if not exists creative_direction text,
  add column if not exists creative_direction_confirmed_at timestamptz,
  add column if not exists approved_at timestamptz,
  add column if not exists maintenance_active boolean not null default false,
  add column if not exists internal_notes text,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.project_checklist_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.leads(id) on delete cascade,
  key text not null,
  label text not null,
  completed boolean not null default false,
  completed_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(project_id, key)
);

create table if not exists public.invoice_profiles (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.leads(id) on delete cascade,
  billing_name text,
  vat_number text,
  tax_code text,
  billing_address text,
  postal_code text,
  city text,
  province text,
  country text,
  sdi_code text,
  pec text,
  billing_email text,
  notes text,
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.leads(id) on delete cascade,
  type text not null,
  title text not null,
  amount numeric(10,2),
  status text not null default 'da_pagare',
  method text not null default 'bonifico',
  payment_url text,
  payment_instructions text,
  paid_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.briefs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.leads(id) on delete cascade,
  business_description text,
  main_services text,
  website_goal text,
  ideal_audience text,
  message_to_communicate text,
  main_cta text,
  social_links text,
  current_website text,
  free_notes text,
  submitted_at timestamptz,
  updated_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public)
values ('project-materials', 'project-materials', false)
on conflict (id) do nothing;

create table if not exists public.project_materials (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.leads(id) on delete cascade,
  category text not null default 'altro',
  file_name text not null,
  file_path text not null,
  file_url text,
  file_type text,
  file_size bigint,
  note text,
  uploaded_by text not null default 'client',
  created_at timestamptz not null default now()
);

create table if not exists public.revision_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.leads(id) on delete cascade,
  page text not null,
  section text,
  comment text not null,
  priority text not null default 'media',
  status text not null default 'aperta',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.leads(id) on delete cascade,
  title text not null,
  description text not null,
  request_type text not null default 'altro',
  priority text not null default 'media',
  status text not null default 'ricevuta',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.request_attachments (
  id uuid primary key default gen_random_uuid(),
  revision_request_id uuid references public.revision_requests(id) on delete cascade,
  maintenance_request_id uuid references public.maintenance_requests(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_url text,
  file_type text,
  file_size bigint,
  created_at timestamptz not null default now(),
  check (
    (revision_request_id is not null and maintenance_request_id is null)
    or (revision_request_id is null and maintenance_request_id is not null)
  )
);

create table if not exists public.portal_settings (
  id integer primary key default 1,
  bank_account_holder text,
  iban text,
  payment_notes text,
  default_public_base_url text,
  updated_at timestamptz not null default now(),
  check (id = 1)
);

insert into public.portal_settings (id)
values (1)
on conflict (id) do nothing;

alter table public.project_checklist_items enable row level security;
alter table public.invoice_profiles enable row level security;
alter table public.payments enable row level security;
alter table public.briefs enable row level security;
alter table public.project_materials enable row level security;
alter table public.revision_requests enable row level security;
alter table public.maintenance_requests enable row level security;
alter table public.request_attachments enable row level security;
alter table public.portal_settings enable row level security;

grant all on public.project_checklist_items to service_role;
grant all on public.invoice_profiles to service_role;
grant all on public.payments to service_role;
grant all on public.briefs to service_role;
grant all on public.project_materials to service_role;
grant all on public.revision_requests to service_role;
grant all on public.maintenance_requests to service_role;
grant all on public.request_attachments to service_role;
grant all on public.portal_settings to service_role;

create index if not exists idx_leads_status on public.leads(status);
create index if not exists idx_project_materials_project on public.project_materials(project_id);
create index if not exists idx_revision_requests_project on public.revision_requests(project_id);
create index if not exists idx_maintenance_requests_project on public.maintenance_requests(project_id);
create index if not exists idx_payments_project on public.payments(project_id);
