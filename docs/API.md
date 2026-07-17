# DailySpark API Reference

Base URL (dev): `http://localhost:4000/api`

All responses follow: `{ success: true, data: ... }` or `{ success: false, message, errors? }`.

## Auth (`/api/auth`)

| Method | Path | Auth required | Body | Description |
|---|---|---|---|---|
| POST | `/register` | No | `{ name, email, password }` | Creates account, sends verification email, returns access token + sets refresh cookie |
| POST | `/login` | No | `{ email, password }` | Returns access token + sets refresh cookie |
| POST | `/google` | No | `{ idToken }` | Google Identity Services ID token → login/register/link, returns access token + sets refresh cookie |
| POST | `/refresh` | Cookie | — | Rotates refresh token, returns new access token |
| POST | `/logout` | Cookie | — | Revokes current refresh token, clears cookie |
| POST | `/logout-all` | Bearer | — | Revokes all refresh tokens for the user (all devices) |
| POST | `/verify-email` | No | `{ token }` | Marks email verified |
| POST | `/resend-verification` | Bearer | — | Resends verification email |
| POST | `/forgot-password` | No | `{ email }` | Sends reset email if account exists (always 200, enumeration-safe) |
| POST | `/reset-password` | No | `{ token, newPassword }` | Sets new password, revokes all sessions |
| GET | `/me` | Bearer | — | Returns the current authenticated user |

**Auth notes:**
- Access tokens are short-lived JWTs (default 15m), sent in the `Authorization: Bearer <token>` header. Never stored in localStorage on the frontend — kept in memory only.
- Refresh tokens are long-lived (default 30d), stored as an `httpOnly`, `sameSite=lax` cookie scoped to `/api/auth`, and rotated on every use.
- Password requirements: min 8 chars, at least one uppercase, one lowercase, one number.
- Auth endpoints are rate-limited to 10 requests / 15 minutes per IP.
- **Google OAuth setup:** create an OAuth 2.0 Client ID (Web application) in Google Cloud Console, add `http://localhost:5173` to Authorized JavaScript origins, then set `GOOGLE_CLIENT_ID` (backend) and `VITE_GOOGLE_CLIENT_ID` (frontend, same value) in your env files. If unset, the Google Sign-In button simply doesn't render — nothing breaks.
- Google sign-in auto-links to an existing local account sharing the same email (only if that account has no Google ID attached yet), rather than creating a duplicate user.

## Users (`/api/users`)

All routes require `Authorization: Bearer <accessToken>`.

| Method | Path | Body | Description |
|---|---|---|---|
| PATCH | `/me` | `{ name?, bio?, interests?, preferredLanguage? }` (at least one field) | Updates profile fields. `interests` must be from the fixed category list; `preferredLanguage` must be a supported language code. |
| POST | `/me/avatar` | multipart/form-data, field `avatar` | Uploads a JPEG/PNG/WebP (max 5MB) to Cloudinary, sets `avatarUrl` |
| GET | `/me/stats` | — | Returns account stats (member since, active sessions, etc.) — XP/streak/lessons fields are placeholders until Steps 5-7 land |
| DELETE | `/me` | `{ confirmation: "DELETE", password? }` | Permanently deletes the account. `password` is required for local (email/password) accounts; not required for Google-only accounts. |

**Notes:**
- `PublicUser.hasPassword` tells the frontend whether to prompt for a password on deletion (false for Google-only accounts).
- Cloudinary setup: create a free account, set `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`. If unset, avatar upload returns a clear 400 error rather than crashing.

## Lessons (`/api/lessons`)

| Method | Path | Auth | Body / Query | Description |
|---|---|---|---|---|
| GET | `/` | Optional | `?category=&difficulty=&tag=&q=&author=&sort=&page=&limit=` | Paginated list of published lessons. Personalizes `isLiked`/`isBookmarked` if a valid token is sent. |
| GET | `/bookmarked` | Bearer | `?page=&limit=` | Current user's bookmarked lessons |
| GET | `/:slug` | Optional | — | Full lesson detail (content, audio, references) |
| POST | `/` | Bearer (ADMIN) | `CreateLessonRequestDTO` | Creates a lesson; slug auto-generated and de-duplicated from title |
| PATCH | `/:id` | Bearer (ADMIN) | Partial `CreateLessonRequestDTO` | Updates a lesson |
| DELETE | `/:id` | Bearer (ADMIN) | — | Deletes a lesson (cascades likes/bookmarks) |
| POST | `/:id/like` | Bearer | — | Toggles like, returns `{ liked, likesCount }` |
| POST | `/:id/bookmark` | Bearer | — | Toggles bookmark, returns `{ bookmarked }` |

**Notes:**
- `category` must be one of the 16 fixed categories in `packages/types/src/content.ts`.
- **Search (`q`):** case-insensitive substring match against title, summary, and exact tag match. **Author (`author`):** case-insensitive substring match against the linked author's name or the `authorName` fallback field.
- **Sort (`sort`):** `newest` (default, by `publishedAt`), `popular` (by `likesCount`), or `trending` (lessons with the most likes in the last 7 days; lessons with zero recent likes fall back to newest-first so a quiet category still returns a full page). Trending is computed with a `groupBy` over recent `Like` rows rather than a precomputed score — fine at current volume, worth a materialized/cached trending score if the lesson catalog grows large.
- There's no admin-creation UI yet (that's Step 13) — promote a user to ADMIN directly in the DB (`UPDATE users SET role = 'ADMIN' WHERE email = '...'`) to create lessons via the API/Postman in the meantime.
- Quizzes (Step 6) will attach to a `Lesson` via a `quizId`/`lessonId` relation once that module lands.

## Quizzes

Nested under lessons for authoring; standalone under `/api/quizzes` for taking.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/lessons/:lessonId/quiz` | Optional | Fetch the quiz for a lesson — answer-safe (no `isCorrect`/`correctFillAnswers` exposed) |
| POST | `/api/lessons/:lessonId/quiz` | Bearer (ADMIN) | Create a quiz (one per lesson). Validates: MULTIPLE_CHOICE/TRUE_FALSE/IMAGE need ≥2 options with exactly one correct; TRUE_FALSE needs exactly 2; FILL_BLANK needs ≥1 accepted answer. |
| PATCH | `/api/lessons/:lessonId/quiz` | Bearer (ADMIN) | Update a quiz. Passing `questions` replaces the full question set (no per-question diffing yet). |
| DELETE | `/api/lessons/:lessonId/quiz` | Bearer (ADMIN) | Delete a quiz |
| POST | `/api/quizzes/:quizId/submit` | Bearer | Submit answers; **scoring happens entirely server-side** — the client never computes or sends a score. Returns per-question correctness + explanations + XP earned (`round(xpReward * correct/total)`). |
| GET | `/api/quizzes/:quizId/attempts` | Bearer | Current user's own attempt history for a quiz |

**Question types:** `MULTIPLE_CHOICE`, `TRUE_FALSE`, `IMAGE` (image + options) all answer via `selectedOptionId`; `FILL_BLANK` answers via `fillAnswer`, matched case-insensitively against a list of accepted strings.

## Gamification (`/api/gamification`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/me` | Bearer | Full summary: XP, level, streak, lessons/quizzes completed, all badges (earned + locked) |
| GET | `/leaderboard?scope=allTime\|weekly` | Optional | Top 20 by total XP (`allTime`) or XP earned in the last 7 days (`weekly`). Includes the viewer's own rank even if outside the top 20 (omitted for `weekly` if they have no activity that week). |

**Mechanics:**
- **Level formula:** `level = floor(totalXp / 100) + 1` — simple and transparent, defined in `apps/api/src/lib/leveling.ts`.
- **XP awarding:** happens automatically inside `POST /api/quizzes/:quizId/submit` — `xpEarned = round(quiz.xpReward * correct/total)`. The quiz response includes a `gamification` object with `xpEarned`, `totalXp`, `level`, `leveledUp`, `currentStreak`, `streakExtended`, and `newBadges`.
- **Streaks:** calendar-day based (UTC), extended once per day on any quiz completion; missing a day resets to 1. This is a documented simplification — a per-user-timezone version would be a reasonable future refinement.
- **Badges:** defined in `apps/api/src/modules/gamification/badgeDefinitions.ts` (single source of truth), seeded idempotently on server startup and in the seed script. Current badges: `first_spark`, `week_streak`, `month_streak`, `century_club`, `xp_1000`, `perfect_score`, `ten_lessons`.

## Social features

### Comments
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/lessons/:lessonId/comments` | Optional | Full comment tree (replies nested), personalized `isLiked`/`isOwn` |
| POST | `/api/lessons/:lessonId/comments` | Bearer | Create a top-level comment or reply (`parentId`). Replying notifies the parent comment's author. |
| DELETE | `/api/comments/:commentId` | Bearer (own or ADMIN) | Soft-deletes — content is cleared and shown as `[deleted]`, but reply threads are preserved |
| POST | `/api/comments/:commentId/like` | Bearer | Toggle like |

### Follows & public profiles
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/users/:userId/follow` | Bearer | Toggle follow; notifies the target user |
| GET | `/api/users/:userId/profile` | Optional | Public profile: level, XP, streak, follower/following counts, `isFollowedByViewer` |

### Activity feed & reports
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/social/feed` | Bearer | Recent quiz completions + lesson likes from people you follow. **Derived on the fly** from existing tables (no separate event log) — fine at current volume, worth revisiting if the follow graph gets large. |
| POST | `/api/social/reports` | Bearer | Report a `LESSON` or `COMMENT` with a reason; stored as `PENDING` for admin review (Step 13) |

### Notifications (in-app)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | Bearer | Paginated list + `unreadCount` |
| POST | `/api/notifications/:id/read` | Bearer | Mark one as read |
| POST | `/api/notifications/read-all` | Bearer | Mark all as read |

Triggered automatically for: new follower, reply to your comment. Push delivery via Firebase Cloud Messaging is Step 11 — these are in-app only for now, polled every 60s by the frontend bell.

## AI features (`/api/ai`)

All routes require `Authorization: Bearer <accessToken>`. Requires `ANTHROPIC_API_KEY` set — without it, these return a clear 400 rather than crashing.

| Method | Path | Body | Description |
|---|---|---|---|
| POST | `/explain` | `{ lessonId, question }` | Explains a concept from the lesson in plain language, grounded in the lesson's actual content |
| POST | `/flashcards` | `{ lessonId }` | Generates 5 study flashcards (front/back) from the lesson |
| POST | `/practice-questions` | `{ lessonId }` | Generates 4 short-answer self-test questions |
| POST | `/translate` | `{ lessonId, targetLanguage }` | Translates title/summary/content into a supported language code |
| GET | `/recommendations` | — | Suggested lessons — **heuristic, not LLM-based** (matches the user's stated interests + previously-liked categories, falling back to popular lessons). Kept fast/free/deterministic; an LLM-ranked layer could sit on top later if needed. |
| GET | `/quota` | — | Current daily AI usage: `{ used, limit, remaining }` (`limit`/`remaining` are `null` for Premium) |

**Quota:** free-tier accounts get **10 AI requests/day** (`explain`/`flashcards`/`practice-questions`/`translate` all count against it; `recommendations` and `quota` don't). Premium accounts (`user.isPremium`) are unlimited. Resets on UTC calendar-day change. Exceeding the quota returns `429`.

**Implementation note:** the actual Anthropic SDK call is isolated in `apps/api/src/lib/anthropic.ts` (`askClaude` / `askClaudeForJSON`) specifically so it can be mocked cleanly in tests — no real network calls happen in the test suite.

## Push notifications (Firebase Cloud Messaging)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/notifications/device-token` | Bearer | Register this browser/device for push (`{ token, platform }`, `platform` defaults to `WEB`) |
| DELETE | `/api/notifications/device-token` | Bearer | Unregister a device token |

Every in-app notification created via `notificationsService.create` (new follower, comment reply) now **also** attempts a push to all of that user's registered devices, fire-and-forget — a failed push never breaks the triggering action. Invalid/expired tokens (Firebase error `messaging/registration-token-not-registered`) are automatically pruned from the database.

**Setup required for real push delivery:**
1. Backend: set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (from a Firebase service account JSON) in `.env`. Without these, push silently no-ops (logged as a warning) rather than crashing.
2. Frontend: set `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, and `VITE_FIREBASE_VAPID_KEY` (Cloud Messaging → Web configuration → generate a key pair, in Firebase Console).
3. Edit `apps/web/public/firebase-messaging-sw.js` and replace the placeholder config values with your actual Firebase config (the same values as the `VITE_FIREBASE_*` vars — service workers are served as static files and can't read `import.meta.env`).
4. Click "Enable push notifications" in the notification bell dropdown once logged in.

Without any of this configured, everything else keeps working exactly as before — the button just shows "not available in this browser or aren't configured yet" instead of registering a device.

## Payments (Stripe)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/payments/create-checkout-session` | Bearer | `{ interval: "monthly" \| "yearly" }` → Stripe Checkout URL to redirect to |
| POST | `/api/payments/create-portal-session` | Bearer | Stripe Billing Portal URL (manage/cancel) — requires an existing subscription |
| GET | `/api/payments/subscription` | Bearer | Current subscription state, or `null` if never subscribed |
| POST | `/api/payments/webhook` | Stripe signature | Receives Stripe events, syncs `Subscription` + `User.isPremium` |

**Webhook setup is the part most people get wrong:** the route is mounted in `app.ts` with `express.raw({ type: "application/json" })` **before** the global `express.json()` middleware, because Stripe's signature verification (`stripe.webhooks.constructEvent`) needs the exact raw request bytes — once JSON-parsed, verification always fails. If you add new routes near this one, make sure the raw-body mount stays ahead of the JSON parser.

**Events handled:** `customer.subscription.created`/`updated` (activates Premium, upserts `Subscription`), `customer.subscription.deleted` (deactivates Premium), `invoice.payment_failed` (marks `PAST_DUE`). All handlers are idempotent since Stripe may redeliver events.

**Local testing:** use the [Stripe CLI](https://stripe.com/docs/stripe-cli) — `stripe listen --forward-to localhost:4000/api/payments/webhook` — and set the CLI-provided webhook secret as `STRIPE_WEBHOOK_SECRET`. Without `STRIPE_SECRET_KEY`/price IDs configured, checkout/portal endpoints return a clear 400 rather than crashing.

## Admin (`/api/admin`)

All routes require `Authorization: Bearer <accessToken>` **and** `role: ADMIN`. Promote a user via `UPDATE users SET role = 'ADMIN' WHERE email = '...'` until this itself gets a UI (chicken-and-egg — the very first admin has to be made this way).

| Method | Path | Body/Query | Description |
|---|---|---|---|
| GET | `/stats` | — | Site-wide stats: users, new signups (7d), premium count, lesson counts, quiz attempts + completion rate, pending reports, estimated monthly revenue |
| GET | `/users` | `?search=&page=&limit=` | Paginated user list, searchable by name/email |
| PATCH | `/users/:userId` | `{ role?, isActive?, isPremium? }` | Update a user. An admin can't demote or delete their own account through this endpoint (prevents accidental lockout). |
| DELETE | `/users/:userId` | — | Delete a user (cascades to their content) |
| GET | `/reports` | `?status=&page=&limit=` | List reports, filterable by `PENDING`/`REVIEWED`/`DISMISSED` |
| PATCH | `/reports/:reportId` | `{ status }` | Update a report's status. Acting on the underlying content (deleting a reported comment, unpublishing a reported lesson) currently uses the same endpoints those features already expose (`DELETE /api/comments/:id`, `PATCH /api/lessons/:id`) rather than a separate admin-only action — an admin already has the role to call them directly. |
| GET | `/lessons` | `?search=&page=&limit=` | List **all** lessons including unpublished drafts, with quiz-attached status |

**Deliberately out of scope for this step** (documented rather than silently skipped):
- **Comment pre-approval queue** — comments publish immediately; moderation happens reactively via the reports queue above, not a pending-approval gate. Adding a gate would slow down the discussion feature for the 99% of comments that are fine.
- **Category management UI** — categories are a fixed 16-item taxonomy (`packages/types/src/content.ts`), not a dynamic DB table, so there's nothing to CRUD here by design (keeps content organization consistent across the app).
- **Site settings panel** — no generic key-value settings store exists yet; would be a reasonable next addition if configurable behavior (e.g. free AI quota, badge thresholds) needs to move out of code.
- **Content scheduling** — `Lesson.publishedAt` already exists and `isPublished` can be toggled, but there's no "publish at future date" cron/queue yet.
- **True revenue tracking** — `estimatedMonthlyRevenue` is `premiumUserCount × $6`, not a sync of actual Stripe charge amounts (that would need to consume Stripe's Invoice webhook data, which isn't wired up).
