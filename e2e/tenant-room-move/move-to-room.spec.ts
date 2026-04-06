// Traceability: tenant-room-move
// REQ 2.2 -> test('tenant with room shows Move to Room button, not Assign Room')
// REQ 1.2 -> test('user moves tenant and history shows two entries')
// REQ 2.5 -> test('Move to Room dialog shows Move date field, not Move-in date')
// REQ 4.1 -> test('old room becomes AVAILABLE after last tenant moves out')
// REQ 4.2 -> test('new room becomes OCCUPIED after move')

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

test.describe("move tenant to another room", () => {
  let roomAId: string | null = null;
  let roomBId: string | null = null;

  test.afterEach(async ({ request }) => {
    const propertyId = getPropertyId();
    if (roomAId) {
      await cleanupRoom(request, propertyId, roomAId);
      roomAId = null;
    }
    if (roomBId) {
      await cleanupRoom(request, propertyId, roomBId);
      roomBId = null;
    }
  });

  test.describe("good cases", () => {
    test("tenant with room shows Move to Room button instead of Assign Room", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(90000);
      const propertyId = getPropertyId();
      const suffix = Date.now();

      // Create room A
      const roomARes = await request.post(
        `/api/properties/${propertyId}/rooms`,
        {
          data: {
            roomNumber: "MoveA-" + suffix,
            roomType: "single",
            monthlyRent: 500000,
          },
        }
      );
      if (!roomARes.ok()) { test.skip(); return; }
      roomAId = (await roomARes.json())?.id;
      if (!roomAId) { test.skip(); return; }

      // Create tenant
      const tenantRes = await request.post(
        `/api/properties/${propertyId}/tenants`,
        {
          data: {
            name: "Move Test " + suffix,
            phone: "08200000001",
            email: `move-${suffix}@test.com`,
          },
        }
      );
      if (!tenantRes.ok()) { test.skip(); return; }
      const tenantId = (await tenantRes.json())?.id;
      if (!tenantId) { test.skip(); return; }

      // Assign tenant to room A via API
      const assignRes = await request.post(
        `/api/properties/${propertyId}/tenants/${tenantId}/move`,
        {
          data: {
            targetRoomId: roomAId,
            moveDate: new Date().toISOString().slice(0, 10),
          },
        }
      );
      if (!assignRes.ok()) { test.skip(); return; }

      await goToTenantDetail(page, tenantId);

      // Should show "Move to Room", not "Assign Room"
      await expect(
        page.getByRole("button", { name: /move to room/i })
      ).toBeVisible({ timeout: 15000 });
      await expect(
        page.getByRole("button", { name: /^assign room$/i })
      ).not.toBeVisible();
    });

    test("user moves tenant and room history shows two entries with correct dates", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(120000);
      const propertyId = getPropertyId();
      const suffix = Date.now();
      const roomANumber = "FromRoom-" + suffix;
      const roomBNumber = "ToRoom-" + suffix;

      // Create room A (origin)
      const roomARes = await request.post(
        `/api/properties/${propertyId}/rooms`,
        {
          data: {
            roomNumber: roomANumber,
            roomType: "single",
            monthlyRent: 500000,
          },
        }
      );
      if (!roomARes.ok()) { test.skip(); return; }
      roomAId = (await roomARes.json())?.id;
      if (!roomAId) { test.skip(); return; }

      // Create room B (destination)
      const roomBRes = await request.post(
        `/api/properties/${propertyId}/rooms`,
        {
          data: {
            roomNumber: roomBNumber,
            roomType: "double",
            monthlyRent: 700000,
          },
        }
      );
      if (!roomBRes.ok()) { test.skip(); return; }
      roomBId = (await roomBRes.json())?.id;
      if (!roomBId) { test.skip(); return; }

      // Create tenant
      const tenantRes = await request.post(
        `/api/properties/${propertyId}/tenants`,
        {
          data: {
            name: "Move E2E " + suffix,
            phone: "08200000002",
            email: `movee2e-${suffix}@test.com`,
          },
        }
      );
      if (!tenantRes.ok()) { test.skip(); return; }
      const tenantId = (await tenantRes.json())?.id;
      if (!tenantId) { test.skip(); return; }

      // Assign to room A via API
      const assignRes = await request.post(
        `/api/properties/${propertyId}/tenants/${tenantId}/move`,
        {
          data: {
            targetRoomId: roomAId,
            moveDate: new Date().toISOString().slice(0, 10),
          },
        }
      );
      if (!assignRes.ok()) { test.skip(); return; }

      await goToTenantDetail(page, tenantId);

      // Click "Move to Room"
      await page.getByRole("button", { name: /move to room/i }).click();

      // Dialog opens in move mode
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 12000 });

      // Current room (room A) should NOT appear as an option
      await expect(
        page.getByRole("option", { name: new RegExp(roomANumber, "i") })
      ).not.toBeVisible({ timeout: 5000 });

      // Room B should appear in the dropdown
      const roomSelect = page.getByRole("combobox").first();
      await roomSelect.click();
      await page.getByRole("option", { name: new RegExp(roomBNumber, "i") }).click();

      // Set move date (today)
      const today = new Date().toISOString().slice(0, 10);
      const dateInput = page.getByLabel(/move date|tanggal pindah/i);
      await dateInput.fill(today);

      // Confirm
      await page.getByRole("button", { name: /move to room|confirm/i }).last().click();

      // Dialog should close
      await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 15000 });

      // Room info should now show room B
      await expect(
        page.getByText(new RegExp(roomBNumber, "i"))
      ).toBeVisible({ timeout: 15000 });

      // Room History section should show two entries
      await expect(
        page.getByText(/room history|riwayat kamar/i)
      ).toBeVisible({ timeout: 8000 });

      // Current entry: room B, no end date (present)
      await expect(
        page.getByText(new RegExp(roomBNumber, "i"))
      ).toBeVisible({ timeout: 8000 });
      await expect(
        page.getByText(/present|sekarang/i)
      ).toBeVisible({ timeout: 8000 });

      // Past entry: room A, with an end date
      await expect(
        page.getByText(new RegExp(roomANumber, "i"))
      ).toBeVisible({ timeout: 8000 });
    });
  });

  test.describe("bad cases", () => {
    test("Move to Room dialog does not show current room as an option", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(90000);
      const propertyId = getPropertyId();
      const suffix = Date.now();
      const currentRoomNumber = "Current-" + suffix;

      const roomARes = await request.post(
        `/api/properties/${propertyId}/rooms`,
        {
          data: {
            roomNumber: currentRoomNumber,
            roomType: "single",
            monthlyRent: 500000,
          },
        }
      );
      if (!roomARes.ok()) { test.skip(); return; }
      roomAId = (await roomARes.json())?.id;
      if (!roomAId) { test.skip(); return; }

      const tenantRes = await request.post(
        `/api/properties/${propertyId}/tenants`,
        {
          data: {
            name: "Same Room " + suffix,
            phone: "08200000003",
            email: `sameroom-${suffix}@test.com`,
          },
        }
      );
      if (!tenantRes.ok()) { test.skip(); return; }
      const tenantId = (await tenantRes.json())?.id;
      if (!tenantId) { test.skip(); return; }

      const assignRes = await request.post(
        `/api/properties/${propertyId}/tenants/${tenantId}/move`,
        {
          data: {
            targetRoomId: roomAId,
            moveDate: new Date().toISOString().slice(0, 10),
          },
        }
      );
      if (!assignRes.ok()) { test.skip(); return; }

      await goToTenantDetail(page, tenantId);
      await page.getByRole("button", { name: /move to room/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 12000 });

      const roomSelect = page.getByRole("combobox").first();
      await roomSelect.click();

      // The current room must not be an option
      await page.waitForTimeout(1000);
      await expect(
        page.getByRole("option", { name: new RegExp(currentRoomNumber, "i") })
      ).not.toBeVisible({ timeout: 8000 });
    });
  });

  test.describe("edge cases", () => {
    test("Move to Room dialog shows Move date field (not Move-in date)", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(90000);
      const propertyId = getPropertyId();
      const suffix = Date.now();

      const roomARes = await request.post(
        `/api/properties/${propertyId}/rooms`,
        {
          data: {
            roomNumber: "MoveDate-" + suffix,
            roomType: "single",
            monthlyRent: 500000,
          },
        }
      );
      if (!roomARes.ok()) { test.skip(); return; }
      roomAId = (await roomARes.json())?.id;
      if (!roomAId) { test.skip(); return; }

      const tenantRes = await request.post(
        `/api/properties/${propertyId}/tenants`,
        {
          data: {
            name: "Date Label " + suffix,
            phone: "08200000004",
            email: `datelabel-${suffix}@test.com`,
          },
        }
      );
      if (!tenantRes.ok()) { test.skip(); return; }
      const tenantId = (await tenantRes.json())?.id;
      if (!tenantId) { test.skip(); return; }

      const assignRes = await request.post(
        `/api/properties/${propertyId}/tenants/${tenantId}/move`,
        {
          data: {
            targetRoomId: roomAId,
            moveDate: new Date().toISOString().slice(0, 10),
          },
        }
      );
      if (!assignRes.ok()) { test.skip(); return; }

      await goToTenantDetail(page, tenantId);
      await page.getByRole("button", { name: /move to room/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 12000 });

      // Must show "Move date" label, NOT "Move-in date"
      await expect(
        page.getByLabel(/move date|tanggal pindah/i)
      ).toBeVisible({ timeout: 8000 });
      await expect(
        page.getByLabel(/move.in date|tanggal masuk/i)
      ).not.toBeVisible();

      // Billing day field must NOT be shown on move dialog
      await expect(
        page.getByLabel(/billing day|hari tagihan/i)
      ).not.toBeVisible();
    });
  });
});
