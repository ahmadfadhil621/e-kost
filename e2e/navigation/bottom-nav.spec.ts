// Traceability: UI redesign (global layout)
// Plan: Bottom nav shows Overview, Rooms, Tenants, Finance; Settings is not in bottom nav.
//       Tabs navigate correctly to property-scoped routes.

import { test, expect } from "@playwright/test";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

test.describe("bottom nav", () => {
  test.describe("good cases", () => {
    test("Overview, Rooms, Tenants, Finance tabs are visible", async ({
      page,
    }) => {
      await page.goto("/");

      await expect(
        page.getByRole("navigation").getByRole("link", {
          name: /overview|dashboard|dasbor/i,
        })
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByRole("navigation").getByRole("link", {
          name: /rooms|kamar/i,
        })
      ).toBeVisible();
      await expect(
        page.getByRole("navigation").getByRole("link", {
          name: /tenants|penyewa/i,
        })
      ).toBeVisible();
      await expect(
        page.getByRole("navigation").getByRole("link", {
          name: /finance|keuangan/i,
        })
      ).toBeVisible();
    });

    test("Settings is not in bottom nav", async ({ page }) => {
      await page.goto("/");

      const nav = page.getByRole("navigation");
      await expect(nav).toBeVisible({ timeout: 10000 });
      await expect(
        nav.getByRole("link", { name: /settings|pengaturan/i })
      ).not.toBeVisible();
    });

    test("tapping Rooms navigates to rooms page", async ({ page }) => {
      await page.goto("/");

      await page
        .getByRole("navigation")
        .getByRole("link", { name: /rooms|kamar/i })
        .click();

      await expect(page).toHaveURL(/\/properties\/[^/]+\/rooms/, {
        timeout: 15000,
      });
    });

    test("tapping Tenants navigates to tenants page", async ({ page }) => {
      await page.goto("/");

      await page
        .getByRole("navigation")
        .getByRole("link", { name: /tenants|penyewa/i })
        .click();

      await expect(page).toHaveURL(/\/properties\/[^/]+\/tenants/, {
        timeout: 15000,
      });
    });

    test("tapping Finance navigates to finance page", async ({ page }) => {
      await page.goto("/");

      await page
        .getByRole("navigation")
        .getByRole("link", { name: /finance|keuangan/i })
        .click();

      await expect(page).toHaveURL(/\/properties\/[^/]+\/finance/, {
        timeout: 15000,
      });
    });
  });

  test.describe("bad cases", () => {
    test("unauthenticated user is redirected and does not see bottom nav", async ({
      page,
      context,
    }) => {
      await context.clearCookies();
      await page.goto("/");

      await expect(
        page.getByText(/log in|login|sign in/i).or(
          page.getByRole("link", { name: /log in|login/i })
        )
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByRole("navigation").getByRole("link", { name: /overview|dashboard/i })
      ).not.toBeVisible();
    });
  });

  test.describe("edge cases", () => {
    test("nav stays fixed at bottom of viewport after scrolling", async ({ page }) => {
      await page.goto("/");
      await page.evaluate(() =>
        document.querySelector("main")?.setAttribute(
          "style", "height:2000px"
        )
      );
      await page.evaluate(() => window.scrollTo(0, 1000));
      const nav = page.getByRole("navigation");
      await expect(nav).toBeVisible();
      const box = await nav.boundingBox();
      const viewport = page.viewportSize()!;
      expect(box!.y + box!.height).toBeCloseTo(viewport.height, -1);
    });

    test("bottom nav remains visible after navigating to a tab", async ({
      page,
    }) => {
      await page.goto("/");
      await expect(
        page.getByRole("navigation").getByRole("link", { name: /rooms|kamar/i })
      ).toBeVisible({ timeout: 10000 });
      await page
        .getByRole("navigation")
        .getByRole("link", { name: /rooms|kamar/i })
        .click();
      await expect(page).toHaveURL(/\/properties\/[^/]+\/rooms/, { timeout: 15000 });
      await expect(
        page.getByRole("navigation").getByRole("link", { name: /rooms|kamar/i })
      ).toBeVisible();
    });
  });
});
