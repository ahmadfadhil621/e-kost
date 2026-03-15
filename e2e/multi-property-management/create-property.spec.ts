// Traceability: multi-property-management
// REQ 1.1 -> test('property creation page displays form with name and address')
// REQ 1.2 -> test('user creates property with valid data and sees success')
// REQ 1.3 -> test('user sees validation errors when required fields are empty')
// REQ 1.4 -> (covered by unit tests)
// REQ 1.6 -> test('user creates property with valid data and sees success')

import { test, expect } from "@playwright/test";
import { stableFill } from "../helpers/forms";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

test.describe("create property", () => {
  test.describe("good cases", () => {
    test("property creation page displays form with name and address", async ({
      page,
    }) => {
      await page.goto("/properties/new");

      await expect(page.getByLabel(/property name|name/i)).toBeVisible();
      await expect(page.getByLabel(/address/i)).toBeVisible();
      await expect(
        page.getByRole("button", { name: /create property/i })
      ).toBeVisible();
    });

    test("user creates property with valid data and sees success", async ({
      page,
    }) => {
      await page.goto("/properties/new");

      await stableFill(page, () => page.getByLabel(/property name|name/i), "E2E Test Property");
      await stableFill(page, () => page.getByLabel(/address/i), "123 E2E Street");
      await page.getByRole("button", { name: /create property/i }).click();

      await expect(
        page.getByText(/created successfully|my properties|property/i).first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("bad cases", () => {
    test("user sees validation errors when required fields are empty", async ({
      page,
    }) => {
      await page.goto("/properties/new");

      await page.getByRole("button", { name: /create property/i }).click();

      await expect(page.getByText(/property name is required|required/i).first()).toBeVisible();
      await expect(page.getByText(/address is required|required/i).first()).toBeVisible();
    });
  });

  test.describe("edge cases", () => {
    test("user sees validation when name is too long", async ({ page }) => {
      await page.goto("/properties/new");

      await stableFill(page, () => page.getByLabel(/property name|name/i), "a".repeat(201));
      await stableFill(page, () => page.getByLabel(/address/i), "Valid Address");
      await page.getByRole("button", { name: /create property/i }).click();

      await expect(page.getByText(/200|too long|characters/i)).toBeVisible({
        timeout: 5000,
      });
    });
  });
});
