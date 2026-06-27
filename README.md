# Liquid Client Portal

Next.js MVP for managing Liquid clients from onboarding through delivery, approval, publication, and maintenance.

## What Is Included

- private admin dashboard
- personal client link at `/p/[slug]`
- legacy client redirect from `/b/[slug]`
- project statuses and checklist
- manual payments with bank transfer/link instructions
- invoice data collection
- material uploads with notes
- initial brief form
- style references, likes, comments, and creative direction confirmation
- draft URL and revision requests
- final approval timestamp
- maintenance requests with optional attachments

## Environment

Copy `.env.example` to `.env` and fill:

```bash
# Project API URL, not the dashboard URL.
# Example: https://abcdefghijklmnopqrst.supabase.co
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Admin login supports Supabase Auth with email/password using `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`.

Optional local fallback and public/deploy helpers:

```bash
LIQUID_ADMIN_PASSWORD=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`SUPABASE_SERVICE_ROLE_KEY` must stay server-side only. Do not expose it as a `NEXT_PUBLIC_*` variable.

## Supabase

Apply all migrations in `supabase/migrations`, including:

```text
20260625100000_liquid_client_portal_mvp.sql
```

If the Supabase CLI is installed and the project is linked:

```bash
supabase login
supabase link --project-ref <project-ref>
npm run db:push
```

That migration adds the project delivery tables, private `project-materials` storage bucket, payments, invoice profiles, brief, revision requests, maintenance requests, attachments, and portal settings.

## Local Development

```bash
npm install
npm run check:setup
npm run dev
```

Open:

- admin: `http://localhost:3000/admin`
- login: `http://localhost:3000/admin/login`
- client links: `http://localhost:3000/p/[slug]`

## Verification

```bash
npm run verify
```

This runs lint and production build.

With the dev server running you can also smoke-test routes:

```bash
npm run check:setup -- --smoke-url=http://localhost:3000
```

To verify that the remote Supabase schema has the required tables and storage bucket:

```bash
npm run check:setup -- --db-check
```

If you only want to test routes while env vars are still incomplete:

```bash
npm run check:setup -- --smoke-only --smoke-url=http://localhost:3000
```

Manual end-to-end checklist:

1. Log in to `/admin`.
2. Create a project.
3. Copy/open the client link.
4. Fill invoice data.
5. Fill the brief.
6. Upload project materials.
7. Add style references in admin.
8. Like/comment references from the client portal.
9. Confirm creative direction.
10. Add a draft URL in admin.
11. Submit revision requests from the client portal.
12. Update revision status in admin.
13. Approve the site from the client portal.
14. Mark balance as paid in admin.
15. Create a maintenance request with an attachment.
16. Update maintenance status in admin.

## Deploy

**Produzione:** https://liquid-client-portal.vercel.app  
**Progetto Vercel:** `liquid-client-portal`  
Dettagli completi in [`docs/deployment.md`](docs/deployment.md).

```bash
npm run deploy:prod
```

Deploy on Vercel with the same environment variables. Set `NEXT_PUBLIC_SITE_URL` and `portal_settings.default_public_base_url` to `https://liquid-client-portal.vercel.app` so copied client links are correct.
