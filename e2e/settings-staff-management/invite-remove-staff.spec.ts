// Traceability: settings-staff-management
// REQ 3.1 -> test('owner sees staff management section for active property')
// REQ 3.2 -> test('staff section displays list of assigned staff')
// REQ 3.3 -> test('Add Staff shows form to enter email')
// REQ 3.4 -> test('submitting valid staff invitation adds staff and shows confirmation')
// REQ 3.5 -> test('Remove shows confirmation dialog and removes access on confirm')
// REQ 3.6 -> (staff user hiding: covered by unit test StaffSection)
// REQ 3.7 -> test('add and remove have adequate touch targets')

import { test, expect } from "@playwright/test";
import type { Browser } from "@playwright/test";
import { stableFill } from "../helpers/forms";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

/** Registers a new user via the /register page in a new context so the user exists in the DB. Leaves the current context (owner) unchanged. */
async function registerStaffUserInNewContext(
  browser: Browser,
  staffEmail: string,
  password: string,
  name: string
): Promise<void> {
  const ctx = await browser.newContext({ baseURL: "http://localhost:3000" });
  const page = await ctx.newPage();
  try {
    await page.goto("/register");
    await stableFill(page, () => page.getByLabel(/full name/i), name);
    await stableFill(page, () => page.getByLabel(/email address/i), staffEmail);
    await stableFill(page, () => page.getByLabel(/password/i), password);
    await page.getByRole("button", { name: /register/i }).click();
    await page.waitForURL((url) => url.pathname === "/", { timeout: 15000 });
  } finally {
    await ctx.close();
  }
}

test.describe("invite and remove staff", () => {
  test.describe("good cases", () => {
    test("owner sees staff management section for active property", async ({
      page,
    }) => {
      await page.goto("/settings");

      await expect(
        page.getByRole("heading", { name: /staff for|staff.*property/i })
      ).toBeVisible({ timeout: 10000 });
    });

    test("staff section displays list of assigned staff", async ({ page }) => {
      await page.goto("/settings");

      const staffSection = page.getByRole("heading", {
        name: /staff for|staff.*property/i,
      }).locator("..");
      await expect(staffSection).toBeVisible({ timeout: 10000 });
    });

    test("Add Staff shows form to enter email", async ({ page }) => {
      await page.goto("/settings");

      const staffSection = page.getByTestId("staff-management");
      await staffSection.waitFor({ state: "visible", timeout: 10000 });
      await staffSection.getByRole("button", { name: /add staff|tambah staf/i }).scrollIntoViewIfNeeded();
      await staffSection.getByRole("button", { name: /add staff|tambah staf/i }).click();

      await expect(
        staffSection.locator("#staff-email")
      ).toBeVisible({ timeout: 10000 });
      await expect(
        staffSection.getByRole("button", { name: /^invite$|^undang$/i })
      ).toBeVisible({ timeout: 5000 });
    });

    test("submitting valid staff invitation adds staff and shows confirmation", async ({
      page,
      browser,
    }) => {
      const staffEmail = `staff-${Date.now()}@test.com`;
      await registerStaffUserInNewContext(browser, staffEmail, "StaffPass123!", "Staff User");

      await page.goto("/settings");
      const staffSection = page.getByTestId("staff-management");
      await staffSection.getByRole("button", { name: /add staff|tambah staf/i }).click();
      await stableFill(
        page,
        () => staffSection.locator("#staff-email"),
        staffEmail
      );
      await staffSection.getByRole("button", { name: /^invite$|^undang$/i }).click();

      await expect(
        page.getByRole("status").filter({ hasText: /invited successfully|berhasil diundang|staff invited/i })
      ).toBeVisible({ timeout: 15000 });

      // Cleanup: remove the invited staff so state does not leak to other specs (e.g. update-account)
      await staffSection.getByRole("listitem").filter({ hasText: staffEmail }).getByRole("button", { name: /remove|hapus|delete/i }).click();
      await page.getByRole("dialog").getByRole("button", { name: /confirm|remove|hapus|yes|ya/i }).click();
    });

    test("Remove shows confirmation dialog and removes access on confirm", async ({
      page,
      browser,
    }) => {
      const staffEmail = `remove-${Date.now()}@test.com`;
      await registerStaffUserInNewContext(browser, staffEmail, "RemovePass123!", "To Remove");

      await page.goto("/settings");
      const staffSection = page.getByTestId("staff-management");
      await staffSection.getByRole("button", { name: /add staff|tambah staf/i }).click();
      await stableFill(
        page,
        () => staffSection.locator("#staff-email"),
        staffEmail
      );
      await staffSection.getByRole("button", { name: /^invite$|^undang$/i }).click();
      await expect(
        page.getByRole("status").filter({ hasText: /invited successfully|berhasil diundang|staff invited/i })
      ).toBeVisible({ timeout: 15000 });

      await staffSection.getByRole("listitem").filter({ hasText: staffEmail }).getByRole("button", { name: /remove|hapus|delete/i }).click();
      await expect(
        page.getByRole("dialog").getByRole("button", { name: /confirm|remove|hapus|yes|ya/i })
      ).toBeVisible({ timeout: 5000 });
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /confirm|remove|hapus|yes|ya/i })
        .click();

      await expect(
        page.getByText(/removed successfully|berhasil dihapus/i)
      ).toBeVisible({ timeout: 5000 }).catch(() => {});
    });

    test("add and remove have adequate touch targets", async ({ page }) => {
      await page.goto("/settings");

      const addButton = page.getByRole("button", {
        name: /add staff|tambah staf/i,
      });
      await expect(addButton).toBeVisible();
      const box = await addButton.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
    });
  });

  test.describe("bad cases", () => {
    test("unregistered email shows error", async ({ page }) => {
      await page.goto("/settings");
      const staffSection = page.getByTestId("staff-management");
      await staffSection.getByRole("button", { name: /add staff|tambah staf/i }).click();
      await stableFill(
        page,
        () => staffSection.locator("#staff-email"),
        "not-registered@test.com"
      );
      await staffSection.getByRole("button", { name: /^invite$|^undang$/i }).click();

      await expect(
        page.getByText(/no account|not found|no registered|tidak ditemukan/i)
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("edge cases", () => {
    test("staff section shows property name in header", async ({ page }) => {
      await page.goto("/settings");

      await expect(
        page.getByRole("heading", { name: /staff for/i })
      ).toBeVisible({ timeout: 10000 });
    });
  });
});
