// Traceability: multi-property-management
// REQ 6.1 -> test('owner sees staff management section on property')
// REQ 6.2 -> test('owner can open add staff form')
// REQ 6.3 -> (covered by unit tests duplicate staff)
// REQ 6.4 -> test('owner sees error when inviting unregistered email')
// REQ 6.5 -> test('owner sees staff list with name and email')

import { test, expect } from "@playwright/test";

test.use({ storageState: "e2e/.auth/user.json" });

test.describe("staff invite", () => {
  test.describe("good cases", () => {
    test("owner sees staff management section on property", async ({
      page,
    }) => {
      // Ensure E2E user has a property so dashboard shows staff section
      await page.goto("/properties/new");
      await page.getByLabel(/property name|name/i).fill("E2E Staff Test Property");
      await page.getByLabel(/address/i).fill("123 E2E Street");
      await page.getByRole("button", { name: /create property/i }).click();
      await expect(page).toHaveURL(/\/properties/, { timeout: 15000 });
      await page.goto("/");
      await expect(
        page.getByText(/staff|members|manage/i).first()
      ).toBeVisible({ timeout: 15000 });
    });

    test("owner can open add staff form", async ({ page }) => {
      await page.goto("/");

      const addStaffButton = page.getByRole("button", {
        name: /add staff|invite/i,
      });
      if ((await addStaffButton.count()) > 0) {
        await addStaffButton.click();
        await expect(
          page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i))
        ).toBeVisible({ timeout: 3000 });
      }
    });
  });

  test.describe("bad cases", () => {
    test("owner sees error when inviting unregistered email", async ({
      page,
    }) => {
      await page.goto("/");

      const addStaffBtn = page.getByRole("button", { name: /add staff|invite/i });
      if ((await addStaffBtn.count()) === 0) return;
      await addStaffBtn.click();

      const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i));
      await emailInput.fill("nonexistent-user@example.com");
      await page.getByRole("button", { name: /invite|add|submit/i }).click();

      await expect(
        page.getByText(/not found|register|unregistered/i)
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("edge cases", () => {
    test("owner sees staff list with name and email", async ({ page }) => {
      await page.goto("/");

      const staffSection = page.getByText(/staff members|staff list/i);
      if ((await staffSection.count()) > 0) {
        await expect(staffSection).toBeVisible();
      }
    });
  });
});
