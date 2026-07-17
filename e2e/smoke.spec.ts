import { test, expect } from "@playwright/test";

test.describe("Smoke test: core signup and browse flow", () => {
  test("a new visitor can register and land on the dashboard", async ({ page }) => {
    const uniqueEmail = `e2e-${Date.now()}@example.com`;

    await page.goto("/register");
    await page.getByLabel("Full name").fill("E2E Test User");
    await page.getByLabel("Email").fill(uniqueEmail);
    await page.getByLabel("Password").fill("StrongPass123");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/Welcome back, E2E Test User/)).toBeVisible();
  });

  test("the landing page loads and links to the lessons browse page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Strike a spark/i })).toBeVisible();

    await page.getByRole("link", { name: "Lessons" }).click();
    await expect(page).toHaveURL(/\/lessons/);
    await expect(page.getByRole("heading", { name: "Today's lessons" })).toBeVisible();
  });
});
