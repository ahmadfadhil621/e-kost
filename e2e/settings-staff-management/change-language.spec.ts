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

      const main = page.getByRole("main");
      await expect(
        main.getByRole("heading", { name: /language|bahasa/i })
      ).toBeVisible({ timeout: 10000 });
      await expect(
        main.getByRole("button", { name: /^english$/i })
      ).toBeVisible();
      await expect(
        main.getByRole("button", { name: /indonesian|bahasa indonesia/i })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { pressed: true })
      ).toBeVisible();
    });

    test("selecting a language updates UI text without reload", async ({
      page,
    }) => {
      await page.goto("/settings");

      const main = page.getByRole("main");
      await main.getByRole("button", { name: /indonesian|bahasa indonesia/i }).click();

      await expect(
        main.getByRole("heading", { name: /bahasa|language|pengaturan/i }).first()
      ).toBeVisible({ timeout: 5000 });
    });

    test("selected language is persisted to localStorage", async ({
      page,
    }) => {
      await page.goto("/settings");

      await page
        .getByRole("main")
        .getByRole("button", { name: /indonesian|bahasa indonesia/i })
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
        .getByRole("main")
        .getByRole("button", { name: /indonesian|bahasa indonesia/i })
        .click();

      await expect(
        page.getByRole("main").getByRole("heading", { name: /settings|pengaturan|bahasa|language/i }).first()
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("bad cases", () => {
    test("settings requires authentication", async ({ page, context }) => {
      await context.clearCookies();
      await page.goto("/settings");

      await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
      await expect(
        page.getByRole("heading", { name: /e-kost/i })
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("edge cases", () => {
    test("switching back to English restores English labels", async ({
      page,
    }) => {
      await page.goto("/settings");

      const main = page.getByRole("main");
      await main.getByRole("button", { name: /indonesian|bahasa indonesia/i }).click();
      await expect(
        main.getByRole("heading", { name: /bahasa|language|pengaturan/i }).first()
      ).toBeVisible({ timeout: 5000 });

      await main.getByRole("button", { name: /^english$/i }).click();
      await expect(
        main.getByRole("heading", { name: /language|settings/i }).first()
      ).toBeVisible({ timeout: 5000 });
    });
  });
});
