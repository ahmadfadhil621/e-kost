// Traceability: settings-staff-management
// REQ 5.1 -> test('settings link is available in navigation')
// REQ 5.2 -> test('tapping settings link navigates to settings page')
// REQ 5.3 -> test('settings page indicates active navigation state')

import { test, expect } from "@playwright/test";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

test.describe("settings navigation", () => {
  test.describe("good cases", () => {
    test("settings link is available in navigation", async ({ page }) => {
      await page.goto("/");

      await expect(
        page.getByRole("link", { name: /settings|pengaturan/i })
      ).toBeVisible({ timeout: 10000 });
    });

    test("tapping settings link navigates to settings page", async ({
      page,
    }) => {
      await page.goto("/");

      await page.getByRole("link", { name: /settings|pengaturan/i }).click();

      await expect(page).toHaveURL(/\/settings/);
      await expect(
        page.getByRole("heading", { name: /language|account|settings|bahasa|akun|pengaturan/i })
      ).toBeVisible({ timeout: 10000 });
    });

    test("settings page indicates active navigation state", async ({
      page,
    }) => {
      await page.goto("/settings");

      const settingsLink = page.getByRole("link", {
        name: /settings|pengaturan/i,
      });
      await expect(settingsLink).toBeVisible();
      await expect(settingsLink).toHaveAttribute("href", "/settings");
      const linkClasses = await settingsLink.getAttribute("class");
      expect(
        linkClasses?.includes("font-semibold") ||
          linkClasses?.includes("bg-") ||
          linkClasses?.includes("active") ||
          linkClasses?.includes("text-primary")
      ).toBe(true);
    });

    test("settings link has adequate touch target", async ({ page }) => {
      await page.goto("/");

      const link = page.getByRole("link", { name: /settings|pengaturan/i });
      await expect(link).toBeVisible();
      const box = await link.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
    });
  });

  test.describe("bad cases", () => {
    test("unauthenticated user is redirected when accessing settings", async ({
      page,
      context,
    }) => {
      await context.clearCookies();
      await page.goto("/settings");

      await expect(
        page.getByText(/log in|login|sign in/i).or(
          page.getByRole("link", { name: /log in|login/i })
        )
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("edge cases", () => {
    test("navigating to /settings directly shows settings content", async ({
      page,
    }) => {
      await page.goto("/settings");

      await expect(page).toHaveURL(/\/settings/);
      await expect(
        page.getByRole("heading", { name: /language|account|bahasa|akun/i })
      ).toBeVisible({ timeout: 10000 });
    });
  });
});
