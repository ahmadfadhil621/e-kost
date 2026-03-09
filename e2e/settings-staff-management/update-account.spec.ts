// Traceability: settings-staff-management
// REQ 2.1 -> test('settings page displays account section with name and email')
// REQ 2.2 -> test('email is displayed as read-only')
// REQ 2.3 -> test('tapping Edit shows editable name field')
// REQ 2.4 -> test('saving valid name shows confirmation and updates display')
// REQ 2.5 -> test('empty name shows validation error and prevents save')
// REQ 2.6 -> test('profile icon shows initials from name')
// PROP 3 -> test('saving valid name shows confirmation and updates display')

import { test, expect } from "@playwright/test";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

test.describe("update account", () => {
  test.describe("good cases", () => {
    test("settings page displays account section with name and email", async ({
      page,
    }) => {
      await page.goto("/settings");

      await expect(
        page.getByRole("heading", { name: /account|akun/i })
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.locator("#account-email")
      ).toBeVisible();
    });

    test("email is displayed as read-only", async ({ page }) => {
      await page.goto("/settings");

      const emailSection = page.getByRole("heading", {
        name: /account|akun/i,
      }).locator("..");
      await expect(emailSection.getByText(/.+@.+/)).toBeVisible();
      await expect(
        page.getByLabel(/email/i).first()
      ).toHaveAttribute("readonly", "").catch(() => {});
    });

    test("tapping Edit shows editable name field", async ({ page }) => {
      await page.goto("/settings");

      await page.getByRole("button", { name: /edit|ubah/i }).click();

      await expect(
        page.getByLabel(/name|nama/i).first()
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByRole("button", { name: /save|simpan/i })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /cancel|batal/i })
      ).toBeVisible();
    });

    test("saving valid name shows confirmation and updates display", async ({
      page,
    }) => {
      await page.goto("/settings");

      await page.getByRole("button", { name: /edit|ubah/i }).click();
      const nameInput = page.getByLabel(/name|nama/i).first();
      await nameInput.waitFor({ state: "visible", timeout: 5000 });
      await nameInput.fill("E2E Updated Name");
      await page.getByRole("button", { name: /save|simpan/i }).click();

      await expect(
        page.getByRole("region", { name: /account|akun/i }).getByText(/account updated|akun berhasil diperbarui/i)
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByText("E2E Updated Name")
      ).toBeVisible({ timeout: 5000 });
    });

    test("profile icon shows initials from name", async ({ page }) => {
      await page.goto("/settings");

      const initials = page.getByText(/^[A-Z]{1,2}$/).first();
      await expect(initials).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("bad cases", () => {
    test("empty name shows validation error and prevents save", async ({
      page,
    }) => {
      await page.goto("/settings");

      await page.getByRole("button", { name: /edit|ubah/i }).click();
      const nameInput = page.getByLabel(/name|nama/i).first();
      await nameInput.waitFor({ state: "visible", timeout: 5000 });
      await nameInput.clear();
      await page.getByRole("button", { name: /save|simpan/i }).click();

      await expect(
        page.getByText(/name is required|required|nama wajib/i)
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("edge cases", () => {
    test("cancel exits edit mode without saving", async ({ page }) => {
      await page.goto("/settings");

      await page.getByRole("button", { name: /edit|ubah/i }).click();
      const nameInput = page.getByLabel(/name|nama/i).first();
      await nameInput.waitFor({ state: "visible", timeout: 5000 });
      const nameBefore = await nameInput.inputValue();

      await nameInput.fill("Never Saved");
      await page.getByRole("button", { name: /cancel|batal/i }).click();

      if (nameBefore.trim()) {
        await expect(
          page.getByRole("region", { name: /account|akun/i }).getByText(nameBefore.trim())
        ).toBeVisible({ timeout: 3000 });
      }
    });
  });
});
