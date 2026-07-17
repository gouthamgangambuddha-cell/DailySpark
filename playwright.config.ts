import { defineConfig, devices } from "@playwright/test";

/**
 * E2E tests exercise the REAL running stack (Postgres + API + Web), unlike
 * the mocked integration tests in apps/api. Before running `npm run test:e2e`:
 *   1. docker compose -f docker/docker-compose.yml up postgres redis -d
 *   2. npm run prisma:migrate && npm run db:seed
 *   3. npm run dev:api   (in a separate terminal — Playwright only starts the web server below)
 *
 * This is intentionally a starting scaffold with one smoke test, not
 * exhaustive coverage — a real E2E suite would add flows for lessons,
 * quizzes, gamification, and payments, each needing its own seeded fixtures.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev --workspace=apps/web",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
