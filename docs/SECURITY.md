# Security, SEO & Performance

Written at Step 14, but most of this was built incrementally from Step 1 onward —
this document is the checklist tying it back to the original spec.

## Security

| Requirement | Status | Where |
|---|---|---|
| Rate limiting | ✅ | `middleware/rateLimiter.ts` — general limiter on all routes, stricter limiter on auth endpoints. AI has its own daily-quota system on top (`modules/ai/aiQuota.ts`). |
| Helmet | ✅ | `app.ts` — includes an explicit `default-src 'none'` CSP (safe for a pure JSON API with no HTML views) and `crossOriginResourcePolicy`. |
| Input validation | ✅ | Every mutating endpoint validates via Zod (`*.validators.ts` per module) before touching the database. |
| XSS protection | ✅ | React escapes all rendered content by default (no `dangerouslySetInnerHTML` anywhere in the codebase); Helmet's CSP is defense-in-depth. |
| CSRF protection | ✅ (by architecture) | All mutating requests require a Bearer access token in an `Authorization` header — something a cross-site form or `<img>` tag cannot forge, since browsers don't attach arbitrary custom headers to cross-origin requests without CORS pre-approval, and CORS here is locked to `WEB_URL`. The refresh-token cookie is `httpOnly` + `sameSite=lax`, so it isn't sent on cross-site POSTs either. No separate CSRF-token system was added on top, since the Bearer-token architecture already removes the attack surface a CSRF token would protect against. |
| SQL injection prevention | ✅ | 100% Prisma parameterized queries — no raw SQL anywhere in the codebase. |
| Password hashing | ✅ | bcrypt, 12 rounds (`lib/password.ts`). |
| Secure cookies | ✅ | Refresh-token cookie: `httpOnly`, `sameSite=lax`, `secure` in production, scoped to `/api/auth`. |
| Audit logging | ✅ | `AuditLog` model + `lib/auditLog.ts`, wired into sensitive admin actions (user role/premium/active changes, user deletion, report status changes). Best-effort — a logging failure never blocks the action itself. |

## SEO

| Requirement | Status | Where |
|---|---|---|
| Meta tags | ✅ | `components/Seo.tsx`, used on the landing page, lesson browse page, and every lesson detail page (title, description, canonical URL). |
| Open Graph tags | ✅ | Included in `Seo.tsx` (`og:*` + `twitter:*` tags). |
| Structured data | ✅ | JSON-LD `Article` schema on every lesson page (headline, description, author, category, publish date). |
| XML sitemap | ✅ | `GET /sitemap.xml` (backend, `modules/seo/seo.routes.ts`) — dynamically generated from all published lessons plus static routes. Regenerated per-request; add a short-TTL cache if the catalog grows large. |
| Robots.txt | ✅ | `apps/web/public/robots.txt` — allows crawling, disallows authenticated-only pages, points to the sitemap. |
| Canonical URLs | ✅ | Set per-page in `Seo.tsx`. |
| Optimized performance | ✅ | See Performance section below. |

**Important honesty note:** this is a client-rendered SPA (no server-side rendering). Meta tags set via `react-helmet-async` are injected client-side after JS executes. Modern Googlebot does execute JS and will generally see these tags, but crawlers that don't run JS (some social-media link unfurlers, older bots) will only see the static `index.html` meta tags. If SEO becomes business-critical, the natural next step is SSR or pre-rendering for the public marketing/lesson pages specifically — the authenticated app (dashboard, profile, admin) doesn't need this.

## Performance

| Requirement | Status | Where |
|---|---|---|
| Lazy loading | ✅ | Route-level code splitting via `React.lazy`/`Suspense` in `App.tsx` (every page is its own chunk); lesson thumbnail images use `loading="lazy"` (the above-the-fold lesson hero image intentionally does NOT, using `fetchPriority="high"` instead, since lazy-loading an LCP candidate hurts rather than helps). |
| Image optimization | ✅ | Cloudinary transforms avatar uploads to a fixed 512×512 crop. Lesson images are admin-provided URLs — no transform pipeline for those yet since lesson image upload (vs. URL entry) wasn't built. |
| Caching | ✅ | TanStack Query caches all reads client-side (`staleTime` in `lib/queryClient.ts`). Server responses are gzip-compressed (`compression` middleware). No server-side response cache (e.g. Redis) yet — Redis is already in the stack (used for rate limiting) if this becomes necessary. |
| Pagination | ✅ | Every list endpoint (lessons, users, reports, notifications, leaderboard) is paginated. |
| Code splitting | ✅ | Same as lazy loading above. |
| Compression | ✅ | `compression` middleware gzips all API responses. |
| Server-side optimization | ✅ | Database indexes on every foreign key and frequently-filtered column (`@@index` throughout `schema.prisma`); N+1 queries avoided via Prisma `include`/`select` and batched `$transaction` calls. |

## What's deliberately not done here

- No CDN configuration (depends on actual hosting choice — Vercel/Cloudflare handle this at the platform level for static assets).
- No server-side rendering (see SEO note above).
- No distributed caching layer beyond what's described above — not needed at current scale, premature to add without real traffic data to justify it.
