ALTER TABLE public.lead_sites ADD COLUMN IF NOT EXISTS link_url text;
ALTER TABLE public.lead_sites ALTER COLUMN image_url DROP NOT NULL;
ALTER TABLE public.lead_sites ADD CONSTRAINT lead_sites_has_content CHECK (image_url IS NOT NULL OR link_url IS NOT NULL);
