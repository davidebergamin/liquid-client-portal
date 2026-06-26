-- Existing clients should not see the welcome screen.
-- Only leads created after this migration (portal_welcome_seen_at stays null) will see it on first visit.

update public.leads
set portal_welcome_seen_at = coalesce(updated_at, now())
where portal_welcome_seen_at is null;
