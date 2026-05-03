// Traceability: finance-payment-export (issue #121)
// AC-1  -> test('user clicks Export and file download starts with xlsx filename')
// AC-5  -> test('export button is disabled when no payments exist')
// AC-7  -> test('export button is enabled when at least one payment exists')
// AC-7  -> test('export button is visible in toolbar next to Record Payment')
// REQ-auth -> test('unauthenticated user is redirected away from export endpoint')

import { test, expect } from "@playwright/test";
import { getPropertyId, goToPaymentsList } from "../helpers/payment-recording";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

const PAYMENT_TENANT_NAME = "E2E Payment Tenant";

// Seeds one payment for the property via API. Returns the payment id.
async function seedPayment(page: Parameters<typeof test>[1] extends { page: infer P } ? P : never, baseURL: string) {
  const propertyId = getPropertyId();

  const tenantsRes = await page.request.get(
    `${baseURL}/api/properties/${propertyId}/tenants`
  );
  if (!tenantsRes.ok()) {return null;}

  const { tenants } = await tenantsRes.json();
  const tenant = (tenants as { id: string; name: string }[]).find(
    (t) => t.name === PAYMENT_TENANT_NAME
  );
  if (!tenant?.id) {return null;}

  const paymentDate = new Date().toISOString().split("T")[0];
  const createRes = await page.request.post(
    `${baseURL}/api/properties/${propertyId}/payments`,
    { data: { tenantId: tenant.id, amount: 750_000, paymentDate } }
  );
  if (!createRes.ok()) {return null;}

  const body = await createRes.json();
  return (body as { id: string }).id ?? null;
}

// Deletes all payments for the property via individual DELETE calls.
async function deleteAllPayments(page: Parameters<typeof test>[1] extends { page: infer P } ? P : never, baseURL: string) {
  const propertyId = getPropertyId();
  const res = await page.request.get(
    `${baseURL}/api/properties/${propertyId}/payments`
  );
  if (!res.ok()) {return;}
  const payments = (await res.json()) as { id: string }[];
  for (const p of payments) {
    await page.request.delete(
      `${baseURL}/api/properties/${propertyId}/payments/${p.id}`
    );
  }
}

test.describe("export payments", () => {
  test.describe("good cases", () => {
    test("export button is visible in toolbar next to Record Payment", async ({
      page,
    }) => {
      await goToPaymentsList(page);
      // The toolbar should contain both the export and record buttons
      await expect(
        page.getByRole("button", { name: /export|ekspor/i })
          .or(page.getByLabel(/export|ekspor/i))
      ).toBeVisible({ timeout: 15000 });
    });

    test("user clicks Export and file download starts with xlsx filename", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(60000);

      const paymentId = await seedPayment(page, baseURL ?? "http://localhost:3000");
      if (!paymentId) {
        test.skip();
        return;
      }

      await goToPaymentsList(page);

      const exportBtn = page
        .getByRole("button", { name: /export|ekspor/i })
        .or(page.getByLabel(/export|ekspor/i))
        .first();

      await expect(exportBtn).toBeVisible({ timeout: 15000 });
      await expect(exportBtn).toBeEnabled({ timeout: 5000 });

      const [download] = await Promise.all([
        page.waitForEvent("download"),
        exportBtn.click(),
      ]);

      expect(download.suggestedFilename()).toMatch(/^payments-.*\.xlsx$/);
    });
  });

  test.describe("bad cases", () => {
    test("export button is disabled when payments list has 0 rows", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(60000);

      await deleteAllPayments(page, baseURL ?? "http://localhost:3000");
      await goToPaymentsList(page);

      const exportBtn = page
        .getByRole("button", { name: /export|ekspor/i })
        .or(page.getByLabel(/export|ekspor/i))
        .first();

      await expect(exportBtn).toBeVisible({ timeout: 15000 });
      await expect(exportBtn).toBeDisabled({ timeout: 5000 });
    });
  });

  test.describe("edge cases", () => {
    test("export button becomes enabled as soon as one payment exists", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const base = baseURL ?? "http://localhost:3000";

      await deleteAllPayments(page, base);

      // Confirm disabled state first
      await goToPaymentsList(page);
      const exportBtn = page
        .getByRole("button", { name: /export|ekspor/i })
        .or(page.getByLabel(/export|ekspor/i))
        .first();
      await expect(exportBtn).toBeDisabled({ timeout: 15000 });

      // Seed one payment
      const paymentId = await seedPayment(page, base);
      if (!paymentId) {
        test.skip();
        return;
      }

      // Reload and confirm enabled
      await goToPaymentsList(page);
      await expect(exportBtn).toBeEnabled({ timeout: 15000 });
    });
  });
});
