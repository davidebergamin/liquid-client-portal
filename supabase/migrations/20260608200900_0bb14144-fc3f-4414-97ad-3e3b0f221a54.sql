ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS full_image_url text,
  ADD COLUMN IF NOT EXISTS screenshot_status text NOT NULL DEFAULT 'ready';

ALTER TABLE public.lead_sites
  ADD COLUMN IF NOT EXISTS full_image_url text,
  ADD COLUMN IF NOT EXISTS screenshot_status text NOT NULL DEFAULT 'ready';