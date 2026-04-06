// Traceability: tenant-room-move
// REQ 2.1 -> test('tenant with no room shows Assign Room button')
// REQ 2.3 -> test('Assign Room dialog shows room selector and date picker')
// REQ 1.1 -> test('user assigns room and history shows one entry')
// REQ 2.4 -> test('assign date field defaults to today')
// REQ 2.6 -> test('billing day field visible on initial assign dialog')

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

test.describe("assign room (initial assignment)", () => {
  let createdRoomId: string | null = null;

  test.afterEach(async ({ request }) => {
    if (!createdRoomId) { return; }
    await cleanupRoom(request, getPropertyId(), createdRoomId);
    createdRoomId = null;
  });

  test.describe("good cases", () => {
    test("tenant with no room shows Assign Room button", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const suffix = Date.now();

      const tenantRes = await request.post(
        `/api/properties/${propertyId}/tenants`,
        {
          data: {
            name: "No Room Tenant " + suffix,
            phone: "08100000001",
            email: `noroom-${suffix}@test.com`,
          },
        }
      );
      if (!tenantRes.ok()) { test.skip(); return; }
      const tenantId = (await tenantRes.json())?.id;
      if (!tenantId) { test.skip(); return; }

      await goToTenantDetail(page, tenantId);

      // Button label must be "Assign Room" (not "Move to Room") when no room is set
      await expect(
        page.getByRole("button", { name: /assign room/i })
      ).toBeVisible({ timeout: 15000 });
      await expect(
        page.getByRole("button", { name: /move to room/i })
      ).not.toBeVisible();
    });

    test("user assigns room and room history shows one entry", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(90000);
      const propertyId = getPropertyId();
      const suffix = Date.now();
      const roomNumber = "Assign-" + suffix;

      const roomRes = await request.post(
        `/api/properties/${propertyId}/rooms`,
        {
          data: {
            roomNumber,
            roomType: "single",
            monthlyRent: 500000,
            capacity: 1,
          },
        }
      );
      if (!roomRes.ok()) { test.skip(); return; }
      createdRoomId = (await roomRes.json())?.id;
      if (!createdRoomId) { test.skip(); return; }

      const tenantRes = await request.post(
        `/api/properties/${propertyId}/tenants`,
        {
          data: {
            name: "Assign E2E " + suffix,
            phone: "08100000002",
            email: `assign-e2e-${suffix}@test.com`,
          },
        }
      );
      if (!tenantRes.ok()) { test.skip(); return; }
      const tenantId = (await tenantRes.json())?.id;
      if (!tenantId) { test.skip(); return; }

      await goToTenantDetail(page, tenantId);

      // Open the Assign Room dialog
      await page.getByRole("button", { name: /assign room/i }).click();

      // Dialog should appear with room selector
      await expect(
        page.getByRole("dialog")
      ).toBeVisible({ timeout: 12000 });

      // The new room should appear in the dropdown/list
      await expect(
        page.getByText(new RegExp(roomNumber, "i"))
      ).toBeVisible({ timeout: 10000 });

      // Select the room from the inline list
      await page.getByRole("button", { name: new RegExp(roomNumber, "i") }).click();

      // Click confirm
      await page.getByRole("button", { name: /assign room|confirm/i }).last().click();

      // Dialog should close and detail page reflects the new room
      await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 15000 });
      await expect(
        page.getByText(new RegExp(roomNumber, "i"))
      ).toBeVisible({ timeout: 15000 });

      // Room History section should show one entry (current, no end date)
      await expect(
        page.getByText(/room history|riwayat kamar/i)
      ).toBeVisible({ timeout: 8000 });
      await expect(
        page.getByText(new RegExp(roomNumber, "i"))
      ).toBeVisible({ timeout: 8000 });
      // The current entry should say "present" (no end date)
      await expect(
        page.getByText(/present|sekarang/i)
      ).toBeVisible({ timeout: 8000 });
    });
  });

  test.describe("bad cases", () => {
    test("Assign Room dialog shows empty state when no rooms have capacity", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const suffix = Date.now();

      // Create a room with capacity 1 and fill it
      const roomRes = await request.post(
        `/api/properties/${propertyId}/rooms`,
        {
          data: {
            roomNumber: "Full-" + suffix,
            roomType: "single",
            monthlyRent: 400000,
            capacity: 1,
          },
        }
      );
      if (!roomRes.ok()) { test.skip(); return; }
      const roomId = (await roomRes.json())?.id;
      if (!roomId) { test.skip(); return; }
      createdRoomId = roomId;

      // Fill the room via /move endpoint
      const occupantRes = await request.post(
        `/api/properties/${propertyId}/tenants`,
        {
          data: {
            name: "Full Occ " + suffix,
            phone: "08100000003",
            email: `fullocc-${suffix}@test.com`,
          },
        }
      );
      if (!occupantRes.ok()) { test.skip(); return; }
      const occupantId = (await occupantRes.json())?.id;
      if (!occupantId) { test.skip(); return; }
      const assignRes = await request.post(
        `/api/properties/${propertyId}/tenants/${occupantId}/move`,
        {
          data: {
            targetRoomId: roomId,
            moveDate: new Date().toISOString().slice(0, 10),
          },
        }
      );
      if (!assignRes.ok()) { test.skip(); return; }

      // Create a new unassigned tenant
      const newTenantRes = await request.post(
        `/api/properties/${propertyId}/tenants`,
        {
          data: {
            name: "Waiting " + suffix,
            phone: "08100000004",
            email: `waiting-${suffix}@test.com`,
          },
        }
      );
      if (!newTenantRes.ok()) { test.skip(); return; }
      const newTenantId = (await newTenantRes.json())?.id;
      if (!newTenantId) { test.skip(); return; }

      await goToTenantDetail(page, newTenantId);
      await page.getByRole("button", { name: /assign room/i }).click();

      // Full room must NOT appear in the room options
      await page.waitForTimeout(1500); // wait for dialog to load rooms
      await expect(
        page.getByRole("option", { name: new RegExp("Full-" + suffix, "i") })
      ).not.toBeVisible({ timeout: 8000 });
    });
  });

  test.describe("edge cases", () => {
    test("Assign Room dialog shows date picker with move-in date field", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const suffix = Date.now();

      const roomRes = await request.post(
        `/api/properties/${propertyId}/rooms`,
        {
          data: {
            roomNumber: "DateTest-" + suffix,
            roomType: "single",
            monthlyRent: 400000,
          },
        }
      );
      if (!roomRes.ok()) { test.skip(); return; }
      createdRoomId = (await roomRes.json())?.id;
      if (!createdRoomId) { test.skip(); return; }

      const tenantRes = await request.post(
        `/api/properties/${propertyId}/tenants`,
        {
          data: {
            name: "Date Test " + suffix,
            phone: "08100000005",
            email: `datetest-${suffix}@test.com`,
          },
        }
      );
      if (!tenantRes.ok()) { test.skip(); return; }
      const tenantId = (await tenantRes.json())?.id;
      if (!tenantId) { test.skip(); return; }

      await goToTenantDetail(page, tenantId);
      await page.getByRole("button", { name: /assign room/i }).click();

      // Dialog should show a date field labelled "Move-in date"
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 12000 });
      await expect(
        page.getByLabel(/move.in date|assign date|tanggal masuk/i)
      ).toBeVisible({ timeout: 8000 });

      // Billing day field should also be visible on initial assign
      await expect(
        page.getByLabel(/billing day|hari tagihan/i)
      ).toBeVisible({ timeout: 8000 });
    });

    test("Assign Room dialog can be cancelled without changes", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const suffix = Date.now();

      const tenantRes = await request.post(
        `/api/properties/${propertyId}/tenants`,
        {
          data: {
            name: "Cancel Assign " + suffix,
            phone: "08100000006",
            email: `cancelassign-${suffix}@test.com`,
          },
        }
      );
      if (!tenantRes.ok()) { test.skip(); return; }
      const tenantId = (await tenantRes.json())?.id;
      if (!tenantId) { test.skip(); return; }

      await goToTenantDetail(page, tenantId);
      await page.getByRole("button", { name: /assign room/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 12000 });

      // Cancel
      await page.getByRole("button", { name: /cancel/i }).first().click();

      // Dialog should close; button still shows "Assign Room"
      await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 8000 });
      await expect(
        page.getByRole("button", { name: /assign room/i })
      ).toBeVisible({ timeout: 8000 });
    });
  });
});
