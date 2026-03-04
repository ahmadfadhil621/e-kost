// Traceability: user-authentication
// REQ 5.1 -> test('logout button is accessible inside profile dropdown')
// REQ 5.2 -> test('user logs out and is redirected to login')
// REQ 5.4 -> test('after logout, accessing protected page redirects to login')

import { test, expect } from "@playwright/test";

test.use({ storageState: "e2e/.auth/user.json" });

test.describe("logout", () => {
  test.describe("good cases", () => {
    test("user logs out and is redirected to login", async ({ page }) => {
      test.info().setTimeout(60000);
      await page.goto("/");

      await expect(
        page.getByText(/dashboard/i).or(page.getByRole("button", { name: /my properties/i })).or(page.getByRole("link", { name: /create property/i })).first()
      ).toBeVisible({ timeout: 35000 });

      await page
        .getByRole("button", { name: /user profile/i })
        .click();

      await page
        .getByRole("menuitem", { name: /log out/i })
        .click();

      await page.waitForURL(/\/login/, { timeout: 20000 });
      await expect(page.getByLabel(/email address/i)).toBeVisible({
        timeout: 10000,
      });
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe("bad cases", () => {
    test("after logout, accessing protected page redirects to login", async ({
      page,
    }) => {
      test.info().setTimeout(90000);
      await page.goto("/");
      await expect(
        page.getByText(/dashboard/i).or(page.getByRole("button", { name: /my properties/i })).or(page.getByRole("link", { name: /create property/i })).first()
      ).toBeVisible({ timeout: 35000 });

      await page
        .getByRole("button", { name: /user profile/i })
        .click();
      await page
        .getByRole("menuitem", { name: /log out/i })
        .click();
      await page.waitForURL(/\/login/, { timeout: 20000 });
      await expect(page.getByLabel(/email address/i)).toBeVisible({
        timeout: 10000,
      });
      await expect(page).toHaveURL(/\/login/);

      await page.goto("/", { waitUntil: "load" });
      await page.waitForURL(/\/login/, { timeout: 25000 });
      await expect(page.getByLabel(/email address/i)).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe("edge cases", () => {
    test("logout button is accessible inside profile dropdown", async ({
      page,
    }) => {
      test.info().setTimeout(60000);
      await page.goto("/");
      await expect(
        page.getByText(/dashboard/i).or(page.getByRole("button", { name: /my properties/i })).or(page.getByRole("link", { name: /create property/i })).first()
      ).toBeVisible({ timeout: 35000 });

      await page
        .getByRole("button", { name: /user profile/i })
        .click();

      await expect(
        page.getByText(/log out/i)
      ).toBeVisible({ timeout: 15000 });
    });
  });
});
