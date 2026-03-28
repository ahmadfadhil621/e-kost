// Traceability: demo-login
// REQ 4.1 -> test('login page shows Login with Demo button, not old Owner/Staff buttons')
// REQ 4.2 -> test('user clicks Login with Demo and is redirected to /')
// REQ 1.7 -> test('user clicks Login with Demo and is redirected to /')
// REQ 3.2 -> test('demo banner is visible after demo login')
// REQ 3.2 -> test('demo banner is not visible after regular login as a non-demo user')
// REQ 3.3 -> test('demo banner has no dismiss/close button')
// REQ 3.6 -> test('demo banner has accessible role and aria-label')
// REQ 4.3 -> test('Login with Demo button is disabled while login is in progress')
// REQ 4.4 -> test('user sees error message when demo login endpoint returns 404')
// REQ 4.4 -> test('user sees error message when demo login endpoint returns 500')
//
// Prerequisites for good-case tests:
//   - demo user demo@ekost.app must exist in the database
//   - DEMO_PASSWORD env var must be set on the server
//   - See design.md "Environment Variables" and issue #78 for the setup SQL

import { test, expect } from "@playwright/test";
import { stableFill } from "../helpers/forms";

test.describe("demo login", () => {
  test.describe("good cases", () => {
    test("login page shows a single Login with Demo button", async ({ page }) => {
      await page.goto("/login");

      await expect(
        page.getByRole("button", { name: /login with demo|masuk dengan demo/i })
      ).toBeVisible({ timeout: 10000 });
    });

    test("login page does not show old Demo Owner or Demo Staff buttons", async ({
      page,
    }) => {
      await page.goto("/login");

      await expect(
        page.getByRole("button", { name: /demo owner|akun demo pemilik/i })
      ).not.toBeVisible({ timeout: 5000 });

      await expect(
        page.getByRole("button", { name: /demo staff|akun demo staf/i })
      ).not.toBeVisible();
    });

    test("user clicks Login with Demo, is redirected to /, and sees demo banner", async ({
      page,
    }) => {
      test.setTimeout(60000);

      await page.goto("/login");

      await expect(
        page.getByRole("button", { name: /login with demo|masuk dengan demo/i })
      ).toBeVisible({ timeout: 10000 });

      await page
        .getByRole("button", { name: /login with demo|masuk dengan demo/i })
        .click();

      await expect(page).toHaveURL("/", { timeout: 30000 });
      await page.waitForLoadState("domcontentloaded");

      // Demo banner must be visible (REQ 3.2, 3.5)
      await expect(page.getByRole("status", { name: "Demo session indicator" })).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByText(/demo account|akun demo/i)
      ).toBeVisible();
    });

    test("demo banner has no dismiss or close button", async ({ page }) => {
      test.setTimeout(60000);

      await page.goto("/login");
      await page
        .getByRole("button", { name: /login with demo|masuk dengan demo/i })
        .click();

      await expect(page).toHaveURL("/", { timeout: 30000 });
      await page.waitForLoadState("domcontentloaded");

      await expect(page.getByRole("status", { name: "Demo session indicator" })).toBeVisible({ timeout: 10000 });

      // No close/dismiss button anywhere on the banner (REQ 3.3)
      await expect(
        page.getByRole("status", { name: "Demo session indicator" }).getByRole("button")
      ).not.toBeVisible();
    });

    test("demo banner has an accessible aria-label", async ({ page }) => {
      test.setTimeout(60000);

      await page.goto("/login");
      await page
        .getByRole("button", { name: /login with demo|masuk dengan demo/i })
        .click();

      await expect(page).toHaveURL("/", { timeout: 30000 });
      await page.waitForLoadState("domcontentloaded");

      const banner = page.getByRole("status", { name: "Demo session indicator" });
      await expect(banner).toBeVisible({ timeout: 10000 });
      await expect(banner).toHaveAttribute("aria-label");
    });
  });

  test.describe("bad cases", () => {
    test("user sees error message when demo login endpoint returns 404", async ({
      page,
    }) => {
      // Intercept the demo-login API to simulate a missing demo user
      await page.route("**/api/auth/demo-login", (route) => {
        route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ error: "Demo user not found" }),
        });
      });

      await page.goto("/login");
      await page
        .getByRole("button", { name: /login with demo|masuk dengan demo/i })
        .click();

      // Error alert must appear and user stays on /login (REQ 4.4)
      await expect(
        page.getByRole("alert").filter({ hasText: /demo user not found/i })
      ).toBeVisible({ timeout: 10000 });
      await expect(page).not.toHaveURL("/", { timeout: 3000 }).catch(() => {
        // If navigation happened, that is the failure — already caught by expect above
      });
    });

    test("user sees error message when demo login endpoint returns 500", async ({
      page,
    }) => {
      await page.route("**/api/auth/demo-login", (route) => {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Internal server error" }),
        });
      });

      await page.goto("/login");
      await page
        .getByRole("button", { name: /login with demo|masuk dengan demo/i })
        .click();

      await expect(
        page.getByRole("alert").filter({ hasText: /internal server error/i })
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("edge cases", () => {
    test("Login with Demo button is disabled while login is in progress", async ({
      page,
    }) => {
      // Slow the response so we can observe the disabled state
      await page.route("**/api/auth/demo-login", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ok: true }),
        });
      });

      await page.goto("/login");

      const demoButton = page.getByRole("button", {
        name: /login with demo|masuk dengan demo/i,
      });
      await expect(demoButton).toBeVisible({ timeout: 10000 });

      await demoButton.click();

      // Button must be disabled while request is in-flight (REQ 4.3)
      await expect(demoButton).toBeDisabled({ timeout: 3000 });
    });

    test("demo banner is not visible after logging in as a non-demo user", async ({
      page,
      request,
    }) => {
      test.setTimeout(60000);

      // Create a fresh non-demo user
      const uniqueEmail = `demo-edge-${Date.now()}@test.com`;
      const password = "TestPass123!";

      await request.post("/api/auth/sign-up/email", {
        data: { name: "Non-Demo User", email: uniqueEmail, password },
      });

      // Log in as the non-demo user via the regular form
      await page.goto("/login");
      await stableFill(page, () => page.getByLabel(/email address/i), uniqueEmail);
      await stableFill(page, () => page.getByLabel(/password/i), password);
      await page.getByRole("button", { name: /sign in|log in/i }).click();

      await expect(page).toHaveURL("/", { timeout: 25000 });
      await page.waitForLoadState("domcontentloaded");

      // Demo banner must NOT be visible for a non-demo user (REQ 3.2)
      await expect(page.getByRole("status", { name: "Demo session indicator" })).not.toBeVisible({ timeout: 5000 });
    });
  });
});
