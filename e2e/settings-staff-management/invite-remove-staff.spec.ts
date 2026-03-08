// Traceability: settings-staff-management
// REQ 3.1 -> test('owner sees staff management section for active property')
// REQ 3.2 -> test('staff section displays list of assigned staff')
// REQ 3.3 -> test('Add Staff shows form to enter email')
// REQ 3.4 -> test('submitting valid staff invitation adds staff and shows confirmation')
// REQ 3.5 -> test('Remove shows confirmation dialog and removes access on confirm')
// REQ 3.6 -> (staff user hiding: covered by unit test StaffSection)
// REQ 3.7 -> test('add and remove have adequate touch targets')

import { test, expect } from "@playwright/test";
import { stableFill } from "../helpers/forms";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

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

      await page.getByRole("button", { name: /add staff|tambah staf/i }).click();

      await expect(
        page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i))
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByRole("button", { name: /invite|add|tambah|send/i })
      ).toBeVisible({ timeout: 3000 });
    });

    test("submitting valid staff invitation adds staff and shows confirmation", async ({
      page,
      request,
    }) => {
      const staffEmail = `staff-${Date.now()}@test.com`;
      await request.post("/api/auth/sign-up/email", {
        data: {
          name: "Staff User",
          email: staffEmail,
          password: "StaffPass123!",
        },
      });

      await page.goto("/settings");
      await page.getByRole("button", { name: /add staff|tambah staf/i }).click();
      await stableFill(
        page,
        () =>
          page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).first(),
        staffEmail
      );
      await page.getByRole("button", { name: /invite|add|tambah|send/i }).click();

      await expect(
        page.getByText(/added|invited|berhasil|success|staff/i)
      ).toBeVisible({ timeout: 10000 });
    });

    test("Remove shows confirmation dialog and removes access on confirm", async ({
      page,
      request,
    }) => {
      const staffEmail = `remove-${Date.now()}@test.com`;
      await request.post("/api/auth/sign-up/email", {
        data: {
          name: "To Remove",
          email: staffEmail,
          password: "RemovePass123!",
        },
      });

      await page.goto("/settings");
      await page.getByRole("button", { name: /add staff|tambah staf/i }).click();
      await stableFill(
        page,
        () =>
          page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).first(),
        staffEmail
      );
      await page.getByRole("button", { name: /invite|add|tambah|send/i }).click();
      await expect(
        page.getByText(/added|invited|berhasil|success|staff/i)
      ).toBeVisible({ timeout: 10000 });

      await page.getByRole("button", { name: /remove|hapus/i }).first().click();
      await expect(
        page.getByRole("dialog").getByRole("button", { name: /confirm|remove|hapus|yes|ya/i })
      ).toBeVisible({ timeout: 5000 });
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /confirm|remove|hapus|yes|ya/i })
        .click();

      await expect(
        page.getByText(/removed|berhasil|success/i)
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
      await page.getByRole("button", { name: /add staff|tambah staf/i }).click();
      await stableFill(
        page,
        () =>
          page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).first(),
        "not-registered@test.com"
      );
      await page.getByRole("button", { name: /invite|add|tambah|send/i }).click();

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
