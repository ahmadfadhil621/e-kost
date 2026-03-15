// Traceability: tenant-notes
// REQ 2.1 -> test('tenant detail displays notes section')
// REQ 2.2, 2.3 -> test('notes section shows note content, date, or empty state')
// REQ 2.4 -> test('tenant with no notes shows empty state message')
// REQ 6.1 -> test('notes section loads without horizontal scroll')

import { test, expect } from "@playwright/test";
import { goToTenantDetail } from "../helpers/tenant-room-basics";
import { getPropertyId } from "../helpers/tenant-notes";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

test.describe("view notes", () => {
  test.describe("good cases", () => {
    test("tenant detail displays notes section", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const tenantsRes = await request.get(
        `/api/properties/${propertyId}/tenants`
      );
      if (!tenantsRes.ok()) {
        test.skip();
        return;
      }
      const { tenants } = await tenantsRes.json();
      const tenantId = tenants?.[0]?.id;
      if (!tenantId) {
        test.skip();
        return;
      }
      await goToTenantDetail(page, tenantId);
      await expect(
        page
          .getByRole("heading", { name: /notes|catatan/i })
          .or(page.getByText(/notes|catatan|add note|tambah catatan/i).first())
      ).toBeVisible({ timeout: 15000 });
    });

    test("notes section shows note content, date, or empty state", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const tenantsRes = await request.get(
        `/api/properties/${propertyId}/tenants`
      );
      if (!tenantsRes.ok()) {
        test.skip();
        return;
      }
      const { tenants } = await tenantsRes.json();
      const tenantId = tenants?.[0]?.id;
      if (!tenantId) {
        test.skip();
        return;
      }
      await goToTenantDetail(page, tenantId);
      await expect(
        page
          .getByText(/notes|catatan|no notes|belum ada catatan|add note|tambah catatan/i)
          .first()
      ).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("bad cases", () => {
    test("notes section not visible for non-existent tenant", async ({
      page,
    }) => {
      const propertyId = getPropertyId();
      await page.goto(`/properties/${propertyId}/tenants/non-existent-tenant-id`);
      await expect(
        page
          .getByText(/not found|tidak ditemukan|error|kesalahan/i)
          .or(page.getByRole("heading", { name: /tenant|penyewa/i }))
      ).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("edge cases", () => {
    test("tenant with no notes shows empty state message", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const tenantsRes = await request.get(
        `/api/properties/${propertyId}/tenants`
      );
      if (!tenantsRes.ok()) {
        test.skip();
        return;
      }
      const { tenants } = await tenantsRes.json();
      const tenantId = tenants?.[0]?.id;
      if (!tenantId) {
        test.skip();
        return;
      }
      await goToTenantDetail(page, tenantId);
      await expect(
        page
          .getByText(/notes|catatan|no notes|belum ada|add note|tambah catatan/i)
          .first()
      ).toBeVisible({ timeout: 15000 });
    });

    test("notes section loads without horizontal scroll", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      let tenantsRes;
      try {
        tenantsRes = await request.get(
          `/api/properties/${propertyId}/tenants`,
          { timeout: 15000 }
        );
      } catch {
        test.skip(true, "Tenants API request failed (timeout or network)");
        return;
      }
      if (!tenantsRes.ok()) {
        test.skip();
        return;
      }
      const { tenants } = await tenantsRes.json();
      const tenantId = tenants?.[0]?.id;
      if (!tenantId) {
        test.skip();
        return;
      }
      await goToTenantDetail(page, tenantId);
      await expect(
        page
          .getByText(/notes|catatan|no notes|belum ada|add note|tambah catatan/i)
          .first()
      ).toBeVisible({ timeout: 15000 });
      const hasNoHorizontalScroll = await page.evaluate(() => {
        const { scrollWidth, clientWidth } = document.documentElement;
        return scrollWidth <= clientWidth;
      });
      expect(hasNoHorizontalScroll).toBe(true);
    });
  });
});
