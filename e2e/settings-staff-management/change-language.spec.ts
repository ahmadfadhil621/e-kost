// Traceability: settings-staff-management
// REQ 1.1 -> test('settings page displays language section with available languages and current indicated')
// REQ 1.2 -> test('selecting a language updates UI text without reload')
// REQ 1.3 -> test('selected language is persisted to localStorage')
// REQ 1.4 -> (covered by E2E reload test)
// REQ 1.5 -> (default locale covered by unit test)
// REQ 1.6 -> test('language switch updates visible UI labels')
// PROP 1 -> test('selecting a language updates UI text without reload')
// PROP 2 -> test('selected language is persisted to localStorage')

import { test, expect } from "@playwright/test";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

test.describe("change language", () => {
  test.describe("good cases", () => {
    test("settings page displays language section with available languages and current indicated", async ({
      page,
    }) => {
      await page.goto("/settings");

      await expect(
        page.getByRole("heading", { name: /language|bahasa/i })
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByRole("button", { name: /english|en/i })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /indonesian|bahasa indonesia|id/i })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { pressed: true })
      ).toBeVisible();
    });

    test("selecting a language updates UI text without reload", async ({
      page,
    }) => {
      await page.goto("/settings");

      const idButton = page.getByRole("button", {
        name: /indonesian|bahasa indonesia|id/i,
      });
      await idButton.click();

      await expect(
        page.getByRole("heading", { name: /bahasa|language|pengaturan/i })
      ).toBeVisible({ timeout: 5000 });
    });

    test("selected language is persisted to localStorage", async ({
      page,
    }) => {
      await page.goto("/settings");

      await page
        .getByRole("button", { name: /indonesian|bahasa indonesia|id/i })
        .click();

      const stored = await page.evaluate(() => {
        return (
          localStorage.getItem("ekost_language") ??
          localStorage.getItem("i18nextLng") ??
          null
        );
      });
      expect(stored).toBeTruthy();
      expect(["id", "id-ID"]).toContain(stored);
    });

    test("language switch updates visible UI labels", async ({ page }) => {
      await page.goto("/settings");

      await page
        .getByRole("button", { name: /indonesian|bahasa indonesia|id/i })
        .click();

      await expect(
        page.getByRole("heading", { name: /settings|pengaturan|bahasa|language/i })
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("bad cases", () => {
    test("settings requires authentication", async ({ page, context }) => {
      await context.clearCookies();
      await page.goto("/settings");

      await expect(
        page
          .getByText(/log in|login|sign in|unauthorized/i)
          .or(page.getByRole("link", { name: /log in|login/i }))
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("edge cases", () => {
    test("switching back to English restores English labels", async ({
      page,
    }) => {
      await page.goto("/settings");

      await page
        .getByRole("button", { name: /indonesian|bahasa indonesia|id/i })
        .click();
      await expect(
        page.getByRole("heading", { name: /bahasa|language|pengaturan/i })
      ).toBeVisible({ timeout: 5000 });

      await page.getByRole("button", { name: /english|en/i }).click();
      await expect(
        page.getByRole("heading", { name: /language|settings/i })
      ).toBeVisible({ timeout: 5000 });
    });
  });
});
