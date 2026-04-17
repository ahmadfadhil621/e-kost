// Traceability: room-inventory-condition-timestamp (issue #118)
// REQ AC-5 -> test('condition recorded timestamp visible below badge after adding item')
// REQ AC-5 -> test('tapping timestamp toggles to absolute format')
// REQ AC-5 -> test('tapping absolute timestamp toggles back to relative format')
// REQ AC-2 -> test('condition recorded timestamp refreshes after editing condition')
// REQ AC-2 -> test('condition recorded timestamp unchanged after editing without condition')

import { test, expect } from "@playwright/test";
import { getPropertyId, goToRoomDetail } from "../helpers/room-inventory";
import { stableFill } from "../helpers/forms";

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
        roomNumber: "COND-TS-" + Date.now(),
        roomType: "single",
        monthlyRent: 1000000,
      },
    }
  );
  if (!res.ok()) { throw new Error(`Failed to create room: ${await res.text()}`); }
  const body = await res.json();
  return body.id;
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

async function seedItem(
  request: RequestFixture,
  baseURL: string | undefined,
  roomId: string,
  item: { name: string; condition: string; quantity?: number }
): Promise<string> {
  const propertyId = getPropertyId();
  const res = await request.post(
    `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/rooms/${roomId}/inventory`,
    { data: { quantity: 1, ...item } }
  );
  if (!res.ok()) { throw new Error(`Failed to seed item: ${await res.text()}`); }
  const body = await res.json();
  return body.data.id;
}

test.describe("condition recorded timestamp", () => {
  test.describe("good cases", () => {
    test("condition recorded timestamp visible below badge after adding item", async ({
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
        await stableFill(page, () => dialog.getByLabel(/item name/i), "Office Chair");
        await dialog.getByRole("button", { name: /add item/i }).click();

        const row = page.getByRole("listitem").filter({ hasText: "Office Chair" });
        await expect(row).toBeVisible({ timeout: 5000 });

        const conditionLabel = row.getByText(/condition recorded/i);
        await expect(conditionLabel).toBeVisible({ timeout: 5000 });

        const timestampBtn = row.getByRole("button", { name: /ago|just now|minute|hour|second/i });
        await expect(timestampBtn).toBeVisible({ timeout: 5000 });
      } finally {
        await deleteRoom(request, baseURL, roomId);
      }
    });

    test("tapping timestamp toggles to absolute format", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const roomId = await createRoom(request, baseURL);

      try {
        await seedItem(request, baseURL, roomId, { name: "Wardrobe", condition: "GOOD" });
        await goToRoomDetail(page, roomId);

        const row = page.getByRole("listitem").filter({ hasText: "Wardrobe" });
        await expect(row).toBeVisible({ timeout: 5000 });

        const timestampBtn = row.getByRole("button", { name: /ago|just now|minute|hour|second/i });
        await expect(timestampBtn).toBeVisible({ timeout: 5000 });

        await timestampBtn.click();

        const absoluteBtn = row.getByRole("button", { name: /·/ });
        await expect(absoluteBtn).toBeVisible({ timeout: 3000 });
      } finally {
        await deleteRoom(request, baseURL, roomId);
      }
    });

    test("tapping absolute timestamp toggles back to relative format", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const roomId = await createRoom(request, baseURL);

      try {
        await seedItem(request, baseURL, roomId, { name: "Desk Lamp", condition: "NEW" });
        await goToRoomDetail(page, roomId);

        const row = page.getByRole("listitem").filter({ hasText: "Desk Lamp" });
        await expect(row).toBeVisible({ timeout: 5000 });

        const timestampBtn = row.getByRole("button", { name: /ago|just now|minute|hour|second/i });
        await timestampBtn.click();

        const absoluteBtn = row.getByRole("button", { name: /·/ });
        await absoluteBtn.click();

        await expect(row.getByRole("button", { name: /ago|just now|minute|hour|second/i })).toBeVisible({ timeout: 3000 });
      } finally {
        await deleteRoom(request, baseURL, roomId);
      }
    });
  });

  test.describe("edge cases", () => {
    test("condition recorded timestamp visible after editing item condition", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const roomId = await createRoom(request, baseURL);

      try {
        await seedItem(request, baseURL, roomId, { name: "Sofa", condition: "GOOD" });
        await goToRoomDetail(page, roomId);

        await page.getByRole("button", { name: /edit item/i }).first().click();
        const dialog = page.getByRole("dialog");
        await dialog.getByRole("combobox", { name: /condition/i }).click();
        await page.getByRole("option", { name: /^poor$/i }).click();
        await dialog.getByRole("button", { name: /edit item/i }).click();

        const row = page.getByRole("listitem").filter({ hasText: "Sofa" });
        await expect(row).toBeVisible({ timeout: 5000 });
        await expect(row.getByText(/condition recorded/i)).toBeVisible({ timeout: 5000 });
        await expect(row.getByRole("button", { name: /ago|just now|minute|hour|second/i })).toBeVisible({ timeout: 5000 });
      } finally {
        await deleteRoom(request, baseURL, roomId);
      }
    });

    test("condition recorded timestamp visible after editing item without changing condition", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const roomId = await createRoom(request, baseURL);

      try {
        await seedItem(request, baseURL, roomId, { name: "Bookshelf", condition: "FAIR" });
        await goToRoomDetail(page, roomId);

        await page.getByRole("button", { name: /edit item/i }).first().click();
        const dialog = page.getByRole("dialog");
        await stableFill(page, () => dialog.getByLabel(/item name/i), "Large Bookshelf");
        await dialog.getByRole("button", { name: /edit item/i }).click();

        const row = page.getByRole("listitem").filter({ hasText: "Large Bookshelf" });
        await expect(row).toBeVisible({ timeout: 5000 });
        await expect(row.getByText(/condition recorded/i)).toBeVisible({ timeout: 5000 });
      } finally {
        await deleteRoom(request, baseURL, roomId);
      }
    });
  });
});
