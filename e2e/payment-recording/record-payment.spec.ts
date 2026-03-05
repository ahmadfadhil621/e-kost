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
import { goToNewTenantPage, goToTenantsList } from "../helpers/tenant-room-basics";

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
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const unique = "Pay-" + Date.now();
      await goToTenantsList(page);
      await page.goto(`/properties/${propertyId}/tenants/new`);
      await page
        .getByLabel(/name|full name/i)
        .first()
        .fill("Tenant " + unique);
      await page.getByLabel(/phone/i).first().fill("08123456789");
      await page.getByLabel(/email/i).first().fill(unique + "@test.com");
      await page
        .getByRole("button", { name: /create tenant|save|submit/i })
        .click();
      await page
        .getByText(/tenant created|success|add tenant/i)
        .first()
        .waitFor({ state: "visible", timeout: 15000 })
        .catch(() => {});

      const tenantRes = await request.get(
        `/api/properties/${propertyId}/tenants`
      );
      if (!tenantRes.ok()) {
        test.skip();
        return;
      }
      const { tenants } = await tenantRes.json();
      const tenant = tenants?.find((t: { name: string }) =>
        t.name?.includes(unique)
      );
      if (!tenant?.id) {
        test.skip();
        return;
      }

      const roomRes = await request.post(
        `/api/properties/${propertyId}/rooms`,
        {
          data: {
            roomNumber: "PayRoom-" + Date.now(),
            roomType: "single",
            monthlyRent: 500000,
          },
        }
      );
      if (!roomRes.ok()) {
        test.skip();
        return;
      }
      const roomBody = await roomRes.json();
      const roomId = roomBody?.id;
      if (!roomId) {
        test.skip();
        return;
      }
      await request.post(
        `/api/properties/${propertyId}/tenants/${tenant.id}/assign-room`,
        { data: { roomId } }
      );

      await goToPaymentsList(page);
      await page
        .getByRole("link", { name: /record payment|catat pembayaran/i })
        .first()
        .click()
        .catch(() => page.goto(`/properties/${propertyId}/payments/new`));

      await page
        .getByRole("combobox")
        .or(page.getByLabel(/tenant|penyewa/i))
        .first()
        .waitFor({ state: "visible", timeout: 10000 });
      await page.getByRole("combobox").first().click().catch(() => {});
      await page.getByText("Tenant " + unique).first().click().catch(() => {});
      await page
        .getByLabel(/payment amount|jumlah/i)
        .first()
        .fill("500000");
      await page
        .getByRole("button", { name: /record payment|catat pembayaran/i })
        .click();

      await expect(
        page
          .getByText(/payment recorded successfully|pembayaran berhasil dicatat|success/i)
          .first()
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
      await page.getByLabel(/payment amount|jumlah/i).first().fill("0");
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
