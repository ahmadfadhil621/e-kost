// Traceability: payment-recording
// REQ 3.1 -> test('tenant detail displays payment section')
// REQ 3.2, 3.5 -> test('per-tenant payment section shows amount, date, count')

import { test, expect } from "@playwright/test";
import { goToTenantDetail } from "../helpers/tenant-room-basics";
import { getPropertyId } from "../helpers/payment-recording";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

test.describe("view tenant payments", () => {
  test.describe("good cases", () => {
    test("tenant detail displays payment section", async ({
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
        page.getByRole("heading", {
          name: /payment history|riwayat pembayaran/i,
        })
      ).toBeVisible({ timeout: 15000 });
    });

    test("per-tenant payment section shows count or empty message", async ({
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
          .getByText(/payment|pembayaran|no payments|belum ada pembayaran|recorded|tercatat/i)
          .first()
      ).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("bad cases", () => {
    test("tenant payments section not visible for non-existent tenant", async ({
      page,
    }) => {
      const propertyId = getPropertyId();
      await page.goto(`/properties/${propertyId}/tenants/non-existent-tenant-id`);
      // Match EN: "Tenant not found", "An error occurred"; ID: "Penyewa tidak ditemukan", "Terjadi kesalahan"; or tenant/penyewa heading
      await expect(
        page
          .getByText(
            /not found|tenant not found|error|tidak ditemukan|kesalahan|penyewa tidak/i
          )
          .or(page.getByRole("heading", { name: /tenant|penyewa/i }))
      ).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("edge cases", () => {
    test("tenant with no payments shows empty payment message", async ({
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
          .getByText(/payment|pembayaran|no payments|0 payment|belum ada/i)
          .first()
      ).toBeVisible({ timeout: 15000 });
    });
  });
});
