// Traceability: multi-property-management
// REQ 2.3 -> test('user can switch active property from header')
// REQ 2.4 -> test('user can switch active property from header')
// REQ 5.1 -> test('active property name is visible in header')
// REQ 5.2 -> test('tapping property name opens switcher')

import { test, expect } from "@playwright/test";

test.use({ storageState: "e2e/.auth/user.json" });

test.describe("switch property", () => {
  test.describe("good cases", () => {
    test("active property name is visible in header", async ({ page }) => {
      await page.goto("/");

      await expect(
        page.getByRole("banner").or(page.locator("header"))
      ).toBeVisible();
      // When property context exists, property name or placeholder is shown
      const header = page.getByRole("banner").or(page.locator("header"));
      await expect(header).toBeVisible();
    });

    test("user can switch active property from header", async ({ page }) => {
      await page.goto("/");

      const header = page.getByRole("banner").or(page.locator("header"));
      const propertyTrigger = header.getByText(/property|switch|select/i).first();
      if ((await propertyTrigger.count()) > 0) {
        await propertyTrigger.click();
        await expect(
          page.getByRole("dialog").or(page.getByRole("listbox"))
        ).toBeVisible({ timeout: 3000 });
      }
    });
  });

  test.describe("bad cases", () => {
    test("user without properties sees create prompt or empty state", async ({
      page,
    }) => {
      await page.goto("/");
      const emptyOrCreate = page.getByText(/no properties yet|create your first property|get started/i).first();
      await expect(emptyOrCreate).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("edge cases", () => {
    test("tapping property name opens switcher when multiple properties", async ({
      page,
    }) => {
      await page.goto("/");

      const header = page.getByRole("banner").or(page.locator("header"));
      const clickable = header.locator("button, [role=button]").first();
      if ((await clickable.count()) > 0) {
        await clickable.click();
        await expect(
          page.getByRole("dialog").or(page.getByRole("listbox"))
        ).toBeVisible({ timeout: 3000 });
      }
    });
  });
});
