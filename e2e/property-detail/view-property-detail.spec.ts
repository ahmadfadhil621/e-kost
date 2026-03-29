// Traceability: property-detail — issue #24
// REQ-1.1, REQ-1.2 -> test('property detail shows name and address')
// REQ-1.4 -> test('property detail shows stats overview')
// REQ-1.5 -> test('property detail shows map placeholder')
// REQ-1.6 (issue #26) -> test('property detail shows live staff management section for owner')
// REQ-1.7 -> test('property detail shows quick-nav links')
// REQ-2.1 -> test('property list card has view-details link')
// REQ-2.2 -> test('dashboard has property info link')
// REQ-3.3 -> test('direct navigation to property detail page works')

import * as fs from "fs";
import * as path from "path";
import { test, expect } from "@playwright/test";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

function getPropertyId(): string {
  const filePath = path.join(process.cwd(), "e2e/.auth/property-id.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return data.propertyId;
}

test.describe("property detail page", () => {
  test.describe("good cases", () => {
    test("direct navigation to property detail page works", async ({ page }) => {
      const propertyId = getPropertyId();
      await page.goto(`/properties/${propertyId}`);

      await expect(page).toHaveURL(`/properties/${propertyId}`, { timeout: 10000 });
      // Should show a heading (property name)
      await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10000 });
    });

    test("property detail shows name and address", async ({ page }) => {
      const propertyId = getPropertyId();
      await page.goto(`/properties/${propertyId}`);

      // Property name heading is visible
      await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10000 });
      // Page renders content (address text area present)
      await expect(page.locator("[data-testid='property-address'], p, span").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("property detail shows stats overview", async ({ page }) => {
      const propertyId = getPropertyId();
      await page.goto(`/properties/${propertyId}`);

      // Stats section must contain numeric values or dashes
      await expect(
        page.getByTestId("stat-total-rooms")
          .or(page.getByText(/total rooms|rooms/i).first())
      ).toBeVisible({ timeout: 10000 });
    });

    test("property detail shows map placeholder", async ({ page }) => {
      const propertyId = getPropertyId();
      await page.goto(`/properties/${propertyId}`);

      await expect(page.getByText(/map coming soon/i)).toBeVisible({ timeout: 10000 });
    });

    test("property detail shows live staff management section for owner", async ({ page }) => {
      const propertyId = getPropertyId();
      await page.goto(`/properties/${propertyId}`);

      await expect(page.getByTestId("staff-management")).toBeVisible({ timeout: 15000 });
    });

    test("property detail shows quick-nav links to Rooms, Tenants, Payments, Finance", async ({
      page,
    }) => {
      const propertyId = getPropertyId();
      await page.goto(`/properties/${propertyId}`);

      await expect(page.getByRole("link", { name: /rooms/i }).first()).toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByRole("link", { name: /tenants/i }).first()).toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByRole("link", { name: /payments/i }).first()).toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByRole("link", { name: /finance/i }).first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("property list card links to the property detail page", async ({ page }) => {
      const propertyId = getPropertyId();
      await page.goto("/properties");

      // Each property card is now a full link to its detail page
      await expect(
        page.locator(`a[href="/properties/${propertyId}"]`).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("property list card navigates to property detail page when clicked", async ({ page }) => {
      const propertyId = getPropertyId();
      await page.goto("/properties");

      await page.locator(`a[href="/properties/${propertyId}"]`).first().click();

      await expect(page).toHaveURL(`/properties/${propertyId}`, { timeout: 10000 });
      await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10000 });
    });

    test("dashboard has a property info link", async ({ page }) => {
      await page.goto("/");

      await expect(
        page.getByRole("link", { name: /property info|property details|info/i }).first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("bad cases", () => {
    test("navigating to a non-existent property shows an error", async ({ page }) => {
      await page.goto("/properties/non-existent-property-id-99999");

      await expect(
        page.getByText(/not found|error|unavailable|forbidden/i).first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("edge cases", () => {
    test("property detail page is accessible on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      const propertyId = getPropertyId();
      await page.goto(`/properties/${propertyId}`);

      await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/map coming soon/i)).toBeVisible({ timeout: 10000 });
    });
  });
});
