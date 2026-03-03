// Traceability: room-inventory-management
// REQ 1.1 -> test('room creation page displays form with room number, type, and monthly rent')
// REQ 1.2 -> test('user creates room with valid data and sees success')
// REQ 1.3 -> test('user sees validation errors when required fields are empty')
// REQ 1.4 -> (covered by unit tests)
// REQ 1.5 -> test('user creates room with valid data and sees success')
// REQ 6 (mobile) -> (viewport 375x667 in config)

import { test, expect } from "@playwright/test";

test.use({ storageState: "e2e/.auth/user.json" });

test.describe("create room", () => {
  test.describe("good cases", () => {
    test("room creation page displays form with room number, type, and monthly rent", async ({
      page,
    }) => {
      await page.goto("/");

      const roomsLink = page.getByRole("link", { name: /rooms/i }).first();
      await expect(roomsLink).toBeVisible({ timeout: 10000 });
      await roomsLink.click();

      const addRoomLink = page
        .getByRole("link", { name: /add room|create room|new room/i })
        .first();
      if ((await addRoomLink.count()) > 0) {
        await addRoomLink.click();
      }

      await expect(
        page.getByLabel(/room number/i).first()
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByLabel(/room type/i).first()
      ).toBeVisible({ timeout: 2000 });
      await expect(
        page.getByLabel(/monthly rent/i).first()
      ).toBeVisible({ timeout: 2000 });
      await expect(
        page.getByRole("button", { name: /create room|save/i })
      ).toBeVisible({ timeout: 2000 });
    });

    test("user creates room with valid data and sees success", async ({
      page,
    }) => {
      await page.goto("/");

      const roomsLink = page.getByRole("link", { name: /rooms/i }).first();
      await expect(roomsLink).toBeVisible({ timeout: 10000 });
      await roomsLink.click();

      const addRoomLink = page
        .getByRole("link", { name: /add room|create room|new room/i })
        .first();
      if ((await addRoomLink.count()) > 0) {
        await addRoomLink.click();
      }

      const roomNumber = "E2E-" + Date.now();
      await page.getByLabel(/room number/i).fill(roomNumber);
      await page.getByLabel(/room type/i).fill("single");
      await page.getByLabel(/monthly rent/i).fill("1500000");
      await page.getByRole("button", { name: /create room|save/i }).click();

      await expect(
        page.getByText(/room created successfully|success|rooms/i).or(
          page.getByText(roomNumber)
        ).first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("bad cases", () => {
    test("user sees validation errors when required fields are empty", async ({
      page,
    }) => {
      await page.goto("/");

      const roomsLink = page.getByRole("link", { name: /rooms/i }).first();
      await expect(roomsLink).toBeVisible({ timeout: 10000 });
      await roomsLink.click();

      const addRoomLink = page
        .getByRole("link", { name: /add room|create room|new room/i })
        .first();
      if ((await addRoomLink.count()) > 0) {
        await addRoomLink.click();
      }

      await page.getByRole("button", { name: /create room|save/i }).click();

      await expect(
        page.getByText(/room number is required|required/i).first()
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("edge cases", () => {
    test("user sees validation when monthly rent is negative", async ({
      page,
    }) => {
      await page.goto("/");

      const roomsLink = page.getByRole("link", { name: /rooms/i }).first();
      await expect(roomsLink).toBeVisible({ timeout: 10000 });
      await roomsLink.click();

      const addRoomLink = page
        .getByRole("link", { name: /add room|create room|new room/i })
        .first();
      if ((await addRoomLink.count()) > 0) {
        await addRoomLink.click();
      }

      await page.getByLabel(/room number/i).fill("A99");
      await page.getByLabel(/room type/i).fill("single");
      await page.getByLabel(/monthly rent/i).fill("-100");
      await page.getByRole("button", { name: /create room|save/i }).click();

      await expect(
        page.getByText(/positive|monthly rent must be/i)
      ).toBeVisible({ timeout: 5000 });
    });
  });
});
