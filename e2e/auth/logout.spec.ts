// Traceability: user-authentication
// REQ 5.1 -> test('logout button is accessible inside profile dropdown')
// REQ 5.2 -> test('user logs out and is redirected to login')
// REQ 5.4 -> test('after logout, accessing protected page redirects to login')

import { test, expect } from "@playwright/test";

test.use({ storageState: "e2e/.auth/user.json" });

test.describe("logout", () => {
  test.describe("good cases", () => {
    test("user logs out and is redirected to login", async ({ page }) => {
      await page.goto("/");

      await expect(page.getByText(/dashboard/i)).toBeVisible({
        timeout: 10000,
      });

      await page
        .getByRole("button", { name: /user profile/i })
        .click();

      await page
        .getByRole("menuitem", { name: /log out/i })
        .click();

      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    });
  });

  test.describe("bad cases", () => {
    test("after logout, accessing protected page redirects to login", async ({
      page,
    }) => {
      await page.goto("/");
      await expect(page.getByText(/dashboard/i)).toBeVisible({
        timeout: 10000,
      });

      await page
        .getByRole("button", { name: /user profile/i })
        .click();
      await page
        .getByRole("menuitem", { name: /log out/i })
        .click();
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

      await page.goto("/");
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    });
  });

  test.describe("edge cases", () => {
    test("logout button is accessible inside profile dropdown", async ({
      page,
    }) => {
      await page.goto("/");
      await expect(page.getByText(/dashboard/i)).toBeVisible({
        timeout: 10000,
      });

      await page
        .getByRole("button", { name: /user profile/i })
        .click();

      await expect(
        page.getByRole("menuitem", { name: /log out/i })
      ).toBeVisible();
    });
  });
});
