// Traceability: room-furniture-inventory (add inventory item) — issue #107
// REQ add-inv.1 -> test('user opens add dialog, fills form, submits, item appears in list')
// REQ add-inv.2 -> test('success toast shown after item is added')
// REQ add-inv.3 -> test('item added with optional notes is visible in list')
// REQ add-inv.4 -> test('validation error shown when name is empty')
// REQ add-inv.5 -> test('user cancels add dialog, no item added, empty state remains')

import { test, expect } from "@playwright/test";
import { getPropertyId, goToRoomDetail } from "../../helpers/room-inventory";
import { stableFill } from "../../helpers/forms";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

type RequestFixture = Parameters<Parameters<typeof test>[1]>[0]["request"];

async function createRoom(
  request: RequestFixture,
  baseURL: string | undefined
): Promise<string> {
  const propertyId = getPropertyId();
  const res = await request.post(
    `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/rooms`,
    {
      data: {
        roomNumber: "INV-ADD-" + Date.now(),
        roomType: "single",
        monthlyRent: 1000000,
      },
    }
  );
  if (!res.ok()) {
    throw new Error(`Failed to create room: ${await res.text()}`);
  }
  const room = await res.json();
  return room.id;
}

async function deleteRoom(
  request: RequestFixture,
  baseURL: string | undefined,
  roomId: string
) {
  const propertyId = getPropertyId();
  await request.delete(
    `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/rooms/${roomId}`
  );
}

test.describe("add inventory item", () => {
  test.describe("good cases", () => {
    test("user opens add dialog, fills form, submits, item appears in list", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const roomId = await createRoom(request, baseURL);

      try {
        await goToRoomDetail(page, roomId);
        await page.getByRole("button", { name: /add item/i }).click();

        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible({ timeout: 5000 });

        await stableFill(page, () => dialog.getByLabel(/item name/i), "Wooden Desk");
        await stableFill(page, () => dialog.getByLabel(/quantity/i), "2");

        await dialog.getByRole("combobox", { name: /condition/i }).click();
        await page.getByRole("option", { name: /^good$/i }).click();

        await dialog.getByRole("button", { name: /add item/i }).click();

        const itemRow = page.getByRole("listitem").filter({ hasText: "Wooden Desk" });
        await expect(itemRow).toBeVisible({ timeout: 5000 });
        await expect(page.getByText("×2")).toBeVisible({ timeout: 5000 });
      } finally {
        await deleteRoom(request, baseURL, roomId);
      }
    });

    test("success toast shown after item is added", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const roomId = await createRoom(request, baseURL);

      try {
        await goToRoomDetail(page, roomId);
        await page.getByRole("button", { name: /add item/i }).click();

        const dialog = page.getByRole("dialog");
        await stableFill(page, () => dialog.getByLabel(/item name/i), "Wardrobe");
        await dialog.getByRole("button", { name: /add item/i }).click();

        await expect(page.getByText(/item added/i).first()).toBeVisible({ timeout: 5000 });
      } finally {
        await deleteRoom(request, baseURL, roomId);
      }
    });

    test("item added with optional notes is visible in list", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const roomId = await createRoom(request, baseURL);

      try {
        await goToRoomDetail(page, roomId);
        await page.getByRole("button", { name: /add item/i }).click();

        const dialog = page.getByRole("dialog");
        await stableFill(page, () => dialog.getByLabel(/item name/i), "AC Unit");
        await stableFill(
          page,
          () => dialog.getByLabel(/notes/i),
          "Samsung AR09"
        );
        await dialog.getByRole("button", { name: /add item/i }).click();

        await expect(page.getByText("AC Unit")).toBeVisible({ timeout: 5000 });
        await expect(page.getByText("Samsung AR09")).toBeVisible({ timeout: 5000 });
      } finally {
        await deleteRoom(request, baseURL, roomId);
      }
    });
  });

  test.describe("bad cases", () => {
    test("validation error shown when name is empty", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const roomId = await createRoom(request, baseURL);

      try {
        await goToRoomDetail(page, roomId);
        await page.getByRole("button", { name: /add item/i }).click();

        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // Submit without filling name
        await dialog.getByRole("button", { name: /add item/i }).click();

        await expect(dialog.getByText(/required/i)).toBeVisible({ timeout: 3000 });
        // Dialog stays open
        await expect(dialog).toBeVisible({ timeout: 3000 });
      } finally {
        await deleteRoom(request, baseURL, roomId);
      }
    });
  });

  test.describe("edge cases", () => {
    test("user cancels add dialog, no item added, empty state remains", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const roomId = await createRoom(request, baseURL);

      try {
        await goToRoomDetail(page, roomId);
        await page.getByRole("button", { name: /add item/i }).click();

        const dialog = page.getByRole("dialog");
        await stableFill(
          page,
          () => dialog.getByLabel(/item name/i),
          "Ghost Item"
        );
        await dialog.getByRole("button", { name: /cancel/i }).click();

        await expect(dialog).not.toBeVisible({ timeout: 3000 });
        await expect(page.getByText("Ghost Item")).not.toBeVisible({
          timeout: 3000,
        });
        await expect(page.getByText(/no items yet/i)).toBeVisible({
          timeout: 5000,
        });
      } finally {
        await deleteRoom(request, baseURL, roomId);
      }
    });
  });
});
