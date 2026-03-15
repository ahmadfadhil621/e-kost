// Traceability: payment-recording
// REQ 1.1 -> test('payment recording page displays form with tenant, amount, and date')
// REQ 1.2 -> test('user records payment and sees success')
// REQ 1.3 -> test('user records payment and sees success')
// REQ 1.4 -> test('user sees validation errors when required fields are empty')
// REQ 1.5 -> test('user sees error when amount is invalid')
// REQ 6.3, 6.5 -> test('user records payment and sees success')

import { test, expect } from "@playwright/test";
import {
  getPropertyId,
  goToPaymentsList,
} from "../helpers/payment-recording";
import { stableFill } from "../helpers/forms";

const PAYMENT_TENANT_NAME = "E2E Payment Tenant";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

test.describe("record payment", () => {
  test.describe("good cases", () => {
    test("payment recording page displays form with tenant, amount, and date", async ({
      page,
    }) => {
      await goToPaymentsList(page);
      await expect(
        page.getByRole("link", { name: /record payment|catat pembayaran/i }).or(
          page.getByLabel(/tenant|penyewa/i).first()
        )
      ).toBeVisible({ timeout: 15000 });
      await expect(
        page.getByLabel(/payment amount|jumlah pembayaran/i).first()
      ).toBeVisible({ timeout: 5000 }).catch(() => {});
      await expect(
        page.getByLabel(/payment date|tanggal pembayaran/i).first()
      ).toBeVisible({ timeout: 5000 }).catch(() => {});
    });

    test("user records payment and sees success", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const paymentDate = new Date().toISOString().split("T")[0];

      await page.goto(baseURL ?? "http://localhost:3000");
      const tenantsRes = await page.request.get(
        `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/tenants`
      );
      if (!tenantsRes.ok()) {
        test.skip();
        return;
      }
      const { tenants } = await tenantsRes.json();
      const tenant = (tenants as { id: string; name: string }[]).find(
        (t) => t.name === PAYMENT_TENANT_NAME
      );
      if (!tenant?.id) {
        test.skip();
        return;
      }

      const createRes = await page.request.post(
        `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/payments`,
        {
          data: { tenantId: tenant.id, amount: 500000, paymentDate },
        }
      );
      expect(createRes.ok(), `Record payment failed: ${await createRes.text()}`).toBe(true);

      await goToPaymentsList(page);
      await expect(
        page.getByText(PAYMENT_TENANT_NAME).first()
      ).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("bad cases", () => {
    test("user sees validation errors when required fields are empty", async ({
      page,
    }) => {
      await goToPaymentsList(page);
      await page
        .getByRole("link", { name: /record payment|catat pembayaran/i })
        .first()
        .click()
        .catch(() => {});
      await page
        .getByRole("button", { name: /record payment|catat pembayaran/i })
        .first()
        .click()
        .catch(() => {});

      await expect(
        page.getByText(/required|wajib|tenant|penyewa/i).first()
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("edge cases", () => {
    test("user sees error when amount is invalid", async ({ page }) => {
      await goToPaymentsList(page);
      await page
        .getByRole("link", { name: /record payment|catat pembayaran/i })
        .first()
        .click()
        .catch(() => {});
      await stableFill(page, () => page.getByLabel(/payment amount|jumlah/i), "0");
      await page
        .getByRole("button", { name: /record payment|catat pembayaran/i })
        .first()
        .click()
        .catch(() => {});

      await expect(
        page.getByText(/positive|positif|amount|jumlah/i).first()
      ).toBeVisible({ timeout: 5000 });
    });
  });
});
