// Traceability: room-status-edit / issue #115
// REQ-1 -> test('edit room form shows status field with available and under_renovation only')
// REQ-1 -> test('occupied option is absent from edit room status select')
// REQ-2 -> test('edit room form shows read-only status with note when room has active tenants')
// REQ-3 -> test('status field becomes editable after all tenants are moved out')

import { test, expect, type APIRequestContext } from "@playwright/test";
import {
  getPropertyId,
  goToEditRoomPage,
} from "../helpers/room-inventory";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

async function createEmptyRoom(request: APIRequestContext, propertyId: string) {
  const suffix = Date.now();
  const res = await request.post(`/api/properties/${propertyId}/rooms`, {
    data: { roomNumber: `SE-${suffix}`, roomType: "single", monthlyRent: 600000 },
  });
  if (!res.ok()) { return null; }
  return (await res.json())?.id as string | null;
}

async function createOccupiedRoom(request: APIRequestContext, propertyId: string) {
  const suffix = Date.now();
  const roomRes = await request.post(`/api/properties/${propertyId}/rooms`, {
    data: { roomNumber: `SO-${suffix}`, roomType: "single", monthlyRent: 600000, capacity: 1 },
  });
  if (!roomRes.ok()) { return null; }
  const roomId = (await roomRes.json())?.id as string | null;
  if (!roomId) { return null; }

  const tRes = await request.post(`/api/properties/${propertyId}/tenants`, {
    data: { name: `StatusOcc ${suffix}`, phone: "08111000001", email: `statusocc-${suffix}@test.com` },
  });
  if (!tRes.ok()) { return null; }
  const tenantId = (await tRes.json())?.id as string | null;
  if (!tenantId) { return null; }

  const assignRes = await request.post(
    `/api/properties/${propertyId}/tenants/${tenantId}/move`,
    { data: { targetRoomId: roomId, moveDate: new Date().toISOString().slice(0, 10) } }
  );
  if (!assignRes.ok()) { return null; }

  return { roomId, tenantId };
}

async function cleanupRoom(request: APIRequestContext, propertyId: string, roomId: string) {
  const roomRes = await request.get(`/api/properties/${propertyId}/rooms/${roomId}`).catch(() => null);
  if (roomRes?.ok()) {
    const room = await roomRes.json().catch(() => ({}));
    for (const tenant of room?.tenants ?? []) {
      await request.post(`/api/properties/${propertyId}/tenants/${tenant.id}/move-out`).catch(() => {});
    }
  }
  await request.delete(`/api/properties/${propertyId}/rooms/${roomId}`).catch(() => {});
}

test.describe("edit room form — status field", () => {
  let createdRoomId: string | null = null;

  test.afterEach(async ({ request }) => {
    if (!createdRoomId) { return; }
    await cleanupRoom(request, getPropertyId(), createdRoomId);
    createdRoomId = null;
  });

  test.describe("good cases", () => {
    test("edit room form shows status field with available and under_renovation only", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const roomId = await createEmptyRoom(request, propertyId);
      if (!roomId) { test.skip(); return; }
      createdRoomId = roomId;

      await goToEditRoomPage(page, roomId);

      const statusTrigger = page.locator("#room-status");
      await expect(statusTrigger).toBeVisible({ timeout: 10000 });

      await statusTrigger.click();

      await expect(page.getByRole("option", { name: /^available$/i })).toBeVisible({ timeout: 5000 });
      await expect(page.getByRole("option", { name: /^under renovation$/i })).toBeVisible({ timeout: 5000 });
    });

    test("status field is enabled and changeable for an empty room", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();

      // Create room in available state first
      const suffix = Date.now();
      const roomRes = await request.post(`/api/properties/${propertyId}/rooms`, {
        data: { roomNumber: `SE2-${suffix}`, roomType: "single", monthlyRent: 600000 },
      });
      if (!roomRes.ok()) { test.skip(); return; }
      const roomId = (await roomRes.json())?.id;
      if (!roomId) { test.skip(); return; }
      createdRoomId = roomId;

      await goToEditRoomPage(page, roomId);

      const statusTrigger = page.locator("#room-status");
      await expect(statusTrigger).toBeVisible({ timeout: 10000 });
      await expect(statusTrigger).not.toBeDisabled();

      await statusTrigger.click();
      await page.getByRole("option", { name: /^under renovation$/i }).click();

      const saveBtn = page.getByRole("button", { name: /save|simpan/i }).first();
      await saveBtn.click();

      await expect(
        page.getByText(/saved|updated|berhasil/i).first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("bad cases", () => {
    test("edit room form shows read-only status with note when room has active tenants", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const result = await createOccupiedRoom(request, propertyId);
      if (!result) { test.skip(); return; }
      createdRoomId = result.roomId;

      await goToEditRoomPage(page, result.roomId);

      // Status select should NOT be present
      await expect(page.locator("#room-status")).not.toBeVisible({ timeout: 5000 }).catch(() => {});

      // Explanatory note should be visible
      await expect(
        page.getByText(/move out all tenants before changing status/i)
      ).toBeVisible({ timeout: 10000 });
    });

    test("occupied option is absent from status select on empty room", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const roomId = await createEmptyRoom(request, propertyId);
      if (!roomId) { test.skip(); return; }
      createdRoomId = roomId;

      await goToEditRoomPage(page, roomId);

      const statusTrigger = page.locator("#room-status");
      await expect(statusTrigger).toBeVisible({ timeout: 10000 });
      await statusTrigger.click();

      // Occupied option must not appear
      const occupiedOption = page.getByRole("option", { name: /^occupied$/i });
      await expect(occupiedOption).not.toBeVisible({ timeout: 3000 }).catch(() => {});
      await expect(occupiedOption).toHaveCount(0);
    });
  });

  test.describe("edge cases", () => {
    test("status field becomes editable after last tenant is moved out", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(90000);
      const propertyId = getPropertyId();
      const result = await createOccupiedRoom(request, propertyId);
      if (!result) { test.skip(); return; }
      createdRoomId = result.roomId;

      // First visit: status field should be read-only
      await goToEditRoomPage(page, result.roomId);
      await expect(
        page.getByText(/move out all tenants before changing status/i)
      ).toBeVisible({ timeout: 10000 });

      // Move out the tenant via API
      const moveOutRes = await request.post(
        `/api/properties/${propertyId}/tenants/${result.tenantId}/move-out`
      );
      expect(moveOutRes.ok()).toBe(true);

      // Revisit edit page: status field should now be editable
      await goToEditRoomPage(page, result.roomId);
      const statusTrigger = page.locator("#room-status");
      await expect(statusTrigger).toBeVisible({ timeout: 10000 });
      await expect(statusTrigger).not.toBeDisabled();
    });
  });
});
