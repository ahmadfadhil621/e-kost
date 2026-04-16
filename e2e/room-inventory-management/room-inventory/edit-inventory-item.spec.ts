// Traceability: room-furniture-inventory (edit inventory item) — issue #107
// REQ edit-inv.1 -> test('edit dialog opens pre-populated with current item values')
// REQ edit-inv.2 -> test('user saves changes, item updated in list with success toast')
// REQ edit-inv.3 -> test('validation error shown when name is cleared on edit')
// REQ edit-inv.4 -> test('user cancels edit dialog, no change applied')

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
        roomNumber: "INV-EDIT-" + Date.now(),
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

test.describe("edit inventory item", () => {
  test.describe("good cases", () => {
    test("edit dialog opens pre-populated with current item values", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const roomId = await createRoom(request, baseURL);

      try {
        await seedItem(request, baseURL, roomId, {
          name: "Wooden Chair",
          quantity: 2,
          condition: "GOOD",
          notes: "Minor scratch",
        });

        await goToRoomDetail(page, roomId);
        await page.getByRole("button", { name: /edit item/i }).first().click();

        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible({ timeout: 5000 });
        await expect(dialog.getByLabel(/item name/i)).toHaveValue(
          "Wooden Chair",
          { timeout: 5000 }
        );
        await expect(dialog.getByLabel(/quantity/i)).toHaveValue("2", {
          timeout: 5000,
        });
        await expect(dialog.getByLabel(/notes/i)).toHaveValue("Minor scratch", {
          timeout: 5000,
        });
      } finally {
        await deleteRoom(request, baseURL, roomId);
      }
    });

    test("user saves changes, item updated in list with success toast", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const roomId = await createRoom(request, baseURL);

      try {
        await seedItem(request, baseURL, roomId, {
          name: "Sofa",
          quantity: 1,
          condition: "GOOD",
        });

        await goToRoomDetail(page, roomId);
        await page.getByRole("button", { name: /edit item/i }).first().click();

        const dialog = page.getByRole("dialog");
        await stableFill(page, () => dialog.getByLabel(/item name/i), "Loveseat");

        await dialog.getByRole("combobox", { name: /condition/i }).click();
        await page.getByRole("option", { name: /^fair$/i }).click();

        await dialog.getByRole("button", { name: /edit item/i }).click();

        await expect(page.getByText("Loveseat")).toBeVisible({ timeout: 5000 });
        await expect(page.getByText(/item updated/i).first()).toBeVisible({
          timeout: 5000,
        });
        const updatedRow = page.getByRole("listitem").filter({ hasText: "Loveseat" });
        await expect(updatedRow.getByText(/fair/i)).toBeVisible({ timeout: 5000 });
      } finally {
        await deleteRoom(request, baseURL, roomId);
      }
    });
  });

  test.describe("bad cases", () => {
    test("validation error shown when name is cleared on edit", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const roomId = await createRoom(request, baseURL);

      try {
        await seedItem(request, baseURL, roomId, {
          name: "Bookshelf",
          quantity: 1,
          condition: "GOOD",
        });

        await goToRoomDetail(page, roomId);
        await page.getByRole("button", { name: /edit item/i }).first().click();

        const dialog = page.getByRole("dialog");
        await dialog.getByLabel(/item name/i).clear();
        await dialog.getByRole("button", { name: /edit item/i }).click();

        await expect(dialog.getByText(/required/i)).toBeVisible({
          timeout: 3000,
        });
        // Dialog stays open
        await expect(dialog).toBeVisible({ timeout: 3000 });
      } finally {
        await deleteRoom(request, baseURL, roomId);
      }
    });
  });

  test.describe("edge cases", () => {
    test("user cancels edit dialog, no change applied", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const roomId = await createRoom(request, baseURL);

      try {
        await seedItem(request, baseURL, roomId, {
          name: "Mirror",
          quantity: 1,
          condition: "GOOD",
        });

        await goToRoomDetail(page, roomId);
        await page.getByRole("button", { name: /edit item/i }).first().click();

        const dialog = page.getByRole("dialog");
        await stableFill(
          page,
          () => dialog.getByLabel(/item name/i),
          "Changed Name"
        );
        await dialog.getByRole("button", { name: /cancel/i }).click();

        await expect(dialog).not.toBeVisible({ timeout: 3000 });
        await expect(page.getByText("Mirror")).toBeVisible({ timeout: 5000 });
        await expect(page.getByText("Changed Name")).not.toBeVisible({
          timeout: 3000,
        });
      } finally {
        await deleteRoom(request, baseURL, roomId);
      }
    });
  });
});
