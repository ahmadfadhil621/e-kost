// Traceability: settings-currency-management (Issue #90)
// AC-2 -> test('authenticated user sees currency selector in settings')
// AC-2 -> test('user selects IDR and preference persists after page reload')
// AC-3 -> test('changing language does not reset the currency selector value')
// AC-2 -> test('unauthenticated user is redirected away from settings')

import { test, expect } from "@playwright/test";
import { stableFill } from "../helpers/forms";

// DEV_EMAILS not set in test env → all users treated as dev
test.use({ storageState: "e2e/.auth/user-with-property.json" });

test.describe("user selects currency", () => {
  test.describe("good cases", () => {
    test("authenticated user sees currency selector in settings", async ({ page }) => {
      test.info().setTimeout(30000);
      await page.goto("/settings");

      await expect(
        page.getByRole("main").getByRole("heading", { name: /currency|mata uang/i })
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByRole("combobox", { name: /currency|mata uang/i })
      ).toBeVisible({ timeout: 5000 });
    });

    test("user selects IDR and preference persists after page reload", async ({ page }) => {
      test.info().setTimeout(60000);
      await page.goto("/settings");

      // Wait for the currency selector to appear
      const selector = page.getByRole("combobox", { name: /currency|mata uang/i });
      await expect(selector).toBeVisible({ timeout: 10000 });

      // Select IDR
      await selector.selectOption({ value: "IDR" });

      // Allow the PATCH to reach the server
      await page.waitForTimeout(1000);

      // Reload and verify the preference was persisted
      await page.reload();
      await expect(
        page.getByRole("combobox", { name: /currency|mata uang/i })
      ).toHaveValue("IDR", { timeout: 10000 });
    });
  });

  test.describe("bad cases", () => {
    test("unauthenticated user is redirected away from settings", async ({ page, context }) => {
      test.info().setTimeout(20000);
      await context.clearCookies();
      await page.goto("/settings");

      await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
    });
  });

  test.describe("edge cases", () => {
    test("changing language does not reset the currency selector value", async ({ page }) => {
      test.info().setTimeout(60000);
      await page.goto("/settings");

      // First set currency to IDR
      const selector = page.getByRole("combobox", { name: /currency|mata uang/i });
      await expect(selector).toBeVisible({ timeout: 10000 });
      await selector.selectOption({ value: "IDR" });
      await page.waitForTimeout(500);

      // Now switch language to Indonesian
      await page
        .getByRole("main")
        .getByRole("button", { name: /indonesian|bahasa indonesia/i })
        .click();

      // Wait for UI to re-render with new language
      await expect(
        page.getByRole("main").getByRole("heading", { name: /bahasa|language|pengaturan|currency|mata uang/i }).first()
      ).toBeVisible({ timeout: 5000 });

      // Currency selector should still show IDR
      const currencySelector = page.getByRole("combobox", { name: /currency|mata uang/i });
      await expect(currencySelector).toHaveValue("IDR", { timeout: 5000 });

      // Restore language to English — this preference is stored server-side and shared
      // across all tests using the same user. Leaving it as Indonesian would cause
      // downstream specs to see Indonesian UI, breaking locators like /generate link/i.
      await page.getByRole("main").getByRole("button", { name: /english/i }).click();
      await page.waitForTimeout(500); // allow PATCH /api/user/language to reach server
    });
  });
});
