# Deploy — Liquid Client Portal

## Production

| Campo | Valore |
| --- | --- |
| **URL produzione** | https://liquid-client-portal.vercel.app |
| **Progetto Vercel** | `liquid-client-portal` |
| **Team** | `davidebergamindb-gmailcoms-projects` |
| **Repository GitHub** | https://github.com/davidebergamin/liquid-client-portal |

## Comandi

```bash
# Deploy produzione (alias sempre su liquid-client-portal.vercel.app)
npm run deploy:prod
```

Lo script `scripts/deploy-prod.sh` esegue `vercel --prod`, poi riassegna l’alias di produzione e rimuove `client-portal-one-tan.vercel.app` se Vercel lo ricrea.

```bash
# Solo deploy Vercel, senza fix alias (sconsigliato)
vercel --prod --yes
```

Il progetto locale è collegato a `liquid-client-portal` tramite `.vercel/project.json` (gitignored). Se il link si perde:

```bash
vercel link --project liquid-client-portal
```

## URL da non usare

Questi domini appartengono a progetti Vercel sbagliati o deprecati — **non** usarli per link clienti né come `NEXT_PUBLIC_SITE_URL`:

- `https://client-portal-one-tan.vercel.app` (rimosso)
- `https://client-portal.vercel.app`

L’URL canonico è sempre `https://liquid-client-portal.vercel.app` (costante `PRODUCTION_PORTAL_URL` in `src/lib/portal.ts`).

## Variabili ambiente

In produzione impostare su Vercel:

- `NEXT_PUBLIC_SITE_URL=https://liquid-client-portal.vercel.app`
- `portal_settings.default_public_base_url` nelle impostazioni admin → stesso URL
