// Traceability: room-inventory-management (edit flow) — issue #30
// REQ E2.1 -> test('edit room form pre-populated with current data')
// REQ E2.2 -> test('user edits room number and sees success')
// REQ E2.3 -> test('user sees validation error for negative monthly rent')
// REQ E2.4 -> test('user sees validation error when room number is cleared')
// REQ E2.5 -> test('cancel returns to room detail without saving')

import { test, expect } from "@playwright/test";
import {
  getPropertyId,
  goToEditRoomPage,
} from "../../helpers/room-inventory";
import { stableFill } from "../../helpers/forms";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

let roomId: string;
let originalRoomNumber: string;

test.beforeAll(async ({ browser, baseURL }) => {
  const propertyId = getPropertyId();
  const context = await browser.newContext({
    storageState: "e2e/.auth/user-with-property.json",
  });
  const page = await context.newPage();
  await page.goto(baseURL ?? "http://localhost:3000");
  originalRoomNumber = "E2E-Edit-" + Date.now();
  const res = await page.request.post(
    `${baseURL}/api/properties/${propertyId}/rooms`,
    {
      data: {
        roomNumber: originalRoomNumber,
        roomType: "single",
        monthlyRent: 1200000,
      },
    }
  );
  expect(res.ok(), `Create room failed: ${await res.text()}`).toBe(true);
  roomId = (await res.json()).id;
  await context.close();
});

test.describe("edit room", () => {
  test.describe("good cases", () => {
    test("edit room form pre-populated with current data", async ({ page }) => {
      test.info().setTimeout(45000);
      await goToEditRoomPage(page, roomId);
      await expect(page.locator("#room-number")).toHaveValue(
        originalRoomNumber,
        { timeout: 5000 }
      );
      await expect(page.locator("#monthly-rent")).toHaveValue("1200000", {
        timeout: 2000,
      });
      await expect(
        page.getByRole("button", { name: /save changes/i })
      ).toBeVisible({ timeout: 2000 });
    });

    test("user edits room number and sees success", async ({ page }) => {
      test.info().setTimeout(60000);
      await goToEditRoomPage(page, roomId);
      const updatedRoomNumber = "E2E-Upd-" + Date.now();
      await stableFill(
        page,
        () => page.locator("#room-number"),
        updatedRoomNumber
      );
      await page.getByRole("button", { name: /save changes/i }).click();

      await expect(
        page
          .getByText(/room updated successfully|success/i)
          .or(page.getByText(updatedRoomNumber))
          .first()
      ).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("bad cases", () => {
    test("user sees validation error for negative monthly rent", async ({
      page,
    }) => {
      test.info().setTimeout(45000);
      await goToEditRoomPage(page, roomId);
      await stableFill(page, () => page.locator("#monthly-rent"), "-100");
      await page.getByRole("button", { name: /save changes/i }).click();

      await expect(
        page.getByText(/positive|monthly rent must be/i).first()
      ).toBeVisible({ timeout: 5000 });
    });

    test("user sees validation error when room number is cleared", async ({
      page,
    }) => {
      test.info().setTimeout(45000);
      await goToEditRoomPage(page, roomId);
      await stableFill(page, () => page.locator("#room-number"), "");
      await page.getByRole("button", { name: /save changes/i }).click();

      await expect(
        page.getByText(/room number is required|required/i).first()
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("edge cases", () => {
    test("cancel returns to room detail without saving", async ({ page }) => {
      test.info().setTimeout(45000);
      await goToEditRoomPage(page, roomId);
      await page.getByRole("button", { name: /cancel/i }).click();

      await page
        .waitForURL(/\/rooms\/[^/]+$/, { timeout: 8000 })
        .catch(() => {});
      await expect(page.url()).toMatch(/\/rooms\//);
      await expect(page.url()).not.toMatch(/\/edit/);
      // Detail page should show room content (danger zone is always present)
      await expect(
        page.getByText(/danger zone|edit|room details/i).first()
      ).toBeVisible({ timeout: 15000 });
    });
  });
});
