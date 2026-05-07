-- Add ordering to sites
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_sites_sort_order ON public.sites(sort_order);

-- Backfill sort_order based on created_at (newest = lowest order = top)
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) AS rn FROM public.sites
)
UPDATE public.sites s SET sort_order = o.rn FROM ordered o WHERE s.id = o.id;

-- Leads table (each unique link)
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads public read" ON public.leads FOR SELECT USING (true);

-- Add lead_id to likes and comments; remove author_name need
ALTER TABLE public.likes ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE;
ALTER TABLE public.comments ALTER COLUMN author_name DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_likes_lead ON public.likes(lead_id);
CREATE INDEX IF NOT EXISTS idx_comments_lead ON public.comments(lead_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_like_lead_site ON public.likes(lead_id, site_id) WHERE lead_id IS NOT NULL;