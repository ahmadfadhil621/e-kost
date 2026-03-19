// Traceability: tenant-room-basics (edit flow) — issue #29
// REQ E1.1 -> test('edit tenant form pre-populated with current data')
// REQ E1.2 -> test('user edits tenant name and sees success')
// REQ E1.3 -> test('user sees validation error when name is cleared')
// REQ E1.4 -> test('user sees validation error for invalid email')
// REQ E1.5 -> test('cancel returns to tenant detail without saving')

import { test, expect } from "@playwright/test";
import {
  getPropertyId,
  goToEditTenantPage,
} from "../helpers/tenant-room-basics";
import { stableFill } from "../helpers/forms";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

let tenantId: string;
let originalName: string;

test.beforeAll(async ({ browser, baseURL }) => {
  const propertyId = getPropertyId();
  const context = await browser.newContext({
    storageState: "e2e/.auth/user-with-property.json",
  });
  const page = await context.newPage();
  await page.goto(baseURL ?? "http://localhost:3000");
  const unique = "E2E-Edit-" + Date.now();
  originalName = "Edit Tenant " + unique;
  const res = await page.request.post(
    `${baseURL}/api/properties/${propertyId}/tenants`,
    {
      data: {
        name: originalName,
        phone: "08123456789",
        email: unique + "@test.com",
      },
    }
  );
  expect(res.ok(), `Create tenant failed: ${await res.text()}`).toBe(true);
  tenantId = (await res.json()).id;
  await context.close();
});

test.describe("edit tenant", () => {
  test.describe("good cases", () => {
    test("edit tenant form pre-populated with current data", async ({
      page,
    }) => {
      test.info().setTimeout(45000);
      await goToEditTenantPage(page, tenantId);
      await expect(page.locator("#tenant-name")).toHaveValue(
        new RegExp(originalName),
        { timeout: 5000 }
      );
      await expect(page.locator("#tenant-phone")).toHaveValue("08123456789", {
        timeout: 2000,
      });
      await expect(
        page.getByRole("button", { name: /save changes/i })
      ).toBeVisible({ timeout: 2000 });
    });

    test("user edits tenant name and sees success", async ({ page }) => {
      test.info().setTimeout(60000);
      await goToEditTenantPage(page, tenantId);
      const updatedName = "Updated " + Date.now();
      await stableFill(page, () => page.locator("#tenant-name"), updatedName);
      await page.getByRole("button", { name: /save changes/i }).click();

      await expect(
        page
          .getByText(/tenant updated successfully|success/i)
          .or(page.getByText(updatedName))
          .first()
      ).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("bad cases", () => {
    test("user sees validation error when name is cleared", async ({ page }) => {
      test.info().setTimeout(45000);
      await goToEditTenantPage(page, tenantId);
      await stableFill(page, () => page.locator("#tenant-name"), "");
      await page.getByRole("button", { name: /save changes/i }).click();

      await expect(
        page.getByText(/name is required|required|invalid/i).first()
      ).toBeVisible({ timeout: 5000 });
    });

    test("user sees validation error for invalid email format", async ({
      page,
    }) => {
      test.info().setTimeout(45000);
      await goToEditTenantPage(page, tenantId);
      await stableFill(
        page,
        () => page.locator("#tenant-email"),
        "not-an-email"
      );
      await page.getByRole("button", { name: /save changes/i }).click();

      await expect(
        page.getByText(/invalid email|valid email|email format/i).first()
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("edge cases", () => {
    test("cancel returns to tenant detail without saving", async ({ page }) => {
      test.info().setTimeout(45000);
      await goToEditTenantPage(page, tenantId);
      await page.getByRole("button", { name: /cancel/i }).click();

      await page
        .waitForURL(/\/tenants\/[^/]+$/, { timeout: 8000 })
        .catch(() => {});
      await expect(page.url()).toMatch(/\/tenants\//);
      await expect(page.url()).not.toMatch(/\/edit/);
      // Detail page should be visible (edit/assign room/move out buttons or heading)
      await expect(
        page
          .getByRole("button", { name: /edit|assign room|move out/i })
          .or(page.getByText(/tenant details|detail/i))
          .first()
      ).toBeVisible({ timeout: 15000 });
    });
  });
});
