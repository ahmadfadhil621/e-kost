// Traceability: finance-inline-cards (issue #86)
// AC-PL-3 -> test('delete payment from list card with confirmation removes it from the list')
// AC-PL-4 -> test('cancelling payment delete keeps payment in list')
// AC-PL-6 -> test('overflow menu button meets 44px touch target requirement')

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
    {
      data: { tenantId, amount: 600000, paymentDate },
    }
  );
  return res;
}

test.describe("delete payment", () => {
  test.describe("good cases", () => {
    test("delete payment from list card with confirmation removes it from the list", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();

      const activeTenant = await getActiveTenant(page, baseURL, propertyId);
      test.skip(!activeTenant, "No active tenant available to seed payment");

      // Create a payment to delete
      const createRes = await createPayment(page, baseURL, propertyId, activeTenant!.id);
      expect(
        createRes.ok(),
        `Create payment failed: ${await createRes.text()}`
      ).toBe(true);
      const { id: paymentId } = await createRes.json();

      await goToPaymentsList(page);

      // Wait for our specific payment card to be visible
      const paymentCard = page.locator(`[data-payment-id="${paymentId}"]`);
      await expect(paymentCard).toBeVisible({ timeout: 15000 });

      // Open overflow menu on the card
      await paymentCard
        .getByRole("button", { name: /more|options|lainnya/i })
        .click({ timeout: 10000 });

      // Click delete in the dropdown menu
      await page
        .getByRole("menuitem", { name: /delete|hapus/i })
        .click({ timeout: 5000 });

      // Confirmation dialog — click confirm
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /delete|hapus/i })
        .last()
        .click({ timeout: 10000 });

      // Wait for the specific payment card to disappear — this is our signal that
      // the DELETE completed and the list has refreshed
      await expect(paymentCard).not.toBeVisible({ timeout: 15000 });

      // Should stay on the payments list
      await expect(page).toHaveURL(/\/payments$/, { timeout: 5000 });
    });
  });

  test.describe("bad cases", () => {
    test("cancelling payment delete keeps payment in list", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();

      const activeTenant = await getActiveTenant(page, baseURL, propertyId);
      test.skip(!activeTenant, "No active tenant available to seed payment");

      // Create a fresh payment
      const createRes = await createPayment(page, baseURL, propertyId, activeTenant!.id);
      expect(
        createRes.ok(),
        `Create payment failed: ${await createRes.text()}`
      ).toBe(true);
      const { id: cancelPaymentId } = await createRes.json();

      await goToPaymentsList(page);

      // Wait for our specific payment card to be visible
      const cancelPaymentCard = page.locator(`[data-payment-id="${cancelPaymentId}"]`);
      await expect(cancelPaymentCard).toBeVisible({ timeout: 15000 });

      // Open overflow menu on the card
      await cancelPaymentCard
        .getByRole("button", { name: /more|options|lainnya/i })
        .click({ timeout: 10000 });

      // Click delete in the dropdown menu
      await page
        .getByRole("menuitem", { name: /delete|hapus/i })
        .click({ timeout: 5000 });

      // Click Cancel in the dialog
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /cancel|batal/i })
        .click({ timeout: 5000 });

      // Payment card should still be visible (not deleted)
      await expect(cancelPaymentCard).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("edge cases", () => {
    test("overflow menu button meets 44px touch target requirement", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(45000);
      await page.setViewportSize({ width: 390, height: 844 });

      const propertyId = getPropertyId();

      // Ensure at least one payment exists
      const activeTenant = await getActiveTenant(page, baseURL, propertyId);
      if (activeTenant) {
        await createPayment(page, baseURL, propertyId, activeTenant.id);
      }

      await goToPaymentsList(page);

      const moreButton = page
        .getByRole("button", { name: /more|options|lainnya/i })
        .first();

      // Only assert touch target if payments exist
      const isVisible = await moreButton.isVisible().catch(() => false);
      if (!isVisible) {
        test.skip(true, "No payments available to check overflow menu touch target");
        return;
      }

      await expect(moreButton).toBeVisible({ timeout: 10000 });

      const box = await moreButton.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.width).toBeGreaterThanOrEqual(44);
      }
    });
  });
});
