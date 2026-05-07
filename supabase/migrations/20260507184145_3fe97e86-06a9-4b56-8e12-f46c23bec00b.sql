
-- Storage bucket for site screenshots
insert into storage.buckets (id, name, public) values ('sites', 'sites', true);

-- Public can read; only service role writes (admin uploads via server fn)
create policy "Public read sites bucket"
on storage.objects for select
using (bucket_id = 'sites');

-- Tables
create table public.sites (
  id uuid primary key default gen_random_uuid(),
  title text,
  image_url text not null,
  width int,
  height int,
  created_at timestamptz not null default now()
);

create table public.likes (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  visitor_id uuid not null,
  created_at timestamptz not null default now(),
  unique (site_id, visitor_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  author_name text not null check (char_length(author_name) between 1 and 60),
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table public.sites enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;

-- Public read
create policy "sites public read" on public.sites for select using (true);
create policy "likes public read" on public.likes for select using (true);
create policy "comments public read" on public.comments for select using (true);

-- Public insert for likes & comments (validated via column checks)
create policy "likes public insert" on public.likes for insert with check (true);
create policy "comments public insert" on public.comments for insert with check (true);

-- Allow public to remove their own like (by visitor_id) — toggle support
create policy "likes public delete" on public.likes for delete using (true);

-- sites: no public write policies (service role bypasses RLS)
create index on public.likes (site_id);
create index on public.comments (site_id);
create index on public.sites (created_at desc);
