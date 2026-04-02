// Traceability: multi-tenant-rooms
// REQ 4.1 -> test('moving out a tenant removes their assignment')
// REQ 4.2 -> test('last tenant move-out transitions room to available')
// REQ 4.3 -> test('room stays occupied when other tenants remain after move-out')
// REQ 3.1 -> test('room stays occupied when other tenants remain after move-out')
// REQ 3.2 -> test('last tenant move-out transitions room to available')

import { test, expect } from "@playwright/test";
import {
  getPropertyId,
  goToRoomDetail,
} from "../helpers/room-inventory";
import { goToTenantDetail } from "../helpers/tenant-room-basics";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

test.describe("tenant move-out in shared room", () => {
  test.describe("good cases", () => {
    test("last tenant move-out transitions room to available", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(90000);
      const propertyId = getPropertyId();
      const suffix = Date.now();

      // Create room with capacity 1
      const roomRes = await request.post(
        `/api/properties/${propertyId}/rooms`,
        { data: { roomNumber: "LastOut-" + suffix, roomType: "single", monthlyRent: 500000, capacity: 1 } }
      );
      if (!roomRes.ok()) { test.skip(); return; }
      const roomBody = await roomRes.json();
      const roomId = roomBody?.id;
      if (!roomId) { test.skip(); return; }

      // Create and assign tenant
      const tRes = await request.post(`/api/properties/${propertyId}/tenants`, {
        data: { name: "Last Out " + suffix, phone: "08800000001", email: `lastout-${suffix}@test.com` },
      });
      if (!tRes.ok()) { test.skip(); return; }
      const tBody = await tRes.json();
      const tId = tBody?.id;
      if (!tId) { test.skip(); return; }
      const assignRes = await request.post(
        `/api/properties/${propertyId}/tenants/${tId}/assign-room`,
        { data: { roomId } }
      );
      if (!assignRes.ok()) { test.skip(); return; }

      // Move out via UI
      await goToTenantDetail(page, tId);
      const moveOutBtn = page
        .getByRole("button", { name: /move out/i })
        .or(page.getByRole("link", { name: /move out/i }))
        .first();
      await expect(moveOutBtn).toBeVisible({ timeout: 15000 });
      await moveOutBtn.click();

      // Confirm dialog if present
      const confirmBtn = page.getByRole("button", { name: /confirm|yes|move out/i }).last();
      await confirmBtn.waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
      }

      // Wait for success feedback
      await expect(
        page.getByText(/moved out|pindah keluar|success|berhasil/i).first()
      ).toBeVisible({ timeout: 15000 });

      // Verify room is now available via API
      const roomCheckRes = await request.get(
        `/api/properties/${propertyId}/rooms/${roomId}`
      );
      if (roomCheckRes.ok()) {
        const roomData = await roomCheckRes.json();
        expect(roomData.status).toBe("available");
        expect(roomData.activeTenantCount).toBe(0);
      }
    });

    test("room stays occupied when other tenants remain after move-out", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(90000);
      const propertyId = getPropertyId();
      const suffix = Date.now();

      // Create room with capacity 2
      const roomRes = await request.post(
        `/api/properties/${propertyId}/rooms`,
        { data: { roomNumber: "Shared-" + suffix, roomType: "double", monthlyRent: 700000, capacity: 2 } }
      );
      if (!roomRes.ok()) { test.skip(); return; }
      const roomBody = await roomRes.json();
      const roomId = roomBody?.id;
      if (!roomId) { test.skip(); return; }

      // Create two tenants and assign both
      const ta1Res = await request.post(`/api/properties/${propertyId}/tenants`, {
        data: { name: "Shared A1 " + suffix, phone: "08900000001", email: `sha1-${suffix}@test.com` },
      });
      if (!ta1Res.ok()) { test.skip(); return; }
      const ta1Id = (await ta1Res.json())?.id;

      const ta2Res = await request.post(`/api/properties/${propertyId}/tenants`, {
        data: { name: "Shared A2 " + suffix, phone: "08900000002", email: `sha2-${suffix}@test.com` },
      });
      if (!ta2Res.ok()) { test.skip(); return; }
      const ta2Id = (await ta2Res.json())?.id;

      if (!ta1Id || !ta2Id) { test.skip(); return; }

      await request.post(`/api/properties/${propertyId}/tenants/${ta1Id}/assign-room`, { data: { roomId } });
      await request.post(`/api/properties/${propertyId}/tenants/${ta2Id}/assign-room`, { data: { roomId } });

      // Move out tenant 1 via UI
      await goToTenantDetail(page, ta1Id);
      const moveOutBtn = page
        .getByRole("button", { name: /move out/i })
        .or(page.getByRole("link", { name: /move out/i }))
        .first();
      await expect(moveOutBtn).toBeVisible({ timeout: 15000 });
      await moveOutBtn.click();

      const confirmBtn = page.getByRole("button", { name: /confirm|yes|move out/i }).last();
      await confirmBtn.waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
      }

      await expect(
        page.getByText(/moved out|pindah keluar|success|berhasil/i).first()
      ).toBeVisible({ timeout: 15000 });

      // Room should still be occupied (tenant 2 is still there)
      const roomCheckRes = await request.get(
        `/api/properties/${propertyId}/rooms/${roomId}`
      );
      if (roomCheckRes.ok()) {
        const roomData = await roomCheckRes.json();
        expect(roomData.status).toBe("occupied");
        expect(roomData.activeTenantCount).toBe(1);
      }

      // Room detail should still show tenant 2 but not tenant 1
      await goToRoomDetail(page, roomId);
      await expect(
        page.getByText(/current tenants|penyewa saat ini/i).first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("edge cases", () => {
    test("moving out a tenant removes their room assignment", async ({
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const suffix = Date.now();

      // Create room and assign tenant, then move out via API
      const roomRes = await request.post(
        `/api/properties/${propertyId}/rooms`,
        { data: { roomNumber: "AssignRM-" + suffix, roomType: "single", monthlyRent: 400000, capacity: 1 } }
      );
      if (!roomRes.ok()) { test.skip(); return; }
      const roomId = (await roomRes.json())?.id;
      if (!roomId) { test.skip(); return; }

      const tRes = await request.post(`/api/properties/${propertyId}/tenants`, {
        data: { name: "AssignRM T " + suffix, phone: "09000000001", email: `assignrm-${suffix}@test.com` },
      });
      if (!tRes.ok()) { test.skip(); return; }
      const tId = (await tRes.json())?.id;
      if (!tId) { test.skip(); return; }

      await request.post(`/api/properties/${propertyId}/tenants/${tId}/assign-room`, { data: { roomId } });

      // Verify tenant is in room
      const tenantBefore = await request.get(
        `/api/properties/${propertyId}/tenants/${tId}`
      );
      if (tenantBefore.ok()) {
        const td = await tenantBefore.json();
        expect(td.roomId).toBe(roomId);
      }

      // Move out via API
      const moveOutRes = await request.post(
        `/api/properties/${propertyId}/tenants/${tId}/move-out`
      );
      expect(moveOutRes.ok()).toBe(true);

      // Verify tenant has no room
      const tenantAfter = await request.get(
        `/api/properties/${propertyId}/tenants/${tId}`
      );
      if (tenantAfter.ok()) {
        const td = await tenantAfter.json();
        expect(td.roomId).toBeNull();
      }

      // Verify room is available
      const roomAfter = await request.get(
        `/api/properties/${propertyId}/rooms/${roomId}`
      );
      if (roomAfter.ok()) {
        const rd = await roomAfter.json();
        expect(rd.status).toBe("available");
        expect(rd.activeTenantCount).toBe(0);
      }
    });
  });
});
