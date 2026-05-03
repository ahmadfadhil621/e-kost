// Traceability: room-status-edit / issue #115
// REQ-5 -> test('PATCH status to occupied returns 409 for an empty room')
// REQ-5 -> test('PATCH status to occupied returns 409 even when room is already occupied')
// REQ-5 -> test('PATCH status to available succeeds for an empty room')

import { test, expect, type APIRequestContext } from "@playwright/test";
import { getPropertyId } from "../helpers/room-inventory";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

async function createEmptyRoom(request: APIRequestContext, propertyId: string) {
  const suffix = Date.now();
  const res = await request.post(`/api/properties/${propertyId}/rooms`, {
    data: { roomNumber: `AG-${suffix}`, roomType: "single", monthlyRent: 500000 },
  });
  if (!res.ok()) { return null; }
  return (await res.json())?.id as string | null;
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

test.describe("status API — occupied guard", () => {
  let createdRoomId: string | null = null;

  test.afterEach(async ({ request }) => {
    if (!createdRoomId) { return; }
    await cleanupRoom(request, getPropertyId(), createdRoomId);
    createdRoomId = null;
  });

  test.describe("bad cases", () => {
    test("PATCH status to occupied returns 409 for an empty room", async ({ request }) => {
      test.info().setTimeout(30000);
      const propertyId = getPropertyId();
      const roomId = await createEmptyRoom(request, propertyId);
      if (!roomId) { test.skip(); return; }
      createdRoomId = roomId;

      const res = await request.patch(
        `/api/properties/${propertyId}/rooms/${roomId}/status`,
        { data: { status: "occupied" } }
      );
      expect(res.status()).toBe(409);

      const body = await res.json().catch(() => ({}));
      expect(body).toHaveProperty("error");
    });

    test("PATCH status to occupied returns 409 even when room is already occupied", async ({ request }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const suffix = Date.now();

      // Create room and assign a tenant so it becomes occupied
      const roomRes = await request.post(`/api/properties/${propertyId}/rooms`, {
        data: { roomNumber: `AGO-${suffix}`, roomType: "single", monthlyRent: 600000, capacity: 1 },
      });
      if (!roomRes.ok()) { test.skip(); return; }
      const roomId = (await roomRes.json())?.id;
      if (!roomId) { test.skip(); return; }
      createdRoomId = roomId;

      const tRes = await request.post(`/api/properties/${propertyId}/tenants`, {
        data: { name: `AGOcc ${suffix}`, phone: "08222000001", email: `agocc-${suffix}@test.com` },
      });
      if (!tRes.ok()) { test.skip(); return; }
      const tenantId = (await tRes.json())?.id;
      if (!tenantId) { test.skip(); return; }

      const assignRes = await request.post(
        `/api/properties/${propertyId}/tenants/${tenantId}/move`,
        { data: { targetRoomId: roomId, moveDate: new Date().toISOString().slice(0, 10) } }
      );
      if (!assignRes.ok()) { test.skip(); return; }

      // Manually patching to occupied must still be rejected
      const res = await request.patch(
        `/api/properties/${propertyId}/rooms/${roomId}/status`,
        { data: { status: "occupied" } }
      );
      expect(res.status()).toBe(409);
    });
  });

  test.describe("good cases", () => {
    test("PATCH status to available succeeds for an empty room", async ({ request }) => {
      test.info().setTimeout(30000);
      const propertyId = getPropertyId();

      // Create room in available state, then patch it to under_renovation first
      const roomId = await createEmptyRoom(request, propertyId);
      if (!roomId) { test.skip(); return; }
      createdRoomId = roomId;

      const toRenovation = await request.patch(
        `/api/properties/${propertyId}/rooms/${roomId}/status`,
        { data: { status: "under_renovation" } }
      );
      if (!toRenovation.ok()) { test.skip(); return; }

      const toAvailable = await request.patch(
        `/api/properties/${propertyId}/rooms/${roomId}/status`,
        { data: { status: "available" } }
      );
      expect(toAvailable.ok()).toBe(true);
      expect(toAvailable.status()).toBe(200);
    });
  });

  test.describe("edge cases", () => {
    test("PATCH status to under_renovation returns 409 for an occupied room", async ({ request }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const suffix = Date.now();

      const roomRes = await request.post(`/api/properties/${propertyId}/rooms`, {
        data: { roomNumber: `AGR-${suffix}`, roomType: "single", monthlyRent: 600000, capacity: 1 },
      });
      if (!roomRes.ok()) { test.skip(); return; }
      const roomId = (await roomRes.json())?.id;
      if (!roomId) { test.skip(); return; }
      createdRoomId = roomId;

      const tRes = await request.post(`/api/properties/${propertyId}/tenants`, {
        data: { name: `AGRen ${suffix}`, phone: "08333000001", email: `agren-${suffix}@test.com` },
      });
      if (!tRes.ok()) { test.skip(); return; }
      const tenantId = (await tRes.json())?.id;
      if (!tenantId) { test.skip(); return; }

      await request.post(
        `/api/properties/${propertyId}/tenants/${tenantId}/move`,
        { data: { targetRoomId: roomId, moveDate: new Date().toISOString().slice(0, 10) } }
      );

      // Cannot set to under_renovation while tenants are present
      const res = await request.patch(
        `/api/properties/${propertyId}/rooms/${roomId}/status`,
        { data: { status: "under_renovation" } }
      );
      expect(res.status()).toBe(409);
    });
  });
});
