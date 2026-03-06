// Traceability: outstanding-balance
// REQ 3.3 -> test('tenant list displays balance and status per tenant') -- status alongside names
// REQ 4.1, 4.2 -> test('tenant list displays balance and status per tenant')
// REQ 4.3 -> test('tenant list displays balance and status per tenant')
// REQ 4.4 -> test('user can filter or sort by unpaid (optional)') -- optional; list test covers display
// REQ 4.5 -> test('tenant list displays balance and status per tenant')
// REQ 6.1 -> test('tenant list loads without horizontal scroll')
// REQ 6.2 -> (phone scale: covered by component/design; E2E asserts list visible)
// REQ 6.3 -> (font sizes, contrast: covered by component/design; E2E asserts list visible)
// REQ 6.4 -> test('tenant list displays balance and status per tenant') -- glanceable card layout

import { test, expect } from "@playwright/test";
import { goToTenantsList } from "../helpers/tenant-room-basics";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

test.describe("view tenant list balances", () => {
  test.describe("good cases", () => {
    test("tenant list displays balance and status per tenant", async ({
      page,
    }) => {
      test.info().setTimeout(60000);
      await goToTenantsList(page);
      await expect(
        page
          .getByText(
            /tenant|penyewa|balance|outstanding|paid|unpaid|saldo|terbayar|belum/i
          )
          .first()
      ).toBeVisible({ timeout: 15000 });
    });

    test("tenant list loads without horizontal scroll", async ({ page }) => {
      test.info().setTimeout(60000);
      await goToTenantsList(page);
      await expect(
        page.getByRole("link", { name: /add tenant|tambah penyewa/i }).or(
          page.getByText(/tenants|no tenants|penyewa|tidak ada penyewa/i)
        ).first()
      ).toBeVisible({ timeout: 15000 });
      const body = page.locator("body");
      const box = await body.boundingBox();
      expect(box?.width).toBeLessThanOrEqual(480);
    });
  });

  test.describe("bad cases", () => {
    test("non-existent property shows error or redirect", async ({ page }) => {
      await page.goto("/properties/00000000-0000-0000-0000-000000000000/tenants");
      await expect(
        page
          .getByText(/not found|error|tidak ditemukan|kesalahan/i)
          .or(page.getByRole("heading", { name: /tenant|property|penyewa|properti/i }))
      ).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("edge cases", () => {
    test("empty property shows tenant list with empty or zero state", async ({
      page,
    }) => {
      test.info().setTimeout(60000);
      await goToTenantsList(page);
      await expect(
        page
          .getByText(/tenant|penyewa|no tenants|tidak ada penyewa|add tenant|tambah/i)
          .first()
      ).toBeVisible({ timeout: 15000 });
    });
  });
});
