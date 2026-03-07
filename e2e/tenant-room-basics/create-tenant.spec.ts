// Traceability: tenant-room-basics
// REQ 1.1 -> test('tenant creation page displays form with name, phone, and email')
// REQ 1.2 -> test('user creates tenant with valid data and sees success')
// REQ 1.3 -> test('user sees validation errors when required fields are empty')
// REQ 1.4, 1.5 -> test('user creates tenant with valid data and sees success')

import { test, expect } from "@playwright/test";
import { goToNewTenantPage } from "../helpers/tenant-room-basics";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

test.describe("create tenant", () => {
  test.describe("good cases", () => {
    test("tenant creation page displays form with name, phone, and email", async ({
      page,
    }) => {
      await goToNewTenantPage(page);
      await expect(
        page.getByLabel(/name|full name/i).first()
      ).toBeVisible({ timeout: 2000 });
      await expect(
        page.getByLabel(/phone/i).first()
      ).toBeVisible({ timeout: 2000 });
      await expect(
        page.getByLabel(/email/i).first()
      ).toBeVisible({ timeout: 2000 });
      await expect(
        page.getByRole("button", { name: /create tenant|save|submit/i })
      ).toBeVisible({ timeout: 2000 });
    });

    test("user creates tenant with valid data and sees success", async ({
      page,
    }) => {
      test.info().setTimeout(90000);
      await goToNewTenantPage(page);
      // Wait for form to be ready (submit button) to avoid filling during re-mount
      await page
        .getByRole("button", { name: /create tenant|save|submit/i })
        .waitFor({ state: "visible", timeout: 10000 });
      const unique = "E2E-" + Date.now();
      // Use input ids to avoid detached DOM when form re-renders
      await page.locator("#tenant-name").fill("Tenant " + unique);
      await page.locator("#tenant-phone").fill("08123456789");
      await page.locator("#tenant-email").fill(unique + "@test.com");
      await page
        .getByRole("button", { name: /create tenant|save|submit/i })
        .click();

      await expect(
        page
          .getByText(/tenant created successfully|success/i)
          .or(page.getByText(unique))
          .or(page.getByRole("link", { name: /add tenant/i }))
          .first()
      ).toBeVisible({ timeout: 25000 });
    });
  });

  test.describe("bad cases", () => {
    test("user sees validation errors when required fields are empty", async ({
      page,
    }) => {
      test.info().setTimeout(60000);
      await goToNewTenantPage(page);
      const submitBtn = page.getByRole("button", {
        name: /create tenant|save|submit/i,
      });
      await submitBtn.waitFor({ state: "visible", timeout: 15000 });
      await submitBtn.click();

      await expect(
        page.getByText(/name is required|required|invalid/i).first()
      ).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("edge cases", () => {
    test("user sees validation when email is invalid", async ({ page }) => {
      test.info().setTimeout(60000);
      await goToNewTenantPage(page);
      await page
        .getByRole("button", { name: /create tenant|save|submit/i })
        .waitFor({ state: "visible", timeout: 15000 });
      await page.locator("#tenant-name").fill("Test User");
      await page.locator("#tenant-phone").fill("08123456789");
      await page.locator("#tenant-email").fill("notanemail");
      await page
        .getByRole("button", { name: /create tenant|save|submit/i })
        .click();

      await expect(
        page.getByText(/invalid email|email format/i)
      ).toBeVisible({ timeout: 15000 });
    });
  });
});
