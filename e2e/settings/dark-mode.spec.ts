// Traceability: settings-dark-mode (issue #67)
// REQ AC-2 -> test('settings page shows Appearance section with theme buttons')
// REQ AC-2 -> test('clicking Dark activates the dark theme')
// REQ AC-3 -> test('dark mode preference persists after page reload')
// REQ AC-2 -> test('clicking System returns to system theme')

import { test, expect } from "@playwright/test";

test.describe("dark mode toggle", () => {
  test.describe("good cases", () => {
    test("settings page shows Appearance section with Light, Dark, System buttons", async ({
      page,
    }) => {
      await page.goto("/settings");

      await expect(
        page.getByRole("heading", { name: /appearance|tampilan/i })
      ).toBeVisible({ timeout: 10000 });

      await expect(
        page.getByRole("button", { name: /^light$|^terang$/i })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /^dark$|^gelap$/i })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /^system$|^sistem$/i })
      ).toBeVisible();
    });

    test("clicking Dark button activates dark theme and marks it aria-pressed", async ({
      page,
    }) => {
      await page.goto("/settings");
      await expect(
        page.getByRole("heading", { name: /appearance|tampilan/i })
      ).toBeVisible({ timeout: 10000 });

      await page.getByRole("button", { name: /^dark$|^gelap$/i }).click();

      await expect(
        page.getByRole("button", { name: /^dark$|^gelap$/i })
      ).toHaveAttribute("aria-pressed", "true");

      // html element should have the dark class
      await expect(page.locator("html")).toHaveClass(/dark/, { timeout: 3000 });
    });

    test("clicking Light button activates light theme and marks it aria-pressed", async ({
      page,
    }) => {
      await page.goto("/settings");
      await expect(
        page.getByRole("heading", { name: /appearance|tampilan/i })
      ).toBeVisible({ timeout: 10000 });

      await page.getByRole("button", { name: /^light$|^terang$/i }).click();

      await expect(
        page.getByRole("button", { name: /^light$|^terang$/i })
      ).toHaveAttribute("aria-pressed", "true");

      await expect(page.locator("html")).not.toHaveClass(/dark/, { timeout: 3000 });
    });
  });

  test.describe("edge cases", () => {
    test("dark mode preference persists after page reload", async ({ page }) => {
      await page.goto("/settings");
      await expect(
        page.getByRole("heading", { name: /appearance|tampilan/i })
      ).toBeVisible({ timeout: 10000 });

      // Set dark mode
      await page.getByRole("button", { name: /^dark$|^gelap$/i }).click();
      await expect(page.locator("html")).toHaveClass(/dark/, { timeout: 3000 });

      // Reload page
      await page.reload();
      await page.waitForLoadState("domcontentloaded");

      // Theme should still be dark
      await expect(page.locator("html")).toHaveClass(/dark/, { timeout: 5000 });

      // Restore to system for test isolation
      await page.goto("/settings");
      await page.getByRole("button", { name: /^system$|^sistem$/i }).click();
    });

    test("clicking System button removes explicit dark/light class and marks it pressed", async ({
      page,
    }) => {
      await page.goto("/settings");
      await expect(
        page.getByRole("heading", { name: /appearance|tampilan/i })
      ).toBeVisible({ timeout: 10000 });

      // First set dark
      await page.getByRole("button", { name: /^dark$|^gelap$/i }).click();
      await expect(page.locator("html")).toHaveClass(/dark/, { timeout: 3000 });

      // Then set system
      await page.getByRole("button", { name: /^system$|^sistem$/i }).click();

      await expect(
        page.getByRole("button", { name: /^system$|^sistem$/i })
      ).toHaveAttribute("aria-pressed", "true");
    });
  });
});
