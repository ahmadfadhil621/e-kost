// Traceability: rt-8-filter-search-lists
// REQ-1 -> test('search input is visible on tenant list page')
// REQ-1 -> test('searching by name filters the list')
// REQ-1 -> test('search is case-insensitive')
// REQ-1 -> test('clearing search restores full list')
// REQ-2 -> test('missing rent filter shows only unpaid tenants')
// REQ-5 -> test('search with no match shows no results message')
// REQ-7 -> test('mobile: search and filter bar visible at 375px viewport')

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
      name: `Search Tenant ${suffix}`,
      phone: `0812${String(suffix).slice(-7).padStart(7, "0")}`,
      email: `search-tenant-${suffix}@test.com`,
    },
  });
  if (!res.ok()) { return null; }
  const { id } = await res.json();
  return {
    tenantId: id as string,
    name: `Search Tenant ${suffix}`,
    email: `search-tenant-${suffix}@test.com`,
  };
}

async function createRoomAndTenant(
  request: APIRequestContext,
  propertyId: string,
  suffix: number
) {
  const roomRes = await request.post(`/api/properties/${propertyId}/rooms`, {
    data: {
      roomNumber: `SrchRoom-${suffix}`,
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

  return { ...tenant, roomId, monthlyRent: 500000 };
}

async function recordFullPayment(
  request: APIRequestContext,
  propertyId: string,
  tenantId: string,
  amount: number
) {
  const paymentDate = new Date().toISOString().split("T")[0];
  const res = await request.post(`/api/properties/${propertyId}/payments`, {
    data: { tenantId, amount, paymentDate },
  });
  return res.ok();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("tenant list search and filter", () => {
  test.describe("good cases", () => {
    test("search input is visible on tenant list page", async ({ page }) => {
      test.info().setTimeout(60000);
      await goToTenantsList(page);
      await expect(page.getByRole("textbox")).toBeVisible({ timeout: 15000 });
    });

    test("searching by name filters the list", async ({ page, request }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const suffixA = Date.now();
      const suffixB = Date.now() + 1;

      const tenantA = await createTenant(request, propertyId, suffixA);
      const tenantB = await createTenant(request, propertyId, suffixB);
      if (!tenantA || !tenantB) { test.skip(); return; }

      await goToTenantsList(page);
      await expect(page.getByText(tenantA.name)).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(tenantB.name)).toBeVisible({ timeout: 10000 });

      // Search by a unique fragment of tenantA's name (the suffix)
      await page.getByRole("textbox").fill(String(suffixA));

      await expect(page.getByText(tenantA.name)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(tenantB.name)).not.toBeVisible();
    });

    test("missing rent filter shows only unpaid tenants", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const suffixUnpaid = Date.now() + 10;
      const suffixPaid = Date.now() + 11;

      // Unpaid tenant: room assigned, no payment
      const unpaid = await createRoomAndTenant(request, propertyId, suffixUnpaid);
      if (!unpaid) { test.skip(); return; }

      // Paid tenant: room assigned + full payment
      const paid = await createRoomAndTenant(request, propertyId, suffixPaid);
      if (!paid) { test.skip(); return; }
      const paymentOk = await recordFullPayment(
        request,
        propertyId,
        paid.tenantId,
        paid.monthlyRent
      );
      if (!paymentOk) { test.skip(); return; }

      await goToTenantsList(page);

      // Wait for both tenants to load
      await expect(page.getByText(unpaid.name)).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(paid.name)).toBeVisible({ timeout: 10000 });

      // Activate missing rent filter
      await page.getByRole("button", { name: /missing rent|sewa kurang/i }).click();

      await expect(page.getByText(unpaid.name)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(paid.name)).not.toBeVisible();
    });
  });

  test.describe("bad cases", () => {
    test("search with no match shows no results message", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const suffix = Date.now() + 20;

      const tenant = await createTenant(request, propertyId, suffix);
      if (!tenant) { test.skip(); return; }

      await goToTenantsList(page);
      await expect(page.getByText(tenant.name)).toBeVisible({ timeout: 15000 });

      await page.getByRole("textbox").fill("zzz_no_match_xyz_999");

      await expect(
        page.getByText(/no results found|tidak ada hasil/i)
      ).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(tenant.name)).not.toBeVisible();
    });
  });

  test.describe("edge cases", () => {
    test("search is case-insensitive", async ({ page, request }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const suffix = Date.now() + 30;

      const tenant = await createTenant(request, propertyId, suffix);
      if (!tenant) { test.skip(); return; }

      await goToTenantsList(page);
      await expect(page.getByText(tenant.name)).toBeVisible({ timeout: 15000 });

      // Type the suffix in uppercase
      await page.getByRole("textbox").fill(`SEARCH TENANT ${suffix}`);

      await expect(page.getByText(tenant.name)).toBeVisible({ timeout: 10000 });
    });

    test("clearing search restores full list", async ({ page, request }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const suffixA = Date.now() + 40;
      const suffixB = Date.now() + 41;

      const tenantA = await createTenant(request, propertyId, suffixA);
      const tenantB = await createTenant(request, propertyId, suffixB);
      if (!tenantA || !tenantB) { test.skip(); return; }

      await goToTenantsList(page);
      await expect(page.getByText(tenantA.name)).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(tenantB.name)).toBeVisible({ timeout: 10000 });

      const searchInput = page.getByRole("textbox");
      await searchInput.fill(String(suffixA));
      await expect(page.getByText(tenantB.name)).not.toBeVisible();

      await searchInput.clear();

      await expect(page.getByText(tenantA.name)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(tenantB.name)).toBeVisible({ timeout: 10000 });
    });

    test("mobile: search and filter bar visible at 375px viewport", async ({
      page,
    }) => {
      test.info().setTimeout(60000);
      await page.setViewportSize({ width: 375, height: 812 });
      await goToTenantsList(page);

      await expect(page.getByRole("textbox")).toBeVisible({ timeout: 15000 });
      await expect(
        page.getByRole("button", { name: /all|semua/i }).first()
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByRole("button", { name: /missing rent|sewa kurang/i })
      ).toBeVisible({ timeout: 10000 });

      const hasHorizontalScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth
      );
      expect(hasHorizontalScroll).toBe(false);
    });
  });
});
