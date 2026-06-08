UPDATE public.sites
SET screenshot_status = 'pending'
WHERE link_url IS NOT NULL
  AND (full_image_url IS NULL OR full_image_url = '');

UPDATE public.lead_sites
SET screenshot_status = 'pending'
WHERE link_url IS NOT NULL
  AND image_url IS NULL
  AND (full_image_url IS NULL OR full_image_url = '');