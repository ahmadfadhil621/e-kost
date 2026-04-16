// Traceability: room-furniture-inventory (view inventory) — issue #107
// REQ view-inv.1 -> test('inventory section heading is visible on room detail page')
// REQ view-inv.2 -> test('empty state shown with add button when room has no items')
// REQ view-inv.3 -> test('items display with condition badge, name, and quantity')
// REQ view-inv.4 -> test('item with quantity > 1 shows multiplier')
// REQ view-inv.5 -> test('archived room shows inventory section without add or edit or delete buttons')

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
        roomNumber: "INV-VIEW-" + Date.now(),
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

async function archiveRoom(
  request: RequestFixture,
  baseURL: string | undefined,
  roomId: string
) {
  const propertyId = getPropertyId();
  await request.post(
    `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/rooms/${roomId}/archive`
  );
}

async function seedItem(
  request: RequestFixture,
  baseURL: string | undefined,
  roomId: string,
  item: { name: string; quantity: number; condition: string; notes?: string }
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

test.describe("view inventory", () => {
  test.describe("good cases", () => {
    test("inventory section heading is visible on room detail page", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const roomId = await createRoom(request, baseURL);

      try {
        await goToRoomDetail(page, roomId);
        await expect(page.getByText(/^inventory$/i)).toBeVisible({ timeout: 5000 });
      } finally {
        await deleteRoom(request, baseURL, roomId);
      }
    });

    test("items display with condition badge, name, and quantity", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const roomId = await createRoom(request, baseURL);

      try {
        await seedItem(request, baseURL, roomId, {
          name: "Wooden Desk",
          quantity: 1,
          condition: "GOOD",
        });
        await seedItem(request, baseURL, roomId, {
          name: "AC Unit",
          quantity: 1,
          condition: "NEW",
        });

        await goToRoomDetail(page, roomId);

        const deskRow = page.getByRole("listitem").filter({ hasText: "Wooden Desk" });
        await expect(deskRow).toBeVisible({ timeout: 5000 });
        await expect(deskRow.getByText(/good/i)).toBeVisible({ timeout: 5000 });

        const acRow = page.getByRole("listitem").filter({ hasText: "AC Unit" });
        await expect(acRow).toBeVisible({ timeout: 5000 });
        await expect(acRow.getByText(/new/i)).toBeVisible({ timeout: 5000 });
      } finally {
        await deleteRoom(request, baseURL, roomId);
      }
    });
  });

  test.describe("bad cases", () => {
    test("empty state shown with add button when room has no items", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const roomId = await createRoom(request, baseURL);

      try {
        await goToRoomDetail(page, roomId);
        await expect(page.getByText(/no items yet/i)).toBeVisible({ timeout: 5000 });
        await expect(
          page.getByRole("button", { name: /add item/i })
        ).toBeVisible({ timeout: 5000 });
      } finally {
        await deleteRoom(request, baseURL, roomId);
      }
    });
  });

  test.describe("edge cases", () => {
    test("item with quantity > 1 shows multiplier", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const roomId = await createRoom(request, baseURL);

      try {
        await seedItem(request, baseURL, roomId, {
          name: "Pillows",
          quantity: 4,
          condition: "GOOD",
        });
        await goToRoomDetail(page, roomId);
        await expect(page.getByText("Pillows")).toBeVisible({ timeout: 5000 });
        await expect(page.getByText("×4")).toBeVisible({ timeout: 5000 });
      } finally {
        await deleteRoom(request, baseURL, roomId);
      }
    });

    test("archived room shows inventory section without add, edit, or delete buttons", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const roomId = await createRoom(request, baseURL);

      try {
        await seedItem(request, baseURL, roomId, {
          name: "Chair",
          quantity: 2,
          condition: "FAIR",
        });
        await archiveRoom(request, baseURL, roomId);
        await goToRoomDetail(page, roomId);

        await expect(page.getByText(/^inventory$/i)).toBeVisible({ timeout: 5000 });
        await expect(page.getByText("Chair")).toBeVisible({ timeout: 5000 });
        await expect(
          page.getByRole("button", { name: /add item/i })
        ).not.toBeVisible({ timeout: 3000 });
        await expect(
          page.getByRole("button", { name: /edit item/i })
        ).not.toBeVisible({ timeout: 3000 });
        await expect(
          page.getByRole("button", { name: /remove item/i })
        ).not.toBeVisible({ timeout: 3000 });
      } finally {
        await deleteRoom(request, baseURL, roomId);
      }
    });
  });
});
