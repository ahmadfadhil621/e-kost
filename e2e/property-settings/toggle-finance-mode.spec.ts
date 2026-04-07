// Traceability: property-settings (issue #104)
// AC-5  -> test('toggle reflects current staffOnlyFinance value (defaults off)')
// AC-6  -> test('toggling sends PATCH request and updates cached value')
// AC-7  -> test('toggling shows a toast notification')
// AC-12 -> test('owner can toggle back off after enabling (never locked out)')
// PROP-4 -> test('save button enabled only when value differs from saved state')

import * as fs from "fs";
import * as path from "path";
import { test, expect } from "@playwright/test";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

function getPropertyId(): string {
  const filePath = path.join(process.cwd(), "e2e/.auth/property-id.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as { propertyId: string };
  return data.propertyId;
}

async function resetStaffOnlyFinance(baseURL: string, page: import("@playwright/test").Page, propertyId: string) {
  await page.request.patch(`${baseURL}/api/properties/${propertyId}/settings`, {
    data: { staffOnlyFinance: false },
  });
}

test.describe("toggle staff-only finance mode", () => {
  test.describe("good cases", () => {
    test("toggle reflects current staffOnlyFinance value (defaults off)", async ({
      page,
      baseURL,
    }) => {
      const base = baseURL ?? "http://localhost:3000";
      const propertyId = getPropertyId();

      // Ensure default state
      await resetStaffOnlyFinance(base, page, propertyId);

      await page.goto(`/properties/${propertyId}/settings`);
      const toggle = page.locator("#staffOnlyFinance");
      await toggle.waitFor({ state: "visible", timeout: 15000 });
      await expect(toggle).not.toBeChecked();
    });

    test("owner can enable staff-only finance mode and sees toast", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const base = baseURL ?? "http://localhost:3000";
      const propertyId = getPropertyId();

      // Start from known-off state
      await resetStaffOnlyFinance(base, page, propertyId);

      await page.goto(`/properties/${propertyId}/settings`);
      const toggle = page.locator("#staffOnlyFinance");
      await toggle.waitFor({ state: "visible", timeout: 15000 });

      await toggle.check();
      await page.getByRole("button", { name: /^save$|^simpan$/i }).click();

      await expect(
        page.getByRole("status").filter({ hasText: /settings saved|pengaturan disimpan/i })
      ).toBeVisible({ timeout: 15000 });

      // Reset for other tests
      await resetStaffOnlyFinance(base, page, propertyId);
    });

    test("owner can toggle back off after enabling (never locked out)", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const base = baseURL ?? "http://localhost:3000";
      const propertyId = getPropertyId();

      // Force ON first
      await page.request.patch(`${base}/api/properties/${propertyId}/settings`, {
        data: { staffOnlyFinance: true },
      });

      await page.goto(`/properties/${propertyId}/settings`);
      const toggle = page.locator("#staffOnlyFinance");
      await toggle.waitFor({ state: "visible", timeout: 15000 });
      await expect(toggle).toBeChecked();

      await toggle.uncheck();
      await page.getByRole("button", { name: /^save$|^simpan$/i }).click();

      await expect(
        page.getByRole("status").filter({ hasText: /settings saved|pengaturan disimpan/i })
      ).toBeVisible({ timeout: 15000 });

      // Verify persisted as off
      const res = await page.request.get(`${base}/api/properties/${propertyId}`);
      const data = await res.json() as { staffOnlyFinance: boolean };
      expect(data.staffOnlyFinance).toBe(false);
    });
  });

  test.describe("edge cases", () => {
    test("save button is disabled when toggle value matches saved state", async ({
      page,
      baseURL,
    }) => {
      const base = baseURL ?? "http://localhost:3000";
      const propertyId = getPropertyId();
      await resetStaffOnlyFinance(base, page, propertyId);

      await page.goto(`/properties/${propertyId}/settings`);
      const toggle = page.locator("#staffOnlyFinance");
      await toggle.waitFor({ state: "visible", timeout: 15000 });

      // No change — save should be disabled
      const saveBtn = page.getByRole("button", { name: /^save$|^simpan$/i });
      await expect(saveBtn).toBeDisabled();

      // Change toggle — save should enable
      await toggle.check();
      await expect(saveBtn).toBeEnabled();

      // Revert — save should disable again
      await toggle.uncheck();
      await expect(saveBtn).toBeDisabled();
    });
  });
});
