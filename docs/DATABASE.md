# Database Schema

Full source of truth: `packages/db/prisma/schema.prisma`. This is a guided
tour grouped by feature area — useful for onboarding without reading 500+
lines of Prisma syntax cold.

## Users & Auth (Step 1-3)
- **User** — the center of the graph. Holds profile fields, gamification
  state (`totalXp`, `level`, `currentStreak`, `longestStreak`), AI quota
  tracking (`dailyAiRequestCount`), and `role` (`USER`/`ADMIN`).
- **RefreshToken** — one row per active session/device, so "logout everywhere"
  and per-device revocation both work. Tokens are stored hashed, never in plaintext.
- **EmailVerificationToken**, **PasswordResetToken** — single-use, hashed, expiring tokens.

## Content (Step 5-6)
- **Lesson** — category is a plain string validated against a fixed list at
  the application layer (`packages/types/src/content.ts`), not a DB enum, so
  the category list can grow without a migration.
- **Bookmark**, **Like** — join tables with `@@unique([userId, lessonId])`,
  so toggling is idempotent at the database level, not just in application logic.
- **Quiz** — one-to-one with `Lesson`. **Question** supports 4 types
  (`MULTIPLE_CHOICE`, `TRUE_FALSE`, `FILL_BLANK`, `IMAGE`) via a single
  model rather than a table per type — simpler joins, at the cost of some
  nullable fields (`correctFillAnswers` only meaningful for `FILL_BLANK`).
- **QuestionOption** — never exposed with `isCorrect` to someone taking a quiz;
  only revealed in the result after `QuizAttempt` scoring.
- **QuizAttempt** — stores submitted answers as `Json` for history/review, but
  scoring is always recomputed server-side from `Question`/`QuestionOption`,
  never trusted from the client.

## Gamification (Step 7)
- **Badge** — definitions live in code (`apps/api/src/modules/gamification/badgeDefinitions.ts`),
  synced to this table idempotently on server startup. The table is the
  source of truth for *awarded* badges; the code file defines *what badges exist*.
- **UserBadge** — join table, `@@unique([userId, badgeId])` prevents double-awarding.
- **XpEvent** — an append-only ledger of every XP grant, used for the weekly
  leaderboard (sum within the last 7 days) and as an audit trail of XP sources.

## Social (Step 8)
- **Comment** — self-referential (`parentId` → `Comment`) for reply threads,
  soft-deleted (`isDeleted` + cleared `content`) rather than hard-deleted so
  reply chains don't break when a parent comment is removed.
- **CommentLike**, **Follow** — join tables, same idempotent-unique-constraint pattern.
- **Report** — generic via `targetType` (`LESSON`/`COMMENT`) + `targetId` string
  rather than two separate foreign keys, since a report can point at either.
- **Notification** — in-app notifications; **DeviceToken** (Step 11) is
  separate since a user can have multiple registered devices for push.

## Payments (Step 12)
- **Subscription** — one-to-one with `User`. Synced entirely from Stripe
  webhook events, never written to directly by application code outside the
  webhook handler. `User.isPremium` is a denormalized flag kept in sync for
  fast reads elsewhere (AI quota checks, etc.) without an extra join.

## Admin & Ops (Step 13-14)
- **AuditLog** — append-only, `actorId` nullable (`onDelete: SetNull`) so a
  deleted admin's past actions remain in the log rather than vanishing.

## Design conventions used throughout
- **Soft vs. hard delete:** hard-deleted almost everywhere (cascades via
  `onDelete: Cascade`) except `Comment` (soft, to preserve thread structure).
- **Idempotent joins:** every many-to-many/toggle relationship has a
  `@@unique` compound constraint, so "toggle like" is safe to call concurrently
  without race-condition duplicate rows.
- **Indexes:** every foreign key and every column used in a `WHERE`/`ORDER BY`
  in a hot-path query has an explicit `@@index` — check `schema.prisma` directly
  for the full list.
