// Traceability: room-furniture-inventory (delete inventory item) — issue #107
// REQ del-inv.1 -> test('tapping delete shows confirmation dialog before removal')
// REQ del-inv.2 -> test('confirming delete removes item from list with success toast')
// REQ del-inv.3 -> test('cancelling delete leaves item intact in list')
// REQ del-inv.4 -> test('deleting one item does not remove other items')

import { test, expect } from "@playwright/test";
import { getPropertyId, goToRoomDetail } from "../../helpers/room-inventory";

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
        roomNumber: "INV-DEL-" + Date.now(),
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

async function seedItem(
  request: RequestFixture,
  baseURL: string | undefined,
  roomId: string,
  item: { name: string; quantity: number; condition: string }
): Promise<string> {
  const propertyId = getPropertyId();
  const res = await request.post(
    `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/rooms/${roomId}/inventory`,
    { data: item }
  );
  if (!res.ok()) {
    throw new Error(`Failed to seed inventory item: ${await res.text()}`);
  }
  const body = await res.json();
  return body.data.id;
}

test.describe("delete inventory item", () => {
  test.describe("good cases", () => {
    test("tapping delete shows confirmation dialog before removal", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const roomId = await createRoom(request, baseURL);

      try {
        await seedItem(request, baseURL, roomId, {
          name: "Lamp",
          quantity: 1,
          condition: "GOOD",
        });

        await goToRoomDetail(page, roomId);
        await page.getByRole("button", { name: /remove item/i }).first().click();

        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible({ timeout: 5000 });
        await expect(
          dialog.getByRole("heading", { name: /remove item/i })
        ).toBeVisible({ timeout: 5000 });
        // Item is NOT deleted yet
        await expect(page.getByText("Lamp")).toBeVisible({ timeout: 3000 });
      } finally {
        await deleteRoom(request, baseURL, roomId);
      }
    });

    test("confirming delete removes item from list with success toast", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const roomId = await createRoom(request, baseURL);

      try {
        await seedItem(request, baseURL, roomId, {
          name: "Table Lamp",
          quantity: 1,
          condition: "FAIR",
        });

        await goToRoomDetail(page, roomId);
        await expect(page.getByText("Table Lamp")).toBeVisible({ timeout: 5000 });

        await page.getByRole("button", { name: /remove item/i }).first().click();
        const dialog = page.getByRole("dialog");
        await dialog.getByRole("button", { name: /^delete$/i }).click();

        await expect(page.getByText(/item removed/i).first()).toBeVisible({
          timeout: 5000,
        });
        await expect(page.getByText("Table Lamp")).not.toBeVisible({
          timeout: 5000,
        });
        await expect(page.getByText(/no items yet/i)).toBeVisible({
          timeout: 5000,
        });
      } finally {
        await deleteRoom(request, baseURL, roomId);
      }
    });
  });

  test.describe("bad cases", () => {
    // Server-level delete failures are not testable without request interception in E2E.
    // Covered by Vitest service/route tests.
  });

  test.describe("edge cases", () => {
    test("cancelling delete leaves item intact in list", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const roomId = await createRoom(request, baseURL);

      try {
        await seedItem(request, baseURL, roomId, {
          name: "Kettle",
          quantity: 1,
          condition: "GOOD",
        });

        await goToRoomDetail(page, roomId);
        await page.getByRole("button", { name: /remove item/i }).first().click();

        const dialog = page.getByRole("dialog");
        await dialog.getByRole("button", { name: /cancel/i }).click();

        await expect(dialog).not.toBeVisible({ timeout: 3000 });
        await expect(page.getByText("Kettle")).toBeVisible({ timeout: 5000 });
      } finally {
        await deleteRoom(request, baseURL, roomId);
      }
    });

    test("deleting one item leaves other items intact", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const roomId = await createRoom(request, baseURL);

      try {
        await seedItem(request, baseURL, roomId, {
          name: "First Item",
          quantity: 1,
          condition: "GOOD",
        });
        await seedItem(request, baseURL, roomId, {
          name: "Second Item",
          quantity: 1,
          condition: "NEW",
        });

        await goToRoomDetail(page, roomId);

        const firstRow = page
          .getByRole("listitem")
          .filter({ hasText: "First Item" });
        await firstRow.getByRole("button", { name: /remove item/i }).click();

        const dialog = page.getByRole("dialog");
        await dialog.getByRole("button", { name: /^delete$/i }).click();

        await expect(page.getByText("First Item")).not.toBeVisible({
          timeout: 5000,
        });
        await expect(page.getByText("Second Item")).toBeVisible({
          timeout: 5000,
        });
      } finally {
        await deleteRoom(request, baseURL, roomId);
      }
    });
  });
});
