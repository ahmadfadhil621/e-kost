// Traceability: user-authentication
// REQ 3.4 -> test('unauthenticated user visiting / is redirected to login')
// REQ 3.4 -> test('unauthenticated user cannot see dashboard content')
// REQ 3.5 -> (covered by E2E login.spec.ts 'user logs in and sees dashboard')

import { test, expect } from "@playwright/test";

test.describe("session redirect", () => {
  test.describe("good cases", () => {
    test("unauthenticated user visiting / is redirected to login", async ({
      page,
    }) => {
      await page.goto("/");

      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    });
  });

  test.describe("bad cases", () => {
    test("unauthenticated user cannot see dashboard content", async ({
      page,
    }) => {
      await page.goto("/");
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

      await expect(page.getByText(/dashboard/i)).not.toBeVisible();
    });
  });

  test.describe("edge cases", () => {
    test("login page is accessible without authentication", async ({
      page,
    }) => {
      await page.goto("/login");

      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByLabel(/email address/i)).toBeVisible();
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
