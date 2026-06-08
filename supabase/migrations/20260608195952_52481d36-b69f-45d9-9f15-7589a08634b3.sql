
-- Restrict direct anon writes; all legitimate writes go through server functions using service_role.

-- Drop public SELECT policy on storage.objects to prevent bucket listing.
-- Public file URLs still work because the bucket is public.
DROP POLICY IF EXISTS "Public read sites bucket" ON storage.objects;

-- Deny-by-default for write operations on app tables.
-- No INSERT/UPDATE/DELETE policies => denied for anon & authenticated; service_role bypasses RLS.
REVOKE INSERT, UPDATE, DELETE ON public.comments FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.likes FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.lead_sites FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.sites FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.leads FROM anon, authenticated;

-- Ensure service_role retains full access (used by server functions).
GRANT ALL ON public.comments TO service_role;
GRANT ALL ON public.likes TO service_role;
GRANT ALL ON public.lead_sites TO service_role;
GRANT ALL ON public.sites TO service_role;
GRANT ALL ON public.leads TO service_role;
