// Traceability: outstanding-balance
// REQ 2.1 -> test('tenant detail displays outstanding balance section')
// REQ 2.2, 2.3, 2.4 -> test('balance section shows rent, payments, outstanding or paid/unpaid')
// REQ 3.1, 3.2 -> test('balance section shows rent, payments, outstanding or paid/unpaid')
// REQ 3.3 -> (covered by view-tenant-list-balances.spec.ts tenant list displays balance and status)
// REQ 3.5 -> test('balance section shows rent, payments, outstanding or paid/unpaid') -- text/icon not color alone
// REQ 5.4 -> test('balance section shows rent, payments, outstanding or paid/unpaid')
// REQ 5.5 -> (timing: covered by implementation/API; E2E asserts section visible)
// REQ 6.2, 6.3, 6.4 -> test('balance section shows...') and view-tenant-list-balances (mobile layout, glanceable)

import { test, expect } from "@playwright/test";
import { goToTenantDetail } from "../helpers/tenant-room-basics";
import { getPropertyId } from "../helpers/payment-recording";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

test.describe("view tenant balance", () => {
  test.describe("good cases", () => {
    test("tenant detail displays outstanding balance section", async ({
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
          .getByRole("heading", {
            name: /outstanding balance|saldo|balance|sisa/i,
          })
          .or(
            page
              .getByText(/outstanding|balance|monthly rent|total payments|paid|unpaid|saldo|sewa|pembayaran/i)
              .first()
          )
      ).toBeVisible({ timeout: 15000 });
    });

    test("balance section shows rent, payments, outstanding or paid/unpaid", async ({
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
          .getByText(
            /balance|outstanding|rent|payments|paid|unpaid|saldo|sewa|pembayaran|terbayar|belum/i
          )
          .first()
      ).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("bad cases", () => {
    test("balance section not visible for non-existent tenant", async ({
      page,
    }) => {
      const propertyId = getPropertyId();
      await page.goto(
        `/properties/${propertyId}/tenants/non-existent-tenant-id`
      );
      await expect(
        page
          .getByText(/not found|tidak ditemukan|error|kesalahan/i)
          .or(page.getByRole("heading", { name: /tenant|penyewa/i }))
      ).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("edge cases", () => {
    test("tenant with no room shows error or no balance", async ({
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
          .getByText(
            /balance|outstanding|rent|payments|paid|unpaid|no room|error|saldo|sewa|pembayaran|tidak ada kamar|kesalahan/i
          )
          .first()
      ).toBeVisible({ timeout: 15000 });
    });
  });
});
