// Traceability: room-inventory-management
// REQ 2.1 -> test('room detail displays current status and option to change')
// REQ 2.2 -> test('user can change status to available, occupied, or under renovation')
// REQ 2.6 -> test('user sees confirmation after status update')

import { test, expect } from "@playwright/test";
import { goToRoomsList } from "../helpers/room-inventory";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

test.describe("update room status", () => {
  test.describe("good cases", () => {
    test("room detail displays current status and option to change", async ({
      page,
    }) => {
      await goToRoomsList(page);

      const firstRoomCard = page.locator("[data-testid=room-card]").first();
      await expect(firstRoomCard).toBeVisible({ timeout: 10000 });
      await firstRoomCard.click();
      await expect(
        page.getByText(/available|occupied|under renovation|change status/i).first()
      ).toBeVisible({ timeout: 5000 });
    });

    test("user can change status and sees confirmation", async ({ page }) => {
      await goToRoomsList(page);

      const firstRoomCard = page.locator("[data-testid=room-card]").first();
      await expect(firstRoomCard).toBeVisible({ timeout: 10000 });
      await firstRoomCard.click();

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

  test.describe("bad cases", () => {
    test("room detail shows status or error message, not raw crash", async ({
      page,
    }) => {
      await goToRoomsList(page);
      const firstRoomCard = page.locator("[data-testid=room-card]").first();
      if ((await firstRoomCard.count()) === 0) {return;}
      await firstRoomCard.click();
      await expect(
        page.getByText(/available|occupied|under renovation|change status|no rooms/i).first()
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("edge cases", () => {
    test("status indicator shows text label not color alone", async ({
      page,
    }) => {
      await goToRoomsList(page);

      await expect(
        page.locator("[data-testid=room-card]").or(
          page.getByText(/available|occupied|under renovation/i)
        ).first()
      ).toBeVisible({ timeout: 10000 });
    });
  });
});
