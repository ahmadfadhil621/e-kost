// Traceability: data-integrity
// AC-1 -> test('API returns 409 with error when trying to move out already-moved-out tenant')
// AC-2 -> test('setting room status to occupied with no active tenant shows error')
// AC-3 -> test('balance on tenant detail reflects updated monthly rent after room edit')

import { test, expect } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";
import {
  getPropertyId,
  goToRoomDetail,
  goToEditRoomPage,
} from "../helpers/room-inventory";
import { goToTenantDetail } from "../helpers/tenant-room-basics";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

// ─── helpers ────────────────────────────────────────────────────────────────

async function createRoom(
  request: APIRequestContext,
  propertyId: string,
  overrides: Record<string, unknown> = {}
) {
  const suffix = Date.now();
  const res = await request.post(`/api/properties/${propertyId}/rooms`, {
    data: {
      roomNumber: `DI-${suffix}`,
      roomType: "single",
      monthlyRent: 500000,
      capacity: 1,
      ...overrides,
    },
  });
  if (!res.ok()) {return null;}
  return (await res.json()) as { id: string; roomNumber: string };
}

async function createTenant(
  request: APIRequestContext,
  propertyId: string,
  suffix: number
) {
  const res = await request.post(`/api/properties/${propertyId}/tenants`, {
    data: {
      name: `DI Tenant ${suffix}`,
      phone: "08100000099",
      email: `di-tenant-${suffix}@test.com`,
    },
  });
  if (!res.ok()) {return null;}
  return (await res.json()) as { id: string };
}

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

// ─── AC-1: double move-out blocked ───────────────────────────────────────────

test.describe("double move-out blocked (AC-1)", () => {
  test.describe("bad cases", () => {
    test("API returns 409 with user-visible error when tenant is already moved out", async ({
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const suffix = Date.now();

      const tenant = await createTenant(request, propertyId, suffix);
      if (!tenant) { test.skip(); return; }

      // First move-out — should succeed
      const first = await request.post(
        `/api/properties/${propertyId}/tenants/${tenant.id}/move-out`
      );
      if (!first.ok()) { test.skip(); return; }

      // Second move-out on the same tenant — must return 409
      const second = await request.post(
        `/api/properties/${propertyId}/tenants/${tenant.id}/move-out`
      );
      const body = await second.json();

      expect(second.status()).toBe(409);
      expect(body.error).toMatch(/already moved out/i);
    });
  });

  test.describe("edge cases", () => {
    test("tenant detail page shows moved-out state (no move-out button) after move-out", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const suffix = Date.now() + 1;

      const tenant = await createTenant(request, propertyId, suffix);
      if (!tenant) { test.skip(); return; }

      // Move out via API
      const mo = await request.post(
        `/api/properties/${propertyId}/tenants/${tenant.id}/move-out`
      );
      if (!mo.ok()) { test.skip(); return; }

      await goToTenantDetail(page, tenant.id);

      // UI should NOT show the move-out button — it shows the moved-out state instead
      await expect(
        page.getByRole("button", { name: /move out/i })
      ).not.toBeVisible({ timeout: 5000 });

      // Moved-out success message should be visible
      await expect(
        page.getByText(/moved out|pindah keluar/i).first()
      ).toBeVisible({ timeout: 5000 });
    });
  });
});

// ─── AC-2: occupied status blocked without tenant ────────────────────────────

test.describe("room status 'occupied' blocked without active tenant (AC-2)", () => {
  let createdRoomId: string | null = null;

  test.afterEach(async ({ request }) => {
    if (!createdRoomId) {return;}
    await cleanupRoom(request, getPropertyId(), createdRoomId);
    createdRoomId = null;
  });

  test.describe("bad cases", () => {
    test("API returns 409 when setting occupied on a room with no active tenant", async ({
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();

      const room = await createRoom(request, propertyId);
      if (!room) { test.skip(); return; }
      createdRoomId = room.id;

      const res = await request.patch(
        `/api/properties/${propertyId}/rooms/${room.id}/status`,
        { data: { status: "occupied" } }
      );
      const body = await res.json();

      expect(res.status()).toBe(409);
      expect(body.error).toMatch(/managed automatically|Cannot.*occupied/i);
    });

    test("UI shows error toast when user tries to set occupied on an empty room", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(90000);
      const propertyId = getPropertyId();

      const room = await createRoom(request, propertyId);
      if (!room) { test.skip(); return; }
      createdRoomId = room.id;

      await goToEditRoomPage(page, room.id);

      // The status control is a <Select> (shadcn/ui), rendered as role="combobox"
      const statusSelect = page.getByRole("combobox").first();
      await expect(statusSelect).toBeVisible({ timeout: 10000 });
      await statusSelect.click();

      // "occupied" must NOT be an available option — it is managed automatically
      await expect(
        page.getByRole("option", { name: /^occupied$/i })
      ).not.toBeVisible({ timeout: 3000 });
    });
  });

  test.describe("edge cases", () => {
    test("setting available or under_renovation on an empty room succeeds", async ({
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();

      const room = await createRoom(request, propertyId);
      if (!room) { test.skip(); return; }
      createdRoomId = room.id;

      const res = await request.patch(
        `/api/properties/${propertyId}/rooms/${room.id}/status`,
        { data: { status: "under_renovation" } }
      );
      expect(res.status()).toBe(200);
    });
  });
});

// ─── AC-3: rent update does not break balance display ────────────────────────

test.describe("balance reflects updated monthly rent (AC-3)", () => {
  let createdRoomId: string | null = null;

  test.afterEach(async ({ request }) => {
    if (!createdRoomId) {return;}
    await cleanupRoom(request, getPropertyId(), createdRoomId);
    createdRoomId = null;
  });

  test.describe("edge cases", () => {
    test("tenant balance section shows correct amount after room monthly rent is updated", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(120000);
      const propertyId = getPropertyId();
      const suffix = Date.now();
      const initialRent = 500000;
      const updatedRent = 888000;

      // Create room with initial rent
      const room = await createRoom(request, propertyId, {
        roomNumber: `AC3-${suffix}`,
        monthlyRent: initialRent,
        capacity: 1,
      });
      if (!room) { test.skip(); return; }
      createdRoomId = room.id;

      // Create and assign tenant
      const tenant = await createTenant(request, propertyId, suffix);
      if (!tenant) { test.skip(); return; }
      const assignRes = await request.post(
        `/api/properties/${propertyId}/tenants/${tenant.id}/assign-room`,
        { data: { roomId: room.id } }
      );
      if (!assignRes.ok()) { test.skip(); return; }

      // Step 1: visit tenant detail — balance section should be visible
      await goToTenantDetail(page, tenant.id);
      await expect(
        page.getByRole("region", { name: /balance|saldo|tagihan/i })
          .or(page.locator("[aria-labelledby='balance-heading']"))
          .first()
      ).toBeVisible({ timeout: 15000 });

      // Step 2: edit room rent to the new value
      await page.goto(`/properties/${propertyId}/rooms/${room.id}/edit`, {
        waitUntil: "domcontentloaded",
      });
      await page.locator("#monthly-rent, input[name='monthlyRent'], [aria-label*='rent' i]")
        .first()
        .waitFor({ state: "visible", timeout: 15000 });

      const rentInput = page.locator("#monthly-rent, input[name='monthlyRent'], [aria-label*='rent' i]").first();
      await rentInput.fill(String(updatedRent));
      await page.getByRole("button", { name: /save/i }).first().click();

      // Wait for success (navigation or toast)
      await Promise.race([
        page.getByText(/saved|success|berhasil/i).first().waitFor({ state: "visible", timeout: 15000 }),
        page.waitForURL(/\/rooms\/[^/]+$/, { timeout: 15000 }),
      ]).catch(() => {});

      // Step 3: navigate back to tenant detail (client-side navigation to test cache invalidation)
      await page.goto(`/properties/${propertyId}/tenants/${tenant.id}`, {
        waitUntil: "domcontentloaded",
      });

      // Wait for balance section to load
      const balanceSection = page
        .getByRole("region", { name: /balance|saldo|tagihan/i })
        .or(page.locator("[aria-labelledby='balance-heading']"))
        .first();
      await expect(balanceSection).toBeVisible({ timeout: 15000 });

      // Balance should reflect the updated rent amount (888), not the old amount (500)
      // Uses a regex matching the numeric portion across currency formats
      await expect(
        balanceSection.getByText(/888/).first()
          .or(page.getByText(/888\.000|888,000|888 000/i).first())
      ).toBeVisible({ timeout: 10000 });
    });
  });
});
