// Traceability: room-available-card-cleanup (issue #103)
// AC-1 -> test('available room card shows no assign tenant action')
// AC-2 -> test('available room card shows no change status action')
// AC-3 -> test('available room card navigates to room detail on click')

import { test, expect, type APIRequestContext } from "@playwright/test";
import { getPropertyId } from "../helpers/tenant-room-basics";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function createAvailableRoom(
  request: APIRequestContext,
  propertyId: string
): Promise<{ roomId: string; roomNumber: string }> {
  const roomNumber = "NoAction-" + Date.now();
  const res = await request.post(`/api/properties/${propertyId}/rooms`, {
    data: { roomNumber, roomType: "single", monthlyRent: 1000000 },
  });
  if (!res.ok()) {
    throw new Error(`Failed to create room: ${res.status()} ${await res.text()}`);
  }
  const body = await res.json();
  return { roomId: body.id as string, roomNumber };
}

async function deleteRoom(
  request: APIRequestContext,
  propertyId: string,
  roomId: string
): Promise<void> {
  await request
    .delete(`/api/properties/${propertyId}/rooms/${roomId}`)
    .catch(() => {});
}

async function goToRoomsList(
  page: import("@playwright/test").Page,
  propertyId: string
) {
  await page.goto(`/properties/${propertyId}/rooms`, {
    waitUntil: "domcontentloaded",
  });
  await page
    .getByRole("link", { name: /add room|tambah kamar/i })
    .or(page.getByText(/no rooms found|tidak ada kamar/i))
    .first()
    .waitFor({ state: "visible", timeout: 15000 });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("available room card — no action buttons", () => {
  test.describe("good cases", () => {
    test(
      "available room card shows no assign tenant action",
      async ({ page, request }) => {
        test.info().setTimeout(60000);
        const propertyId = getPropertyId();
        const { roomId, roomNumber } = await createAvailableRoom(
          request,
          propertyId
        );

        try {
          await page.setViewportSize({ width: 375, height: 667 });
          await goToRoomsList(page, propertyId);

          const card = page
            .getByTestId("room-card")
            .filter({ hasText: roomNumber });
          await expect(card).toBeVisible({ timeout: 10000 });

          // AC-1: no "Assign Tenant" text or button visible on the card
          await expect(
            card.getByText(/assign.*tenant/i)
          ).not.toBeVisible();
        } finally {
          await deleteRoom(request, propertyId, roomId);
        }
      }
    );

    test(
      "available room card shows no change status action",
      async ({ page, request }) => {
        test.info().setTimeout(60000);
        const propertyId = getPropertyId();
        const { roomId, roomNumber } = await createAvailableRoom(
          request,
          propertyId
        );

        try {
          await page.setViewportSize({ width: 375, height: 667 });
          await goToRoomsList(page, propertyId);

          const card = page
            .getByTestId("room-card")
            .filter({ hasText: roomNumber });
          await expect(card).toBeVisible({ timeout: 10000 });

          // AC-2: no "Change Status" text visible on the card
          await expect(
            card.getByText(/change.*status/i)
          ).not.toBeVisible();
        } finally {
          await deleteRoom(request, propertyId, roomId);
        }
      }
    );

    test(
      "available room card shows room number, type, rent, and available badge",
      async ({ page, request }) => {
        test.info().setTimeout(60000);
        const propertyId = getPropertyId();
        const { roomId, roomNumber } = await createAvailableRoom(
          request,
          propertyId
        );

        try {
          await page.setViewportSize({ width: 375, height: 667 });
          await goToRoomsList(page, propertyId);

          const card = page
            .getByTestId("room-card")
            .filter({ hasText: roomNumber });
          await expect(card).toBeVisible({ timeout: 10000 });

          // Room number visible
          await expect(card.getByText(new RegExp(roomNumber, "i"))).toBeVisible({
            timeout: 5000,
          });
          // Room type visible
          await expect(card.getByText(/single/i)).toBeVisible({ timeout: 5000 });
          // Available status badge visible
          await expect(
            card.getByRole("status", { name: /available/i })
          ).toBeVisible({ timeout: 5000 });
        } finally {
          await deleteRoom(request, propertyId, roomId);
        }
      }
    );
  });

  test.describe("good cases — navigation", () => {
    test(
      "clicking available room card navigates to room detail",
      async ({ page, request }) => {
        test.info().setTimeout(60000);
        const propertyId = getPropertyId();
        const { roomId, roomNumber } = await createAvailableRoom(
          request,
          propertyId
        );

        try {
          await page.setViewportSize({ width: 375, height: 667 });
          await goToRoomsList(page, propertyId);

          const card = page
            .getByTestId("room-card")
            .filter({ hasText: roomNumber });
          await expect(card).toBeVisible({ timeout: 10000 });

          // AC-3: clicking the card navigates to room detail
          await card.click();
          await expect(page).toHaveURL(
            new RegExp(`/properties/${propertyId}/rooms/${roomId}`)
          );
        } finally {
          await deleteRoom(request, propertyId, roomId);
        }
      }
    );
  });

  test.describe("edge cases", () => {
    test(
      "available room card has no horizontal scroll at 320px width",
      async ({ page, request }) => {
        test.info().setTimeout(60000);
        const propertyId = getPropertyId();
        const { roomId, roomNumber } = await createAvailableRoom(
          request,
          propertyId
        );

        try {
          await page.setViewportSize({ width: 320, height: 568 });
          await goToRoomsList(page, propertyId);

          const card = page
            .getByTestId("room-card")
            .filter({ hasText: roomNumber });
          await expect(card).toBeVisible({ timeout: 10000 });

          // AC-6: no horizontal scroll
          const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
          const clientWidth = await page.evaluate(() => document.body.clientWidth);
          expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // 1px tolerance
        } finally {
          await deleteRoom(request, propertyId, roomId);
        }
      }
    );
  });
});
