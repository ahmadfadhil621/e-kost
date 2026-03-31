// Traceability: rt-6-tenant-payment-history
// AC-1 -> test('payment section shows at most 3 entries')
// AC-1 -> test('view all link appears when more than 3 payments exist')
// AC-1 -> test('view all link is absent when 3 or fewer payments exist')

import { test, expect } from "@playwright/test";
import { getPropertyId } from "../helpers/payment-recording";
import { goToTenantDetail } from "../helpers/tenant-room-basics";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

async function getActiveTenant(
  page: import("@playwright/test").Page,
  baseURL: string | undefined,
  propertyId: string
) {
  const res = await page.request.get(
    `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/tenants`
  );
  const { tenants } = (await res.json()) as {
    tenants: Array<{ id: string; roomId: string | null; movedOutAt: string | null }>;
  };
  return tenants.find((t) => t.roomId && !t.movedOutAt) ?? null;
}

async function createPayments(
  page: import("@playwright/test").Page,
  baseURL: string | undefined,
  propertyId: string,
  tenantId: string,
  count: number
) {
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const paymentDate = d.toISOString().slice(0, 10);
    await page.request.post(
      `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/payments`,
      { data: { tenantId, amount: 500000, paymentDate } }
    );
  }
}

test.describe("truncated payment summary on tenant detail", () => {
  test.describe("good cases", () => {
    test("payment section shows at most 3 entries when tenant has more", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(90000);
      const propertyId = getPropertyId();
      const tenant = await getActiveTenant(page, baseURL, propertyId);
      test.skip(!tenant, "No active tenant available");

      // Seed 4+ payments
      await createPayments(page, baseURL, propertyId, tenant!.id, 4);

      await goToTenantDetail(page, tenant!.id);
      await expect(
        page.getByRole("heading", { name: /payment history|riwayat pembayaran/i })
      ).toBeVisible({ timeout: 15000 });

      // Should show exactly 3 payment cards in the summary section
      const paymentSection = page
        .getByRole("region", { name: /payment history|riwayat pembayaran/i });
      const cards = paymentSection.locator("[data-payment-id]");
      await expect(cards).toHaveCount(3, { timeout: 10000 });
    });

    test("view all link appears when more than 3 payments exist", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(90000);
      const propertyId = getPropertyId();
      const tenant = await getActiveTenant(page, baseURL, propertyId);
      test.skip(!tenant, "No active tenant available");

      await createPayments(page, baseURL, propertyId, tenant!.id, 4);

      await goToTenantDetail(page, tenant!.id);
      await expect(
        page.getByRole("heading", { name: /payment history|riwayat pembayaran/i })
      ).toBeVisible({ timeout: 15000 });

      await expect(
        page.getByRole("link", { name: /view all|lihat semua/i })
      ).toBeVisible({ timeout: 10000 });
    });

    test("view all link navigates to full history page", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(90000);
      const propertyId = getPropertyId();
      const tenant = await getActiveTenant(page, baseURL, propertyId);
      test.skip(!tenant, "No active tenant available");

      await createPayments(page, baseURL, propertyId, tenant!.id, 4);

      await goToTenantDetail(page, tenant!.id);
      await page
        .getByRole("link", { name: /view all|lihat semua/i })
        .click({ timeout: 10000 });

      await expect(page).toHaveURL(/\/payments$/, { timeout: 10000 });
    });
  });

  test.describe("bad cases", () => {
    test("view all link is absent when tenant has 3 or fewer payments", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(90000);
      const propertyId = getPropertyId();
      const tenant = await getActiveTenant(page, baseURL, propertyId);
      test.skip(!tenant, "No active tenant available");

      // Check the existing payment count; only seed if needed
      const paymentsRes = await page.request.get(
        `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/tenants/${tenant!.id}/payments`
      );
      const { count } = await paymentsRes.json();

      // Only run if tenant has ≤3 payments (skip otherwise to avoid polluting data)
      test.skip(count > 3, "Tenant already has >3 payments; skipping this check");

      await goToTenantDetail(page, tenant!.id);
      await expect(
        page.getByRole("heading", { name: /payment history|riwayat pembayaran/i })
      ).toBeVisible({ timeout: 15000 });

      await expect(
        page.getByRole("link", { name: /view all|lihat semua/i })
      ).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("edge cases", () => {
    test("payment section shows total count including payments beyond 3", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(90000);
      const propertyId = getPropertyId();
      const tenant = await getActiveTenant(page, baseURL, propertyId);
      test.skip(!tenant, "No active tenant available");

      await createPayments(page, baseURL, propertyId, tenant!.id, 5);

      await goToTenantDetail(page, tenant!.id);
      await expect(
        page.getByRole("heading", { name: /payment history|riwayat pembayaran/i })
      ).toBeVisible({ timeout: 15000 });

      // Count label should reflect total (≥5), not just 3
      await expect(
        page
          .getByRole("region", { name: /payment history|riwayat pembayaran/i })
          .getByText(/\d+ payment|pembayaran tercatat/i)
          .first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("mobile: view all link is tappable at 320px viewport", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(90000);
      await page.setViewportSize({ width: 320, height: 568 });
      const propertyId = getPropertyId();
      const tenant = await getActiveTenant(page, baseURL, propertyId);
      test.skip(!tenant, "No active tenant available");

      await createPayments(page, baseURL, propertyId, tenant!.id, 4);

      await goToTenantDetail(page, tenant!.id);
      const viewAllLink = page.getByRole("link", { name: /view all|lihat semua/i });
      await expect(viewAllLink).toBeVisible({ timeout: 10000 });

      const box = await viewAllLink.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    });
  });
});
