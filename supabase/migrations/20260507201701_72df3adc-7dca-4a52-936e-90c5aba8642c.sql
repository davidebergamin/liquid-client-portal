-- 1. Add link_url to sites
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS link_url text;

-- 2. lead_sites table
CREATE TABLE IF NOT EXISTS public.lead_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  image_url text NOT NULL,
  title text,
  width integer,
  height integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_sites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lead_sites public read" ON public.lead_sites;
CREATE POLICY "lead_sites public read" ON public.lead_sites FOR SELECT USING (true);

-- 3. comments: allow attachment to lead_site instead of site
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS lead_site_id uuid;
ALTER TABLE public.comments ALTER COLUMN site_id DROP NOT NULL;
