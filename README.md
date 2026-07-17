# DailySpark

Become smarter in 5 minutes a day — bite-sized lessons, quizzes, streaks, and gamification.

> **Status:** All 15 planned build steps complete (see `docs/ARCHITECTURE.md` for
> the full roadmap and what each step shipped). This is a working, tested,
> incrementally-built full-stack app — not a final "done forever" product.
> See `docs/SECURITY.md` for what's hardened and what's explicitly out of scope.

## Feature Overview

- **Auth:** email/password + Google OAuth, JWT + rotating refresh tokens, email verification, password reset
- **Profiles:** avatar upload (Cloudinary), interests, language, account deletion, public profiles
- **Content:** 16-category lesson library, full-text search, difficulty levels, audio narration support
- **Quizzes:** 4 question types, server-side scoring, timed mode, per-question explanations
- **Gamification:** XP, levels, streaks, badges, weekly/all-time leaderboards
- **Social:** threaded comments, likes, follows, activity feed, content reporting
- **AI:** concept explanations, flashcard/practice-question generation, translation, heuristic recommendations (Anthropic API)
- **Notifications:** in-app + push (Firebase Cloud Messaging)
- **Payments:** Stripe subscriptions (Checkout + Billing Portal + webhook-synced premium status)
- **Admin:** analytics dashboard, user management, report moderation, content oversight
- **SEO/Security/Performance:** dynamic sitemap, structured data, audit logging, rate limiting, code-split bundles

## Tech Stack

- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query, Framer Motion
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** JWT + refresh tokens, Google OAuth, email verification, password reset
- **Storage:** Cloudinary
- **AI:** Anthropic API
- **Notifications:** Firebase Cloud Messaging
- **Payments:** Stripe
- **Infra:** Docker, Vercel (web), Railway/Render (api)
- **Testing:** Vitest (unit + integration, both apps), Playwright (E2E scaffold)

## Monorepo Layout

```
apps/web        React frontend
apps/api        Express backend
packages/db     Prisma schema + client (shared)
packages/types  Shared TypeScript types/DTOs
docker/         Dockerfiles + docker-compose
e2e/            Playwright end-to-end tests
docs/           Architecture, API, database, security, deployment docs
```

## Prerequisites

- Node.js >= 20
- npm >= 10
- Docker + Docker Compose (for Postgres/Redis locally, or full containerized run)

## Quick Start (local dev, no Docker for app code)

```bash
# 1. Install all workspace dependencies
npm install

# 2. Copy env file and fill in secrets (at minimum: JWT_ACCESS_SECRET, JWT_REFRESH_SECRET)
cp .env.example .env

# 3. Start Postgres + Redis only
docker compose -f docker/docker-compose.yml up postgres redis -d

# 4. Generate Prisma client + run migrations + seed sample data
npm run prisma:generate
npm run prisma:migrate
npm run db:seed

# 5. Run both apps in dev mode
npm run dev
```

- API: http://localhost:4000 (health check: `/health`, sitemap: `/sitemap.xml`)
- Web: http://localhost:5173
- Seeded admin login: `admin@dailyspark.app` / `StrongPass123`

## Full Docker Run

```bash
docker compose -f docker/docker-compose.yml up --build
```

## Testing

```bash
npm run test              # unit + integration tests, both apps
npm run test:e2e          # Playwright E2E (requires the full stack running — see playwright.config.ts)
```

Every backend feature module has an integration test suite (`*.test.ts` next to the code it tests) exercising real HTTP requests against a real test database, with external services (Stripe, Firebase, Anthropic, Google OAuth, Cloudinary) mocked at their SDK boundary rather than hit for real. Pure utility functions (slug generation, XP/leveling math, date math) have dedicated unit tests. The frontend has component/hook unit tests using Testing Library.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Run api + web concurrently in dev mode |
| `npm run build` | Build all workspaces |
| `npm run lint` | Lint all workspaces |
| `npm run test` | Run all test suites |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run prisma:studio` | Open Prisma Studio GUI |
| `npm run db:seed` | Seed the database with sample data |

## Documentation

- [Architecture & Build Roadmap](docs/ARCHITECTURE.md) — folder structure, module patterns, full step-by-step build history
- [API Reference](docs/API.md) — every endpoint, grouped by feature
- [Database Schema](docs/DATABASE.md) — guided tour of every model and why it's shaped the way it is
- [Security, SEO & Performance](docs/SECURITY.md) — checklist against the original spec, with honest notes on what's simplified
- [Deployment Guide](docs/DEPLOYMENT.md) — Vercel + Railway/Render + Postgres, step by step
