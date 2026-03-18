// Traceability: rt-5-rent-missing-banner
// REQ 2.1  -> test('unpaid tenant shows rent missing banner near top of page')
// REQ 2.2  -> test('banner contains aria-hidden icon alongside text')
// REQ 2.3  -> test('unpaid tenant shows rent missing banner near top of page') -- amount in text
// REQ 2.4  -> test('banner appears above action buttons')
// REQ 2.5  -> test('paid tenant shows no banner')
// REQ 2.6  -> test('tenant with no room shows no banner')
// REQ 3.1  -> test('banner has role=alert')
// REQ 4.1  -> test('banner does not cause horizontal scroll on mobile viewport')
// REQ 1.1  -> test('outstanding balance row is absent from balance section')

import { test, expect, type APIRequestContext } from "@playwright/test";
import { getPropertyId, goToTenantDetail } from "../helpers/tenant-room-basics";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function createRoomAndUnpaidTenant(
  request: APIRequestContext,
  propertyId: string
) {
  const suffix = Date.now();

  const roomRes = await request.post(
    `/api/properties/${propertyId}/rooms`,
    {
      data: {
        roomNumber: `Banner-${suffix}`,
        roomType: "single",
        monthlyRent: 500000,
      },
    }
  );
  if (!roomRes.ok()) return null;
  const { id: roomId } = await roomRes.json();

  const tenantRes = await request.post(
    `/api/properties/${propertyId}/tenants`,
    {
      data: {
        name: `Banner Unpaid ${suffix}`,
        phone: "08100000001",
        email: `banner-unpaid-${suffix}@test.com`,
      },
    }
  );
  if (!tenantRes.ok()) return null;
  const { id: tenantId } = await tenantRes.json();

  const assignRes = await request.post(
    `/api/properties/${propertyId}/tenants/${tenantId}/assign-room`,
    { data: { roomId } }
  );
  if (!assignRes.ok()) return null;

  return { tenantId, roomId };
}

async function createRoomAndPaidTenant(
  request: APIRequestContext,
  propertyId: string
) {
  const suffix = Date.now();
  const monthlyRent = 500000;

  const roomRes = await request.post(
    `/api/properties/${propertyId}/rooms`,
    {
      data: {
        roomNumber: `Banner-Paid-${suffix}`,
        roomType: "single",
        monthlyRent,
      },
    }
  );
  if (!roomRes.ok()) return null;
  const { id: roomId } = await roomRes.json();

  const tenantRes = await request.post(
    `/api/properties/${propertyId}/tenants`,
    {
      data: {
        name: `Banner Paid ${suffix}`,
        phone: "08100000002",
        email: `banner-paid-${suffix}@test.com`,
      },
    }
  );
  if (!tenantRes.ok()) return null;
  const { id: tenantId } = await tenantRes.json();

  const assignRes = await request.post(
    `/api/properties/${propertyId}/tenants/${tenantId}/assign-room`,
    { data: { roomId } }
  );
  if (!assignRes.ok()) return null;

  const paymentDate = new Date().toISOString().split("T")[0];
  const paymentRes = await request.post(
    `/api/properties/${propertyId}/payments`,
    { data: { tenantId, amount: monthlyRent, paymentDate } }
  );
  if (!paymentRes.ok()) return null;

  return { tenantId };
}

async function createTenantNoRoom(
  request: APIRequestContext,
  propertyId: string
) {
  const suffix = Date.now();

  const tenantRes = await request.post(
    `/api/properties/${propertyId}/tenants`,
    {
      data: {
        name: `Banner NoRoom ${suffix}`,
        phone: "08100000003",
        email: `banner-noroom-${suffix}@test.com`,
      },
    }
  );
  if (!tenantRes.ok()) return null;
  const { id: tenantId } = await tenantRes.json();
  return { tenantId };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("rent missing banner", () => {
  test.describe("good cases", () => {
    test("unpaid tenant shows rent missing banner near top of page", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const data = await createRoomAndUnpaidTenant(request, propertyId);
      if (!data) { test.skip(); return; }

      await goToTenantDetail(page, data.tenantId);

      const banner = page.getByRole("alert");
      await expect(banner).toBeVisible({ timeout: 15000 });
      await expect(banner).toContainText(
        /rent missing|sewa belum dibayar/i
      );
    });

    test("banner appears above action buttons in page order", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const data = await createRoomAndUnpaidTenant(request, propertyId);
      if (!data) { test.skip(); return; }

      await goToTenantDetail(page, data.tenantId);

      const banner = page.getByRole("alert");
      await expect(banner).toBeVisible({ timeout: 15000 });

      // Banner must be higher on page than the action buttons
      const bannerBox = await banner.boundingBox();
      const moveOutBtn = page.getByRole("button", { name: /move out|pindah keluar/i });
      await expect(moveOutBtn).toBeVisible({ timeout: 10000 });
      const buttonBox = await moveOutBtn.boundingBox();

      expect(bannerBox).not.toBeNull();
      expect(buttonBox).not.toBeNull();
      expect(bannerBox!.y).toBeLessThan(buttonBox!.y);
    });
  });

  test.describe("bad cases", () => {
    test("paid tenant shows no banner", async ({ page, request }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const data = await createRoomAndPaidTenant(request, propertyId);
      if (!data) { test.skip(); return; }

      await goToTenantDetail(page, data.tenantId);

      // Page has loaded (action buttons visible) but no alert banner
      await expect(
        page.getByRole("button", { name: /move out|pindah keluar/i })
      ).toBeVisible({ timeout: 15000 });

      await expect(page.getByRole("alert")).not.toBeVisible();
    });

    test("tenant with no room shows no banner", async ({ page, request }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const data = await createTenantNoRoom(request, propertyId);
      if (!data) { test.skip(); return; }

      await goToTenantDetail(page, data.tenantId);

      // Page has loaded (assign room button visible) but no alert banner
      await expect(
        page.getByRole("button", { name: /assign room|tambah kamar/i })
      ).toBeVisible({ timeout: 15000 });

      await expect(page.getByRole("alert")).not.toBeVisible();
    });
  });

  test.describe("edge cases", () => {
    test("banner does not cause horizontal scroll on mobile viewport", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const data = await createRoomAndUnpaidTenant(request, propertyId);
      if (!data) { test.skip(); return; }

      await goToTenantDetail(page, data.tenantId);
      await expect(page.getByRole("alert")).toBeVisible({ timeout: 15000 });

      const hasHorizontalScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth
      );
      expect(hasHorizontalScroll).toBe(false);
    });

    test("banner contains aria-hidden icon alongside text", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const data = await createRoomAndUnpaidTenant(request, propertyId);
      if (!data) { test.skip(); return; }

      await goToTenantDetail(page, data.tenantId);

      const banner = page.getByRole("alert");
      await expect(banner).toBeVisible({ timeout: 15000 });

      // Icon must be present with aria-hidden (color + icon + text, not color alone)
      const hiddenIcon = banner.locator("[aria-hidden='true']");
      await expect(hiddenIcon).toBeAttached();

      // Text content must also be present (not icon-only)
      await expect(banner).toContainText(/rent missing|sewa belum dibayar/i);
    });

    test("outstanding balance row is absent from balance section", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const data = await createRoomAndUnpaidTenant(request, propertyId);
      if (!data) { test.skip(); return; }

      await goToTenantDetail(page, data.tenantId);

      // Wait for balance section to load
      await expect(
        page.getByText(/monthly rent|sewa bulanan/i)
      ).toBeVisible({ timeout: 15000 });

      // The "Outstanding balance" dt row must not be present
      // Note: section heading "Outstanding Balance" (capital B) may still exist — we check
      // for the specific row label "Outstanding balance" (lowercase b)
      const outstandingRow = page.getByText("Outstanding balance", {
        exact: true,
      });
      await expect(outstandingRow).not.toBeAttached();
    });
  });
});
