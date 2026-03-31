// Traceability: tenant-record-payment-entry (issue #88)
// AC-1 -> test('Record Payment link is visible in TenantPaymentSection for an active tenant')
// AC-3 -> test('Clicking Record Payment navigates to /payments/new with tenantId in URL')
// AC-4 -> test('Payment form has tenant pre-selected after navigating via Record Payment link')
// AC-2 -> test('Record Payment link is NOT visible for a moved-out tenant')
// AC-5, AC-6 -> test('Record Payment link has accessible name and minimum touch target')

import { test, expect } from "@playwright/test";
import { getPropertyId, goToTenantDetail } from "../helpers/tenant-room-basics";
import { getMovedOutTenantSetup } from "../helpers/tenant-notes";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

async function getActiveTenant(
  page: import("@playwright/test").Page,
  baseURL: string | undefined,
  propertyId: string
): Promise<{ id: string; name: string } | null> {
  const res = await page.request.get(
    `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/tenants`
  );
  if (!res.ok()) { return null; }
  const { tenants } = (await res.json()) as {
    tenants: Array<{ id: string; name: string; roomId: string | null; movedOutAt: string | null }>;
  };
  return tenants.find((t) => t.roomId && !t.movedOutAt) ?? null;
}

test.describe("record payment entry from tenant detail", () => {
  test.describe("good cases", () => {
    test("Record Payment link is visible in TenantPaymentSection for an active tenant", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const tenant = await getActiveTenant(page, baseURL, propertyId);
      test.skip(!tenant, "No active tenant available");

      await goToTenantDetail(page, tenant!.id);

      await expect(
        page.getByRole("heading", { name: /payment history|riwayat pembayaran/i })
      ).toBeVisible({ timeout: 15000 });

      await expect(
        page.getByRole("link", { name: /record payment|catat pembayaran/i })
      ).toBeVisible({ timeout: 10000 });
    });

    test("Clicking Record Payment navigates to /payments/new with tenantId in URL", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const tenant = await getActiveTenant(page, baseURL, propertyId);
      test.skip(!tenant, "No active tenant available");

      await goToTenantDetail(page, tenant!.id);

      await expect(
        page.getByRole("link", { name: /record payment|catat pembayaran/i })
      ).toBeVisible({ timeout: 15000 });

      await page
        .getByRole("link", { name: /record payment|catat pembayaran/i })
        .click({ timeout: 10000 });

      await expect(page).toHaveURL(
        new RegExp(`/payments/new\\?tenantId=${tenant!.id}`),
        { timeout: 15000 }
      );
    });

    test("Payment form has tenant pre-selected after navigating via Record Payment link", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const tenant = await getActiveTenant(page, baseURL, propertyId);
      test.skip(!tenant, "No active tenant available");

      await goToTenantDetail(page, tenant!.id);

      await expect(
        page.getByRole("link", { name: /record payment|catat pembayaran/i })
      ).toBeVisible({ timeout: 15000 });

      await page
        .getByRole("link", { name: /record payment|catat pembayaran/i })
        .click({ timeout: 10000 });

      await expect(page).toHaveURL(/\/payments\/new/, { timeout: 15000 });

      // Tenant select trigger should show tenant name, not placeholder
      const tenantSelect = page.getByRole("combobox", { name: /tenant|penyewa/i });
      await expect(tenantSelect).toBeVisible({ timeout: 15000 });
      await expect(tenantSelect).not.toHaveText(
        /select tenant|pilih penyewa/i,
        { timeout: 5000 }
      );
      await expect(tenantSelect).toContainText(tenant!.name, { timeout: 5000 });
    });
  });

  test.describe("bad cases", () => {
    test.use({ storageState: "e2e/.auth/user-with-moved-out-tenant.json" });

    test("Record Payment link is NOT visible for a moved-out tenant", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);

      // Prefer the dedicated moved-out setup file; fall back to API lookup
      const setupIds = getMovedOutTenantSetup();
      let propertyId: string;
      let movedOutTenantId: string;

      if (setupIds) {
        propertyId = setupIds.propertyId;
        movedOutTenantId = setupIds.movedOutTenantId;
      } else {
        propertyId = getPropertyId();
        const tenantsRes = await request.get(
          `/api/properties/${propertyId}/tenants?includeMovedOut=true`
        );
        if (!tenantsRes.ok()) {
          test.skip();
          return;
        }
        const { tenants } = (await tenantsRes.json()) as {
          tenants: Array<{ id: string; movedOutAt: string | null }>;
        };
        const movedOut = tenants.find((t) => t.movedOutAt !== null);
        if (!movedOut?.id) {
          test.skip();
          return;
        }
        movedOutTenantId = movedOut.id;
      }

      await goToTenantDetail(page, movedOutTenantId, propertyId);

      // Wait for the page to settle (payment history heading may or may not appear)
      await page
        .getByText(/tenant|penyewa|moved out|pindah keluar/i)
        .first()
        .waitFor({ state: "visible", timeout: 15000 });

      await expect(
        page.getByRole("link", { name: /record payment|catat pembayaran/i })
      ).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("edge cases", () => {
    test("Record Payment link has accessible name and minimum touch target", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      await page.setViewportSize({ width: 375, height: 667 });
      const propertyId = getPropertyId();
      const tenant = await getActiveTenant(page, baseURL, propertyId);
      test.skip(!tenant, "No active tenant available");

      await goToTenantDetail(page, tenant!.id);

      const recordPaymentLink = page.getByRole("link", {
        name: /record payment|catat pembayaran/i,
      });
      await expect(recordPaymentLink).toBeVisible({ timeout: 15000 });

      // Accessible name must be non-empty (role="link" with a text label satisfies this)
      const accessibleName = await recordPaymentLink.getAttribute("aria-label");
      // Either has aria-label or visible text — getByRole already validates the accessible name
      // is present; we just confirm it's not exclusively an icon with no label.
      const innerText = await recordPaymentLink.innerText();
      const hasLabel =
        (accessibleName && accessibleName.trim().length > 0) ||
        innerText.trim().length > 0;
      expect(hasLabel, "Record Payment link must have an accessible label").toBe(true);

      // Minimum touch target: 44×44px
      const box = await recordPaymentLink.boundingBox();
      if (box) {
        expect(
          box.height,
          `Touch target height ${box.height}px is below 44px minimum`
        ).toBeGreaterThanOrEqual(44);
        expect(
          box.width,
          `Touch target width ${box.width}px is below 44px minimum`
        ).toBeGreaterThanOrEqual(44);
      }
    });
  });
});
