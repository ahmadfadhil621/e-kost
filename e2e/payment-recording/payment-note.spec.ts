// Traceability: issue #89 — Add optional note field to payment recording
// AC-NOTE-1 -> test('payment form shows note field pre-filled with current month rent')
// AC-NOTE-2 -> test('recording payment with note shows note on payment card')
// AC-NOTE-3 -> test('note exceeding 1000 chars shows validation error')
// AC-NOTE-4 -> test('recording payment without note succeeds')

import { test, expect } from "@playwright/test";
import { format } from "date-fns";
import { getPropertyId, goToRecordPaymentPage } from "../helpers/payment-recording";

const PAYMENT_TENANT_NAME = "E2E Payment Tenant";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

test.describe("payment note field", () => {
  test.describe("good cases", () => {
    test("payment form shows note field pre-filled with current month rent", async ({
      page,
    }) => {
      await goToRecordPaymentPage(page);

      const noteField = page.getByLabel(/note|catatan/i).first();
      await expect(noteField).toBeVisible({ timeout: 10000 });

      const expectedMonth = format(new Date(), "MMMM");
      await expect(noteField).toHaveValue(new RegExp(expectedMonth, "i"));
    });

    test("recording payment with custom note shows note on payment card", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const paymentDate = new Date().toISOString().split("T")[0];

      const tenantsRes = await page.request.get(
        `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/tenants`
      );
      test.skip(!tenantsRes.ok(), "Could not fetch tenants");
      const { tenants } = await tenantsRes.json();
      const tenant = (tenants as { id: string; name: string }[]).find(
        (t) => t.name === PAYMENT_TENANT_NAME
      );
      test.skip(!tenant?.id, "E2E Payment Tenant not found");

      const createRes = await page.request.post(
        `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/payments`,
        {
          data: { tenantId: tenant!.id, amount: 500000, paymentDate, note: "paid in cash" },
        }
      );
      expect(createRes.ok(), `Record payment failed: ${await createRes.text()}`).toBe(true);

      await page.goto(`/properties/${propertyId}/payments`);
      await expect(page.getByText("paid in cash").first()).toBeVisible({ timeout: 15000 });
    });

    test("recording payment without note succeeds", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const paymentDate = new Date().toISOString().split("T")[0];

      const tenantsRes = await page.request.get(
        `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/tenants`
      );
      test.skip(!tenantsRes.ok(), "Could not fetch tenants");
      const { tenants } = await tenantsRes.json();
      const tenant = (tenants as { id: string; name: string }[]).find(
        (t) => t.name === PAYMENT_TENANT_NAME
      );
      test.skip(!tenant?.id, "E2E Payment Tenant not found");

      const createRes = await page.request.post(
        `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/payments`,
        { data: { tenantId: tenant!.id, amount: 500000, paymentDate } }
      );
      expect(createRes.ok(), `Record payment failed: ${await createRes.text()}`).toBe(true);
    });
  });

  test.describe("bad cases", () => {
    test("note field enforces 1000 character frontend limit", async ({
      page,
    }) => {
      await goToRecordPaymentPage(page);

      const noteField = page.getByLabel(/note|catatan/i).first();
      await expect(noteField).toBeVisible({ timeout: 10000 });

      const overLimit = "a".repeat(1001);
      await noteField.fill(overLimit);

      const value = await noteField.inputValue();
      expect(value.length).toBeLessThanOrEqual(1000);
    });
  });

  test.describe("edge cases", () => {
    test("note field can be cleared before submitting", async ({
      page,
    }) => {
      await goToRecordPaymentPage(page);

      const noteField = page.getByLabel(/note|catatan/i).first();
      await expect(noteField).toBeVisible({ timeout: 10000 });

      await noteField.clear();
      await expect(noteField).toHaveValue("");
    });
  });
});
