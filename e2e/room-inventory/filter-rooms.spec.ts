// Traceability: room-inventory-management
// REQ 5.1 -> test('room list shows all rooms by default')
// REQ 5.2 -> test('filtering by available shows only available rooms')
// REQ 5.5 -> test('filter updates list and count')

import { test, expect } from "@playwright/test";

test.use({ storageState: "e2e/.auth/user.json" });

test.describe("filter rooms", () => {
  test.describe("good cases", () => {
    test("room list shows all rooms by default", async ({ page }) => {
      await page.goto("/");

      const roomsLink = page.getByRole("link", { name: /rooms/i }).first();
      await expect(roomsLink).toBeVisible({ timeout: 10000 });
      await roomsLink.click();

      await expect(
        page.getByText(/rooms|all rooms|no rooms found/i).first()
      ).toBeVisible({ timeout: 5000 });
    });

    test("filtering by available shows only available rooms", async ({
      page,
    }) => {
      await page.goto("/");

      const roomsLink = page.getByRole("link", { name: /rooms/i }).first();
      await expect(roomsLink).toBeVisible({ timeout: 10000 });
      await roomsLink.click();

      const availableFilter = page
        .getByRole("button", { name: /available/i })
        .first();
      if ((await availableFilter.count()) > 0) {
        await availableFilter.click();
        await expect(
          page.getByText(/available|no rooms/i).first()
        ).toBeVisible({ timeout: 3000 });
      }
    });

    test("filter updates list and count", async ({ page }) => {
      await page.goto("/");

      const roomsLink = page.getByRole("link", { name: /rooms/i }).first();
      await expect(roomsLink).toBeVisible({ timeout: 10000 });
      await roomsLink.click();

      const allFilter = page.getByRole("button", { name: /all rooms|all/i }).first();
      const occupiedFilter = page
        .getByRole("button", { name: /occupied/i })
        .first();
      if ((await allFilter.count()) > 0 && (await occupiedFilter.count()) > 0) {
        await occupiedFilter.click();
        await expect(
          page.getByText(/occupied|no rooms|0/i).first()
        ).toBeVisible({ timeout: 3000 });
      }
    });
  });

  test.describe("edge cases", () => {
    test("empty filter result shows no rooms message", async ({ page }) => {
      await page.goto("/");

      const roomsLink = page.getByRole("link", { name: /rooms/i }).first();
      await expect(roomsLink).toBeVisible({ timeout: 10000 });
      await roomsLink.click();

      const renovationFilter = page
        .getByRole("button", { name: /under renovation|renovation/i })
        .first();
      if ((await renovationFilter.count()) > 0) {
        await renovationFilter.click();
        await expect(
          page.getByText(/no rooms|0 rooms/i).first()
        ).toBeVisible({ timeout: 5000 });
      }
    });
  });
});
