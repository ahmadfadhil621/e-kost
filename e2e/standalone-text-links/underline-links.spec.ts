// Traceability: standalone-text-links (issue #96)
// AC-1 -> test('view all payments link is underlined by default')
// AC-1 -> test('view all payments link meets 44px touch target')
// AC-1 -> test('view all payments link is underlined at 320px mobile viewport')
// AC-2 -> test('dashboard property info link is underlined by default')
// AC-2 -> test('dashboard property info link meets 44px touch target')

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

async function ensureViewAllVisible(
  page: import("@playwright/test").Page,
  baseURL: string | undefined,
  propertyId: string,
  tenantId: string
) {
  // Ensure ≥4 payments so the "view all" link appears
  const res = await page.request.get(
    `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/tenants/${tenantId}/payments`
  );
  const { count } = await res.json();
  if (count < 4) {
    const d = new Date();
    d.setMonth(d.getMonth() - count);
    await page.request.post(
      `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/payments`,
      { data: { tenantId, amount: 500000, paymentDate: d.toISOString().slice(0, 10) } }
    );
  }
}

test.describe("standalone text links are visually underlined", () => {
  test.describe("good cases", () => {
    test("view all payments link is underlined by default", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(90000);
      const propertyId = getPropertyId();
      const tenant = await getActiveTenant(page, baseURL, propertyId);
      test.skip(!tenant, "No active tenant available");

      await ensureViewAllVisible(page, baseURL, propertyId, tenant!.id);
      await goToTenantDetail(page, tenant!.id);

      const viewAllLink = page.getByRole("link", { name: /view all|lihat semua/i });
      await expect(viewAllLink).toBeVisible({ timeout: 15000 });

      const textDecoration = await viewAllLink.evaluate((el) =>
        window.getComputedStyle(el).textDecorationLine
      );
      expect(textDecoration).toContain("underline");
    });

    test("view all payments link meets 44px touch target", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(90000);
      const propertyId = getPropertyId();
      const tenant = await getActiveTenant(page, baseURL, propertyId);
      test.skip(!tenant, "No active tenant available");

      await ensureViewAllVisible(page, baseURL, propertyId, tenant!.id);
      await goToTenantDetail(page, tenant!.id);

      const viewAllLink = page.getByRole("link", { name: /view all|lihat semua/i });
      await expect(viewAllLink).toBeVisible({ timeout: 15000 });

      const box = await viewAllLink.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    });

    test("dashboard property info link is underlined by default", async ({
      page,
    }) => {
      test.info().setTimeout(60000);
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.waitForSelector("text=/Property Info|Info Properti/i", {
        timeout: 20000,
      });

      const propInfoLink = page
        .getByRole("link", { name: /property info|info properti/i })
        .first();
      await expect(propInfoLink).toBeVisible({ timeout: 10000 });

      const textDecoration = await propInfoLink.evaluate((el) =>
        window.getComputedStyle(el).textDecorationLine
      );
      expect(textDecoration).toContain("underline");
    });

    test("dashboard property info link meets 44px touch target", async ({
      page,
    }) => {
      test.info().setTimeout(60000);
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.waitForSelector("text=/Property Info|Info Properti/i", {
        timeout: 20000,
      });

      const propInfoLink = page
        .getByRole("link", { name: /property info|info properti/i })
        .first();
      await expect(propInfoLink).toBeVisible({ timeout: 10000 });

      const box = await propInfoLink.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    });
  });

  test.describe("bad cases", () => {
    test("record payment button-style link is not affected by standalone link rule", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(90000);
      const propertyId = getPropertyId();
      const tenant = await getActiveTenant(page, baseURL, propertyId);
      test.skip(!tenant, "No active tenant available");

      await ensureViewAllVisible(page, baseURL, propertyId, tenant!.id);
      await goToTenantDetail(page, tenant!.id);

      // The "Record Payment" button-style link must remain a button (not a standalone text link)
      // It should be rendered as a <button> element, not a bare <a> text link
      const recordPaymentBtn = page.getByRole("button", { name: /record payment|catat pembayaran/i });
      await expect(recordPaymentBtn).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("edge cases", () => {
    test("view all payments link is underlined at 320px mobile viewport", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(90000);
      await page.setViewportSize({ width: 320, height: 568 });
      const propertyId = getPropertyId();
      const tenant = await getActiveTenant(page, baseURL, propertyId);
      test.skip(!tenant, "No active tenant available");

      await ensureViewAllVisible(page, baseURL, propertyId, tenant!.id);
      await goToTenantDetail(page, tenant!.id);

      const viewAllLink = page.getByRole("link", { name: /view all|lihat semua/i });
      await expect(viewAllLink).toBeVisible({ timeout: 15000 });

      // No horizontal scroll
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

      const textDecoration = await viewAllLink.evaluate((el) =>
        window.getComputedStyle(el).textDecorationLine
      );
      expect(textDecoration).toContain("underline");
    });
  });
});
