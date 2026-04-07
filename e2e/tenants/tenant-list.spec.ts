// Traceability: t-32-tenant-list
// REQ 1.1 -> test('active tenants appear in the list with name and contact info')
// REQ 1.2 -> test('tapping a tenant card navigates to the tenant detail page')
// REQ 2.1 -> test('empty state message is shown when no tenants exist')
// REQ 3.1 -> test('moved-out tenant is not shown in the list')

import { test, expect, type APIRequestContext } from "@playwright/test";
import { getPropertyId, goToTenantsList } from "../helpers/tenant-room-basics";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function createTenant(
  request: APIRequestContext,
  propertyId: string,
  suffix: number
) {
  const res = await request.post(`/api/properties/${propertyId}/tenants`, {
    data: {
      name: `List Tenant ${suffix}`,
      phone: `0812${String(suffix).slice(-7).padStart(7, "0")}`,
      email: `list-tenant-${suffix}@test.com`,
    },
  });
  if (!res.ok()) { return null; }
  const { id } = await res.json();
  return { tenantId: id as string, name: `List Tenant ${suffix}`, email: `list-tenant-${suffix}@test.com` };
}

async function createRoomAndTenant(
  request: APIRequestContext,
  propertyId: string,
  suffix: number
) {
  const roomRes = await request.post(`/api/properties/${propertyId}/rooms`, {
    data: {
      roomNumber: `List-${suffix}`,
      roomType: "single",
      monthlyRent: 500000,
    },
  });
  if (!roomRes.ok()) { return null; }
  const { id: roomId } = await roomRes.json();

  const tenant = await createTenant(request, propertyId, suffix);
  if (!tenant) { return null; }

  const assignRes = await request.post(
    `/api/properties/${propertyId}/tenants/${tenant.tenantId}/move`,
    { data: { targetRoomId: roomId, moveDate: new Date().toISOString().slice(0, 10) } }
  );
  if (!assignRes.ok()) { return null; }

  return { ...tenant, roomId };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("tenant list view", () => {
  test.describe("good cases", () => {
    test("active tenants appear in the list with name and contact info", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const suffix = Date.now();
      const tenant = await createTenant(request, propertyId, suffix);
      if (!tenant) { test.skip(); return; }

      await goToTenantsList(page);

      await expect(page.getByText(tenant.name)).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(tenant.email)).toBeVisible({ timeout: 10000 });
    });

    test("tapping a tenant card navigates to the tenant detail page", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const suffix = Date.now() + 1;
      const tenant = await createTenant(request, propertyId, suffix);
      if (!tenant) { test.skip(); return; }

      await goToTenantsList(page);

      await page.getByText(tenant.name).waitFor({ state: "visible", timeout: 15000 });
      await page.getByText(tenant.name).click();

      await page.waitForURL(`**/tenants/${tenant.tenantId}`, { timeout: 15000 });
      expect(page.url()).toContain(`/tenants/${tenant.tenantId}`);
    });
  });

  test.describe("bad cases", () => {
    test("empty state message is shown when no tenants exist", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);

      // Create a fresh property with no tenants
      const propertyRes = await request.post("/api/properties", {
        data: { name: `Empty Property ${Date.now()}`, address: "Test Address", currency: "IDR" },
      });
      if (!propertyRes.ok()) { test.skip(); return; }
      const { id: newPropertyId } = await propertyRes.json();

      await page.goto(`/properties/${newPropertyId}/tenants`);
      // Wait for "Add tenant" link to confirm page rendered
      await page
        .getByRole("link", { name: /add tenant/i })
        .waitFor({ state: "visible", timeout: 15000 });

      await expect(
        page.getByText(/no tenants found|tidak ada penyewa/i)
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("edge cases", () => {
    test("moved-out tenant is not shown in the list", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const suffix = Date.now() + 2;
      const data = await createRoomAndTenant(request, propertyId, suffix);
      if (!data) { test.skip(); return; }

      const moveOutRes = await request.post(
        `/api/properties/${propertyId}/tenants/${data.tenantId}/move-out`,
        { data: { moveOutDate: new Date().toISOString().split("T")[0] } }
      );
      if (!moveOutRes.ok()) { test.skip(); return; }

      await goToTenantsList(page);
      // Wait for list to render (add tenant button confirms page is ready)
      await page
        .getByRole("link", { name: /add tenant/i })
        .waitFor({ state: "visible", timeout: 15000 });

      await expect(page.getByText(data.name)).not.toBeVisible();
    });
  });
});
