# Deployment Guide

This covers deploying DailySpark to production: Vercel for the frontend,
Railway or Render for the backend, and a managed Postgres instance.

## 1. Database (Postgres)

Any managed Postgres works — Railway, Render, Supabase, or Neon are all
fine. Steps are the same regardless of provider:

1. Create a new Postgres instance.
2. Copy its connection string (`postgresql://user:pass@host:port/db`).
3. You'll set this as `DATABASE_URL` on the backend in step 2 below.
4. After the backend is deployed once, run migrations against production:
   ```bash
   DATABASE_URL="<production-url>" npm run prisma:migrate:deploy --workspace=packages/db
   ```
   (`prisma:migrate:deploy` applies existing migrations without prompting —
   never run `prisma:migrate dev` against production.)

## 2. Backend (Railway or Render)

Both platforms can build directly from the repo using `docker/Dockerfile.api`,
or from source using their native Node.js buildpacks. Docker is recommended
since it's what's already been tested locally via `docker compose`.

**Railway:**
1. New Project → Deploy from GitHub repo.
2. Set the service's Dockerfile path to `docker/Dockerfile.api` and build
   context to the repo root (matches the `COPY . .` pattern used in the
   Dockerfile).
3. Add all environment variables from `.env.example` — Railway's dashboard
   has a bulk "raw editor" for pasting them in at once.
4. Set `PORT` to whatever Railway injects (`process.env.PORT` is already
   respected via `env.PORT` in `apps/api/src/config/env.ts`).
5. Deploy. Railway gives you a public URL like `https://dailyspark-api.up.railway.app`.

**Render:** functionally identical — "New Web Service" → connect repo →
point at `docker/Dockerfile.api` → same environment variables.

**Required production environment variables** (see `.env.example` for the
full annotated list): `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`,
`COOKIE_SECRET`, `WEB_URL` (your deployed frontend URL — CORS depends on this
being correct), `API_URL`, plus any of the optional integrations you're
actually using (Google OAuth, Cloudinary, SMTP, Firebase, Stripe, Anthropic).
Anything left unset degrades gracefully (see each feature's section in
`docs/API.md`) rather than crashing the server.

## 3. Frontend (Vercel)

1. New Project → import the GitHub repo.
2. Framework preset: Vite.
3. Root directory: `apps/web` (Vercel needs to know this is a monorepo
   subproject — set this in the project's "Root Directory" setting).
4. Build command: `npm run build` (workspace deps resolve automatically once
   Root Directory is set and Vercel detects the `packages/*` workspace deps).
5. Output directory: `dist`.
6. Environment variables — all the `VITE_*` ones from `.env.example`,
   critically `VITE_API_URL` pointing at your deployed backend
   (`https://your-api.up.railway.app/api`) and `VITE_SITE_URL` (your Vercel
   domain, used for canonical URLs and Open Graph tags in `components/Seo.tsx`).
7. Deploy.

## 4. Post-deploy checklist

- [ ] Update the backend's `WEB_URL` env var to the real Vercel URL, and
      redeploy the backend (CORS will reject requests from any other origin).
- [ ] Update `apps/web/public/robots.txt`'s `Sitemap:` line to point at your
      real backend domain.
- [ ] Update `apps/web/public/firebase-messaging-sw.js` with real Firebase
      config values if push notifications are enabled.
- [ ] Set up the Stripe webhook endpoint in the Stripe Dashboard pointing at
      `https://your-api-domain/api/payments/webhook`, and set
      `STRIPE_WEBHOOK_SECRET` to the signing secret Stripe gives you for that
      specific endpoint (different from the CLI's local dev secret).
- [ ] Run `npm run db:seed` once against production if you want the sample
      lessons — otherwise skip it and create real content via the API/admin
      panel once you have an admin account (promote your first user manually
      via a one-off `UPDATE users SET role = 'ADMIN' WHERE email = '...'`).
- [ ] Confirm `GET https://your-api-domain/health` returns `{"success":true,...}`.
- [ ] Confirm `GET https://your-api-domain/sitemap.xml` returns real lesson URLs.

## Local production-like testing

To sanity-check the full stack in Docker before deploying anywhere:

```bash
cp .env.example .env   # fill in real values
docker compose -f docker/docker-compose.yml up --build
```

This builds and runs Postgres, Redis, the API, and the web frontend (served
via nginx) together, matching what a real deployment looks like more closely
than `npm run dev`.
