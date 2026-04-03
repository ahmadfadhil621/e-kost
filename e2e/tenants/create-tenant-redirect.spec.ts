// Traceability: issue-97-redirect-to-tenant-detail
// REQ issue-97.1 -> test('redirects to tenant detail page after successful creation')
// REQ issue-97.2 -> test('redirects to the correct tenant detail URL on mobile viewport')

import { test, expect } from "@playwright/test";
import { getPropertyId, goToNewTenantPage } from "../helpers/tenant-room-basics";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

test.describe("Create Tenant — redirect to detail (issue #97)", () => {
  test("redirects to tenant detail page after successful creation", async ({ page }) => {
    const propertyId = getPropertyId();
    await goToNewTenantPage(page);

    const suffix = Date.now();
    await page.locator("#tenant-name").fill(`Redirect Test ${suffix}`);
    await page.locator("#tenant-phone").fill(`0812${String(suffix).slice(-7).padStart(7, "0")}`);

    const emailInput = page.locator("#tenant-email");
    if (await emailInput.isVisible()) {
      await emailInput.fill(`redirect-${suffix}@test.com`);
    }

    await page.getByRole("button", { name: /create tenant|save|submit/i }).click();

    await page.waitForURL(
      new RegExp(`/properties/${propertyId}/tenants/[^/]+$`),
      { timeout: 15000 }
    );

    const url = page.url();
    expect(url).toMatch(new RegExp(`/properties/${propertyId}/tenants/[^/]+$`));
    expect(url).not.toMatch(new RegExp(`/properties/${propertyId}/tenants$`));
  });

  test("redirects to the correct tenant detail URL on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const propertyId = getPropertyId();
    await goToNewTenantPage(page);

    const suffix = Date.now() + 1;
    await page.locator("#tenant-name").fill(`Mobile Redirect ${suffix}`);
    await page.locator("#tenant-phone").fill(`0813${String(suffix).slice(-7).padStart(7, "0")}`);

    const emailInput = page.locator("#tenant-email");
    if (await emailInput.isVisible()) {
      await emailInput.fill(`mobile-redirect-${suffix}@test.com`);
    }

    await page.getByRole("button", { name: /create tenant|save|submit/i }).click();

    await page.waitForURL(
      new RegExp(`/properties/${propertyId}/tenants/[^/]+$`),
      { timeout: 15000 }
    );

    const url = page.url();
    expect(url).toMatch(new RegExp(`/properties/${propertyId}/tenants/[^/]+$`));
    expect(url).not.toMatch(new RegExp(`/properties/${propertyId}/tenants$`));
  });
});
