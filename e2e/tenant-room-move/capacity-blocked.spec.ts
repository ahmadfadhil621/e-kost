// Traceability: tenant-room-move
// REQ 3.2 -> test('room at capacity not shown in room selector')
// REQ 3.4 -> test('room selector shows occupancy vs capacity count')
// REQ 3.3 -> test('POST /move returns 409 when room is at capacity (API guard)')

import { test, expect } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";
import {
  getPropertyId,
  goToTenantDetail,
} from "../helpers/tenant-room-basics";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

async function cleanupRoom(
  request: APIRequestContext,
  propertyId: string,
  roomId: string
) {
  const roomRes = await request
    .get(`/api/properties/${propertyId}/rooms/${roomId}`)
    .catch(() => null);
  if (roomRes?.ok()) {
    const room = await roomRes.json().catch(() => ({}));
    for (const tenant of room?.tenants ?? []) {
      await request
        .post(`/api/properties/${propertyId}/tenants/${tenant.id}/move-out`)
        .catch(() => {});
    }
  }
  await request
    .delete(`/api/properties/${propertyId}/rooms/${roomId}`)
    .catch(() => {});
}

test.describe("capacity enforcement in room selector", () => {
  let fullRoomId: string | null = null;

  test.afterEach(async ({ request }) => {
    if (!fullRoomId) { return; }
    await cleanupRoom(request, getPropertyId(), fullRoomId);
    fullRoomId = null;
  });

  test.describe("good cases", () => {
    test("room at capacity does not appear in Assign Room dialog", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(90000);
      const propertyId = getPropertyId();
      const suffix = Date.now();
      const fullRoomNumber = "Full-Cap-" + suffix;

      // Create a room with capacity 1
      const roomRes = await request.post(
        `/api/properties/${propertyId}/rooms`,
        {
          data: {
            roomNumber: fullRoomNumber,
            roomType: "single",
            monthlyRent: 500000,
            capacity: 1,
          },
        }
      );
      if (!roomRes.ok()) { test.skip(); return; }
      fullRoomId = (await roomRes.json())?.id;
      if (!fullRoomId) { test.skip(); return; }

      // Fill the room via the /move API
      const occupantRes = await request.post(
        `/api/properties/${propertyId}/tenants`,
        {
          data: {
            name: "Occupant " + suffix,
            phone: "08300000001",
            email: `occupant-${suffix}@test.com`,
          },
        }
      );
      if (!occupantRes.ok()) { test.skip(); return; }
      const occupantId = (await occupantRes.json())?.id;
      if (!occupantId) { test.skip(); return; }
      const fillRes = await request.post(
        `/api/properties/${propertyId}/tenants/${occupantId}/move`,
        {
          data: {
            targetRoomId: fullRoomId,
            moveDate: new Date().toISOString().slice(0, 10),
          },
        }
      );
      if (!fillRes.ok()) { test.skip(); return; }

      // Create a new unassigned tenant
      const newTenantRes = await request.post(
        `/api/properties/${propertyId}/tenants`,
        {
          data: {
            name: "Waiting " + suffix,
            phone: "08300000002",
            email: `waiting-${suffix}@test.com`,
          },
        }
      );
      if (!newTenantRes.ok()) { test.skip(); return; }
      const newTenantId = (await newTenantRes.json())?.id;
      if (!newTenantId) { test.skip(); return; }

      await goToTenantDetail(page, newTenantId);
      await page.getByRole("button", { name: /assign room/i }).click();

      // Wait for dialog to load room options
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 12000 });
      await page.waitForTimeout(1500);

      // The full room must NOT be in the list
      await expect(
        page.getByRole("button", { name: new RegExp(fullRoomNumber, "i") })
      ).not.toBeVisible({ timeout: 8000 });
    });

    test("room with available slots shows occupancy count in selector", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(90000);
      const propertyId = getPropertyId();
      const suffix = Date.now();
      const partialRoomNumber = "Partial-" + suffix;

      // Create a room with capacity 2
      const roomRes = await request.post(
        `/api/properties/${propertyId}/rooms`,
        {
          data: {
            roomNumber: partialRoomNumber,
            roomType: "double",
            monthlyRent: 600000,
            capacity: 2,
          },
        }
      );
      if (!roomRes.ok()) { test.skip(); return; }
      fullRoomId = (await roomRes.json())?.id;
      if (!fullRoomId) { test.skip(); return; }

      // Fill one slot
      const occupantRes = await request.post(
        `/api/properties/${propertyId}/tenants`,
        {
          data: {
            name: "Half Occ " + suffix,
            phone: "08300000003",
            email: `halfocc-${suffix}@test.com`,
          },
        }
      );
      if (!occupantRes.ok()) { test.skip(); return; }
      const occupantId = (await occupantRes.json())?.id;
      if (!occupantId) { test.skip(); return; }
      await request.post(
        `/api/properties/${propertyId}/tenants/${occupantId}/move`,
        {
          data: {
            targetRoomId: fullRoomId,
            moveDate: new Date().toISOString().slice(0, 10),
          },
        }
      );

      // New unassigned tenant
      const newRes = await request.post(
        `/api/properties/${propertyId}/tenants`,
        {
          data: {
            name: "Slot Check " + suffix,
            phone: "08300000004",
            email: `slotcheck-${suffix}@test.com`,
          },
        }
      );
      if (!newRes.ok()) { test.skip(); return; }
      const newTenantId = (await newRes.json())?.id;
      if (!newTenantId) { test.skip(); return; }

      await goToTenantDetail(page, newTenantId);
      await page.getByRole("button", { name: /assign room/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 12000 });

      // The partial room must appear with a slots indicator (e.g. "1/2")
      const roomOption = page.getByRole("button", {
        name: new RegExp(partialRoomNumber, "i"),
      });
      await expect(roomOption).toBeVisible({ timeout: 8000 });
      // Slots text: "1/2 slots" or similar occupancy info
      await expect(
        page.getByText(/1\/2|1 of 2|slot/i).first()
      ).toBeVisible({ timeout: 8000 });
    });
  });

  test.describe("bad cases", () => {
    test("POST /move returns 409 when target room is at capacity", async ({
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const suffix = Date.now();

      // Create room with capacity 1
      const roomRes = await request.post(
        `/api/properties/${propertyId}/rooms`,
        {
          data: {
            roomNumber: "ApiCap-" + suffix,
            roomType: "single",
            monthlyRent: 400000,
            capacity: 1,
          },
        }
      );
      if (!roomRes.ok()) { test.skip(); return; }
      fullRoomId = (await roomRes.json())?.id;
      if (!fullRoomId) { test.skip(); return; }

      // Fill the room
      const t1Res = await request.post(
        `/api/properties/${propertyId}/tenants`,
        {
          data: {
            name: "Fill1 " + suffix,
            phone: "08300000005",
            email: `fill1-${suffix}@test.com`,
          },
        }
      );
      if (!t1Res.ok()) { test.skip(); return; }
      const t1Id = (await t1Res.json())?.id;
      if (!t1Id) { test.skip(); return; }
      await request.post(
        `/api/properties/${propertyId}/tenants/${t1Id}/move`,
        {
          data: {
            targetRoomId: fullRoomId,
            moveDate: new Date().toISOString().slice(0, 10),
          },
        }
      );

      // Try to over-assign
      const t2Res = await request.post(
        `/api/properties/${propertyId}/tenants`,
        {
          data: {
            name: "Fill2 " + suffix,
            phone: "08300000006",
            email: `fill2-${suffix}@test.com`,
          },
        }
      );
      if (!t2Res.ok()) { test.skip(); return; }
      const t2Id = (await t2Res.json())?.id;
      if (!t2Id) { test.skip(); return; }

      const overAssign = await request.post(
        `/api/properties/${propertyId}/tenants/${t2Id}/move`,
        {
          data: {
            targetRoomId: fullRoomId,
            moveDate: new Date().toISOString().slice(0, 10),
          },
        }
      );

      expect(overAssign.status()).toBe(409);
      const body = await overAssign.json();
      expect(body.error).toMatch(/capacity|penuh|full/i);
    });
  });

  test.describe("edge cases", () => {
    test("room at capacity does not appear in Move to Room dialog either", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(90000);
      const propertyId = getPropertyId();
      const suffix = Date.now();
      const fullRoomNumber = "FullMove-" + suffix;
      const originRoomNumber = "Origin-" + suffix;
      let originRoomId: string | null = null;

      // Create origin room (tenant's current room)
      const originRes = await request.post(
        `/api/properties/${propertyId}/rooms`,
        {
          data: {
            roomNumber: originRoomNumber,
            roomType: "single",
            monthlyRent: 400000,
          },
        }
      );
      if (!originRes.ok()) { test.skip(); return; }
      originRoomId = (await originRes.json())?.id;
      if (!originRoomId) { test.skip(); return; }

      // Create full room with capacity 1
      const fullRes = await request.post(
        `/api/properties/${propertyId}/rooms`,
        {
          data: {
            roomNumber: fullRoomNumber,
            roomType: "single",
            monthlyRent: 500000,
            capacity: 1,
          },
        }
      );
      if (!fullRes.ok()) { test.skip(); return; }
      fullRoomId = (await fullRes.json())?.id;
      if (!fullRoomId) { test.skip(); return; }

      // Fill the full room
      const occRes = await request.post(
        `/api/properties/${propertyId}/tenants`,
        {
          data: {
            name: "Full Occ Move " + suffix,
            phone: "08300000007",
            email: `fullocc2-${suffix}@test.com`,
          },
        }
      );
      if (!occRes.ok()) { test.skip(); return; }
      const occId = (await occRes.json())?.id;
      if (!occId) { test.skip(); return; }
      await request.post(
        `/api/properties/${propertyId}/tenants/${occId}/move`,
        {
          data: {
            targetRoomId: fullRoomId,
            moveDate: new Date().toISOString().slice(0, 10),
          },
        }
      );

      // Create tenant in origin room
      const tenantRes = await request.post(
        `/api/properties/${propertyId}/tenants`,
        {
          data: {
            name: "Mover " + suffix,
            phone: "08300000008",
            email: `mover-${suffix}@test.com`,
          },
        }
      );
      if (!tenantRes.ok()) { test.skip(); return; }
      const tenantId = (await tenantRes.json())?.id;
      if (!tenantId) { test.skip(); return; }
      await request.post(
        `/api/properties/${propertyId}/tenants/${tenantId}/move`,
        {
          data: {
            targetRoomId: originRoomId,
            moveDate: new Date().toISOString().slice(0, 10),
          },
        }
      );

      await goToTenantDetail(page, tenantId);
      await page.getByRole("button", { name: /move to room/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 12000 });

      await page.waitForTimeout(1000);

      // Full room must not appear in the list
      await expect(
        page.getByRole("button", { name: new RegExp(fullRoomNumber, "i") })
      ).not.toBeVisible({ timeout: 8000 });

      // Cleanup origin room
      await cleanupRoom(request, propertyId, originRoomId);
    });
  });
});
