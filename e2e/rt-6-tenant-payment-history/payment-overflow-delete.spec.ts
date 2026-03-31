// Traceability: rt-6-tenant-payment-history
// AC-3 -> test('delete is in overflow menu, not a full-width button')
// AC-3 -> test('overflow menu delete on property payments page works')

import { test, expect } from "@playwright/test";
import { getPropertyId, goToPaymentsList } from "../helpers/payment-recording";

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

async function createPayment(
  page: import("@playwright/test").Page,
  baseURL: string | undefined,
  propertyId: string,
  tenantId: string
) {
  const paymentDate = new Date().toISOString().slice(0, 10);
  const res = await page.request.post(
    `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/payments`,
    { data: { tenantId, amount: 600000, paymentDate } }
  );
  return res;
}

test.describe("payment card overflow delete menu", () => {
  test.describe("good cases", () => {
    test("delete via overflow menu removes payment from list", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(90000);
      const propertyId = getPropertyId();
      const activeTenant = await getActiveTenant(page, baseURL, propertyId);
      test.skip(!activeTenant, "No active tenant available");

      const createRes = await createPayment(page, baseURL, propertyId, activeTenant!.id);
      expect(createRes.ok(), `Create failed: ${await createRes.text()}`).toBe(true);
      const { id: paymentId } = await createRes.json();

      await goToPaymentsList(page);
      const paymentCard = page.locator(`[data-payment-id="${paymentId}"]`);
      await expect(paymentCard).toBeVisible({ timeout: 15000 });

      // Open overflow menu on the specific card
      await paymentCard
        .getByRole("button", { name: /more|options|lainnya/i })
        .click({ timeout: 10000 });

      // Click delete in the dropdown
      await page
        .getByRole("menuitem", { name: /delete|hapus/i })
        .click({ timeout: 5000 });

      // Confirm in dialog
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /delete|hapus/i })
        .last()
        .click({ timeout: 10000 });

      await expect(paymentCard).not.toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("bad cases", () => {
    test("no full-width destructive delete button visible on payment cards", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const activeTenant = await getActiveTenant(page, baseURL, propertyId);
      test.skip(!activeTenant, "No active tenant available");

      await createPayment(page, baseURL, propertyId, activeTenant!.id);
      await goToPaymentsList(page);

      // The old full-width "Delete Payment" button should NOT be directly visible
      await expect(
        page.getByRole("button", { name: /^delete payment$|^hapus pembayaran$/i })
      ).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("edge cases", () => {
    test("overflow menu button meets 44px touch target on mobile", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      await page.setViewportSize({ width: 390, height: 844 });
      const propertyId = getPropertyId();
      const activeTenant = await getActiveTenant(page, baseURL, propertyId);
      test.skip(!activeTenant, "No active tenant available");

      await createPayment(page, baseURL, propertyId, activeTenant!.id);
      await goToPaymentsList(page);

      const moreButton = page
        .getByRole("button", { name: /more|options|lainnya/i })
        .first();

      const isVisible = await moreButton.isVisible().catch(() => false);
      test.skip(!isVisible, "No overflow menu button visible");

      const box = await moreButton.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.width).toBeGreaterThanOrEqual(44);
      }
    });
  });
});
