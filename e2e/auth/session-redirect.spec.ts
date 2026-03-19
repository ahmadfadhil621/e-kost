// Traceability: user-authentication
// REQ 3.4 -> test('unauthenticated user visiting / is redirected to login')
// REQ 3.4 -> test('unauthenticated user cannot see dashboard content')
// REQ 3.5 -> (covered by E2E login.spec.ts 'user logs in and sees dashboard')
// Traceability: auth-landing
// REQ 2.1 -> test('authenticated user visiting /login is redirected to /')

import { test, expect } from "@playwright/test";
import { stableFill } from "../helpers/forms";

const REDIRECT_TEST_USER_NAME = "Session Redirect Test User";
const REDIRECT_TEST_USER_PASSWORD = "RedirectPass123!";

let redirectTestUserEmail: string;

test.beforeAll(async ({ request }) => {
  redirectTestUserEmail = `session-redirect-${Date.now()}@test.com`;

  await request.post("/api/auth/sign-up/email", {
    data: {
      name: REDIRECT_TEST_USER_NAME,
      email: redirectTestUserEmail,
      password: REDIRECT_TEST_USER_PASSWORD,
    },
  });
});

test.describe("session redirect", () => {
  test.describe("good cases", () => {
    test("unauthenticated user visiting / is redirected to login", async ({
      page,
    }) => {
      await page.goto("/");

      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    });

    test("authenticated user visiting /login is redirected to /", async ({
      page,
    }) => {
      test.setTimeout(60000);

      await page.goto("/login");
      await stableFill(page, () => page.getByLabel(/email address/i), redirectTestUserEmail);
      await stableFill(page, () => page.getByLabel(/password/i), REDIRECT_TEST_USER_PASSWORD);
      await page.getByRole("button", { name: /sign in|log in/i }).click();
      await expect(page).toHaveURL("/", { timeout: 25000 });

      await page.goto("/login");
      await expect(page).toHaveURL("/", { timeout: 10000 });
    });
  });

  test.describe("bad cases", () => {
    test("unauthenticated user cannot see dashboard content", async ({
      page,
    }) => {
      await page.goto("/");
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
      await expect(
        page.getByLabel(/email address/i)
      ).toBeVisible({ timeout: 5000 });

      await expect(page.getByText(/dashboard/i)).not.toBeVisible();
    });
  });

  test.describe("edge cases", () => {
    test("login page is accessible without authentication", async ({
      page,
    }) => {
      await page.goto("/login");
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByLabel(/email address/i)).toBeVisible({
        timeout: 5000,
      });
    });

    test("register page is accessible without authentication", async ({
      page,
    }) => {
      await page.goto("/register");

      await expect(page).toHaveURL(/\/register/);
      await expect(page.getByLabel(/full name/i)).toBeVisible();
    });
  });
});
