# DailySpark Architecture

## Monorepo

npm workspaces, no build orchestrator (Turborepo could be added later once
the module count justifies it). Three workspace groups:

- `apps/web` — React 19 SPA
- `apps/api` — Express REST API
- `packages/*` — shared code (`db` = Prisma schema/client, `types` = shared DTOs)

## Backend module pattern

Each backend feature lives in `apps/api/src/modules/<feature>/` with:

```
<feature>/
├── <feature>.routes.ts       # Express Router, mounted in app.ts
├── <feature>.controller.ts   # thin HTTP layer, calls service
├── <feature>.service.ts      # business logic, calls prisma
├── <feature>.validators.ts   # zod schemas for request validation
└── <feature>.test.ts         # unit/integration tests
```

This keeps concerns separated: controllers never touch Prisma directly,
services never touch `req`/`res`.

## Frontend module pattern

Feature-sliced under `apps/web/src/features/<feature>/`:

```
<feature>/
├── api/            # TanStack Query hooks (useLogin, useLessons, etc.)
├── components/     # feature-specific components
├── types.ts        # local types (imports shared ones from @dailyspark/types)
└── store.ts        # local Zustand/Context store if needed
```

Shared design-system primitives (Button, Card, Modal, Skeleton, Toast, etc.)
live in `apps/web/src/components/ui/`.

## Build Roadmap & Progress

| # | Feature | Status |
|---|---|---|
| 0 | Monorepo scaffold, Docker, Prisma init, CI | ✅ Done |
| 1 | Auth (register/login/JWT/refresh/verify/reset) | ✅ Done |
| 2 | Google OAuth | ✅ Done |
| 3 | User profile (edit, avatar, interests, language, delete) | ✅ Done |
| 4 | Design system + landing page | ✅ Done |
| 5 | Lessons module | ✅ Done |
| 6 | Quiz system | ✅ Done |
| 7 | Gamification (XP, streaks, badges, leaderboard) | ✅ Done |
| 8 | Social features | ✅ Done |
| 9 | Search | ✅ Done |
| 10 | AI features | ✅ Done |
| 11 | Notifications (FCM) | ✅ Done |
| 12 | Payments (Stripe) | ✅ Done |
| 13 | Admin dashboard + analytics | ✅ Done |
| 14 | SEO + security + performance pass | ✅ Done |
| 15 | Test suite completion + docs finalization | ✅ Done |

Each row above becomes "Done" only once the feature has working code,
passing tests, and run/test instructions delivered in-conversation.

**All 15 steps are now complete.** See `docs/SECURITY.md` for the security/SEO/
performance checklist, `docs/DATABASE.md` for the schema tour, and
`docs/DEPLOYMENT.md` for shipping this to production. This remains a
real, working MVP-scope build — not a claim that every conceivable edge case,
scaling concern, or polish item is covered; each doc is explicit about what's
simplified and why.

## Design System (Step 4)

**Concept:** a struck-match / spark-trail motif — literal to the product name,
and reused as the visual language for streaks (a row of lit dots = days in a row).

**Palette** (`tailwind.config.js`):
| Token | Hex | Use |
|---|---|---|
| `ink` | `#14182B` | Dark background / primary text on light surfaces |
| `paper` | `#FBF3E1` | Light background / primary text on dark surfaces |
| `spark-500` | `#FFB627` | Primary accent (CTAs, active states) — pairs with `text-ink`, not white |
| `ember-500` | `#E1483B` | Secondary accent (urgency, streaks, destructive actions) |
| `teal-500` | `#1F7A6C` | Tertiary accent (success states, free-tier checkmarks) |

**Type:** Bricolage Grotesque (`font-display`, headings) + Inter (`font-sans`, body) +
IBM Plex Mono (`font-mono`, stat labels / eyebrows / prices) — loaded via Google Fonts
in `index.html`.

**Components:** shared primitives live in `apps/web/src/components/ui/` (`Button`,
`Input`, `Card`) and now consistently use the tokens above instead of default
Tailwind gray/red/blue. The `brand-*` color scale is kept as a backward-compatible
alias mapped onto the amber/spark tones, so older references still render on-theme.

**Landing page:** `apps/web/src/features/landing/components/` — `Nav`, `Hero`
(with the animated `MatchIllustration` signature piece and `SparkTrail`), `Features`,
`HowItWorks` (genuine numbered sequence), `Testimonials` (flashcard-styled),
`Pricing`, `FAQ` (accessible accordion), `Contact`, `Footer` — assembled in
`pages/HomePage.tsx`. Motion via Framer Motion, respecting `prefers-reduced-motion`.

## Why this order

- Auth must exist before anything user-specific.
- Profile before content, since interests/language personalize content.
- Landing page is independent — built early since it needs no backend.
- Lessons before quizzes (quizzes belong to lessons).
- Quizzes before gamification (XP/streaks are earned by completing them).
- Social/search layer on top of a content base that already exists.
- AI features enhance lessons/quizzes that must already exist.
- Payments/admin/analytics come once there's something to gate/monitor.
- Security/performance/SEO hardening and full test coverage as a final pass
  across the whole, now-complete surface area.
