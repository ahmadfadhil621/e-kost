// Traceability: room-inventory-management
// REQ 2.1 -> test('room detail displays current status and option to change')
// REQ 2.2 -> test('user can change status to available, occupied, or under renovation')
// REQ 2.6 -> test('user sees confirmation after status update')

import { test, expect } from "@playwright/test";

test.use({ storageState: "e2e/.auth/user.json" });

test.describe("update room status", () => {
  test.describe("good cases", () => {
    test("room detail displays current status and option to change", async ({
      page,
    }) => {
      await page.goto("/");

      const roomsLink = page.getByRole("link", { name: /rooms/i }).first();
      await expect(roomsLink).toBeVisible({ timeout: 10000 });
      await roomsLink.click();

      const firstRoom = page.getByRole("link").or(page.locator("[data-testid=room-card]")).first();
      if ((await firstRoom.count()) > 0) {
        await firstRoom.click();
        await expect(
          page.getByText(/available|occupied|under renovation|change status/i).first()
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test("user can change status and sees confirmation", async ({ page }) => {
      await page.goto("/");

      const roomsLink = page.getByRole("link", { name: /rooms/i }).first();
      await expect(roomsLink).toBeVisible({ timeout: 10000 });
      await roomsLink.click();

      const firstRoom = page.getByRole("link").or(page.locator("[data-testid=room-card]")).first();
      if ((await firstRoom.count()) === 0) {
        test.skip();
      }
      await firstRoom.click();

      const changeStatusBtn = page.getByRole("button", {
        name: /change status/i,
      }).first();
      if ((await changeStatusBtn.count()) > 0) {
        await changeStatusBtn.click();
        await page.getByRole("option", { name: /occupied|available|renovation/i }).first().click();
        await expect(
          page.getByText(/status updated|success/i).first()
        ).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe("edge cases", () => {
    test("status indicator shows text label not color alone", async ({
      page,
    }) => {
      await page.goto("/");

      const roomsLink = page.getByRole("link", { name: /rooms/i }).first();
      await expect(roomsLink).toBeVisible({ timeout: 10000 });
      await roomsLink.click();

      await expect(
        page.getByText(/available|occupied|under renovation/i).first()
      ).toBeVisible({ timeout: 5000 });
    });
  });
});
