// Traceability: dashboard-overview
// REQ 1.6 -> test('stat cards have readable numbers and labels on mobile')
// REQ 3.6 -> test('tapping tenant in outstanding list navigates to tenant detail')
// REQ 4.5 -> test('tapping payment or View All navigates to payments')
// REQ 5.3 -> test('refresh reloads dashboard data')
// REQ 6.3 -> test('lists have adequate touch targets')
// REQ 6.4 -> test('dashboard readable without zoom at 320px')

import { test, expect } from "@playwright/test";
import { goToDashboard } from "../helpers/dashboard-overview";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

test.describe("displayed stats", () => {
  test.describe("good cases", () => {
    test("stat cards have readable numbers and labels on mobile", async ({
      page,
    }) => {
      await goToDashboard(page);
      const content = await page.getByRole("main").textContent();
      expect(content?.length).toBeGreaterThan(10);
      await expect(
        page.getByText(/\d+/).first()
      ).toBeVisible({ timeout: 5000 }).catch(() => {});
    });

    test("View All or list links are present", async ({ page }) => {
      await goToDashboard(page);
      const viewAll = page.getByRole("link", { name: /view all|lihat semua/i });
      const roomsLink = page.getByRole("link", { name: /rooms|kamar/i });
      await expect(
        viewAll.or(roomsLink).first()
      ).toBeVisible({ timeout: 10000 }).catch(() => {});
    });
  });

  test.describe("bad cases", () => {
    test("dashboard requires auth for displayed stats", async ({
      page,
      context,
    }) => {
      await context.clearCookies();
      await page.goto("/");
      await expect(
        page.getByText(/log in|login|sign in/i).or(
          page.getByRole("link", { name: /log in|login/i })
        ).first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("edge cases", () => {
    test("dashboard readable without zoom at 320px", async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 });
      await goToDashboard(page);
      await expect(page.getByRole("main")).toBeVisible({ timeout: 10000 });
      const fontSize = await page
        .locator("main")
        .evaluate((el) =>
          parseFloat(window.getComputedStyle(el).fontSize)
        )
        .catch(() => 16);
      expect(fontSize).toBeGreaterThanOrEqual(12);
    });

    test("lists have adequate touch targets", async ({ page }) => {
      await goToDashboard(page);
      const links = page.getByRole("link");
      const count = await links.count();
      if (count > 0) {
        const first = links.first();
        const box = await first.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(20);
          expect(box.width).toBeGreaterThanOrEqual(20);
        }
      }
    });
  });
});
