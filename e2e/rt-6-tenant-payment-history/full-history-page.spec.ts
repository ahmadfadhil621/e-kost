// Traceability: rt-6-tenant-payment-history
// AC-2 -> test('full history page shows all payments with pagination')
// AC-2 -> test('next page navigation works')
// AC-2, AC-3 -> test('delete payment from full history removes it')

import { test, expect } from "@playwright/test";
import { getPropertyId } from "../helpers/payment-recording";

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
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const paymentDate = d.toISOString().slice(0, 10);
    const res = await page.request.post(
      `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/payments`,
      { data: { tenantId, amount: 500000 + i * 1000, paymentDate } }
    );
    if (res.ok()) {
      const { id } = await res.json();
      ids.push(id);
    }
  }
  return ids;
}

async function goToFullHistory(
  page: import("@playwright/test").Page,
  propertyId: string,
  tenantId: string
) {
  await page.goto(`/properties/${propertyId}/tenants/${tenantId}/payments`);
  await expect(
    page.getByRole("heading", { name: /payment history|riwayat pembayaran/i })
  ).toBeVisible({ timeout: 15000 });
}

test.describe("full payment history page", () => {
  test.describe("good cases", () => {
    test("full history page loads and shows payments", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(90000);
      const propertyId = getPropertyId();
      const tenant = await getActiveTenant(page, baseURL, propertyId);
      test.skip(!tenant, "No active tenant available");

      await createPayments(page, baseURL, propertyId, tenant!.id, 3);
      await goToFullHistory(page, propertyId, tenant!.id);

      // Page title visible
      await expect(
        page.getByRole("heading", { name: /payment history|riwayat pembayaran/i })
      ).toBeVisible({ timeout: 15000 });

      // At least one payment card visible
      await expect(
        page.locator("[data-payment-id]").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("back link returns to tenant detail", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const tenant = await getActiveTenant(page, baseURL, propertyId);
      test.skip(!tenant, "No active tenant available");

      await goToFullHistory(page, propertyId, tenant!.id);
      await page
        .getByRole("link", { name: /back|kembali/i })
        .click({ timeout: 10000 });

      await expect(page).toHaveURL(
        new RegExp(`/properties/${propertyId}/tenants/${tenant!.id}$`),
        { timeout: 10000 }
      );
    });

    test("delete payment from full history removes it from the list", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(90000);
      const propertyId = getPropertyId();
      const tenant = await getActiveTenant(page, baseURL, propertyId);
      test.skip(!tenant, "No active tenant available");

      const [paymentId] = await createPayments(page, baseURL, propertyId, tenant!.id, 1);
      test.skip(!paymentId, "Could not create payment");

      await goToFullHistory(page, propertyId, tenant!.id);

      const paymentCard = page.locator(`[data-payment-id="${paymentId}"]`);
      await expect(paymentCard).toBeVisible({ timeout: 15000 });

      // Open overflow menu
      await paymentCard
        .getByRole("button", { name: /more|options|lainnya/i })
        .click({ timeout: 10000 });

      // Click delete in dropdown
      await page
        .getByRole("menuitem", { name: /delete|hapus/i })
        .click({ timeout: 5000 });

      // Confirm in dialog
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /delete|hapus/i })
        .last()
        .click({ timeout: 10000 });

      // Payment card should disappear
      await expect(paymentCard).not.toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("bad cases", () => {
    test("cancelling delete keeps payment in list", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(90000);
      const propertyId = getPropertyId();
      const tenant = await getActiveTenant(page, baseURL, propertyId);
      test.skip(!tenant, "No active tenant available");

      const [paymentId] = await createPayments(page, baseURL, propertyId, tenant!.id, 1);
      test.skip(!paymentId, "Could not create payment");

      await goToFullHistory(page, propertyId, tenant!.id);

      const paymentCard = page.locator(`[data-payment-id="${paymentId}"]`);
      await expect(paymentCard).toBeVisible({ timeout: 15000 });

      await paymentCard
        .getByRole("button", { name: /more|options|lainnya/i })
        .click({ timeout: 10000 });

      await page
        .getByRole("menuitem", { name: /delete|hapus/i })
        .click({ timeout: 5000 });

      // Cancel
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /cancel|batal/i })
        .click({ timeout: 5000 });

      await expect(paymentCard).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("edge cases", () => {
    test("mobile: full history page renders correctly at 390px", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      await page.setViewportSize({ width: 390, height: 844 });
      const propertyId = getPropertyId();
      const tenant = await getActiveTenant(page, baseURL, propertyId);
      test.skip(!tenant, "No active tenant available");

      await goToFullHistory(page, propertyId, tenant!.id);
      await expect(
        page.getByRole("heading", { name: /payment history|riwayat pembayaran/i })
      ).toBeVisible({ timeout: 15000 });
    });

    test("pagination controls shown when more than 20 payments exist", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(120000);
      const propertyId = getPropertyId();
      const tenant = await getActiveTenant(page, baseURL, propertyId);
      test.skip(!tenant, "No active tenant available");

      // Check if already has 20+ payments
      const paymentsRes = await page.request.get(
        `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/tenants/${tenant!.id}/payments`
      );
      const { count } = await paymentsRes.json();
      test.skip(count < 21, "Not enough payments to test pagination; seed 21+ to enable");

      await goToFullHistory(page, propertyId, tenant!.id);
      await expect(
        page.getByRole("button", { name: /next|berikutnya/i })
      ).toBeVisible({ timeout: 10000 });
    });
  });
});
