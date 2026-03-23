// Traceability: dashboard-overview
// Issue #7 -> test('clicking a balance row opens a dialog with tenant details')
// Issue #7 -> test('dialog contains a View Tenant link that navigates to tenant page')
// Issue #7 -> test('dialog closes when dismissed')
// REQ 3.6 -> test('tapping outstanding balance row opens detail dialog, not navigates away')

import { test, expect } from "@playwright/test";
import { goToDashboard } from "../helpers/dashboard-overview";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

test.describe("outstanding balance dialog", () => {
  test.describe("good cases", () => {
    test("clicking a balance row opens a dialog with tenant details", async ({
      page,
    }) => {
      test.info().setTimeout(60000);
      await goToDashboard(page);

      const list = page.getByTestId("outstanding-balances-list");
      await expect(list).toBeVisible({ timeout: 15000 });

      // Skip if no outstanding balances
      const allPaid = list.getByRole("status");
      const hasAllPaid = await allPaid.isVisible().catch(() => false);
      if (hasAllPaid) {
        test.skip(true, "No outstanding balances to test dialog with");
        return;
      }

      const firstRow = list.getByRole("button").first();
      await expect(firstRow).toBeVisible({ timeout: 10000 });

      const tenantName = await firstRow.textContent();
      await firstRow.click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Dialog shows the tenant name
      if (tenantName) {
        await expect(dialog).toContainText(tenantName.trim().split(/\s+/)[0]);
      }

      // Dialog shows a monetary amount
      await expect(dialog.getByText(/Rp|€|\$|[\d,]+/).first()).toBeVisible();
    });

    test("dialog contains a View Tenant link that navigates to tenant page", async ({
      page,
    }) => {
      test.info().setTimeout(60000);
      await goToDashboard(page);

      const list = page.getByTestId("outstanding-balances-list");
      await expect(list).toBeVisible({ timeout: 15000 });

      const allPaid = list.getByRole("status");
      const hasAllPaid = await allPaid.isVisible().catch(() => false);
      if (hasAllPaid) {
        test.skip(true, "No outstanding balances to test dialog with");
        return;
      }

      const firstRow = list.getByRole("button").first();
      await firstRow.click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 5000 });

      const viewTenantLink = dialog.getByRole("link", {
        name: /view tenant|lihat penyewa/i,
      });
      await expect(viewTenantLink).toBeVisible();

      const href = await viewTenantLink.getAttribute("href");
      expect(href).toMatch(/\/properties\/.+\/tenants\/.+/);

      await viewTenantLink.click();
      await expect(page).toHaveURL(/\/tenants\//, { timeout: 10000 });
    });
  });

  test.describe("bad cases", () => {
    test("outstanding balances list is visible on dashboard", async ({
      page,
    }) => {
      test.info().setTimeout(60000);
      await goToDashboard(page);

      const list = page.getByTestId("outstanding-balances-list");
      await expect(list).toBeVisible({ timeout: 15000 });

      // List shows either balance rows or the all-paid message
      await expect(
        list
          .getByRole("button")
          .first()
          .or(list.getByRole("status"))
          .first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("edge cases", () => {
    test("dialog closes when dismissed", async ({ page }) => {
      test.info().setTimeout(60000);
      await goToDashboard(page);

      const list = page.getByTestId("outstanding-balances-list");
      await expect(list).toBeVisible({ timeout: 15000 });

      const allPaid = list.getByRole("status");
      const hasAllPaid = await allPaid.isVisible().catch(() => false);
      if (hasAllPaid) {
        test.skip(true, "No outstanding balances to test dialog dismiss with");
        return;
      }

      const firstRow = list.getByRole("button").first();
      await firstRow.click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Close dialog with the close button
      await page
        .getByRole("button", { name: /close|tutup/i })
        .last()
        .click();

      await expect(dialog).not.toBeVisible({ timeout: 5000 });
    });

    test("all paid message shown when no outstanding balances", async ({
      page,
    }) => {
      test.info().setTimeout(60000);
      await goToDashboard(page);

      const list = page.getByTestId("outstanding-balances-list");
      await expect(list).toBeVisible({ timeout: 15000 });

      const allPaid = list.getByRole("status");
      const hasAllPaid = await allPaid.isVisible().catch(() => false);

      if (hasAllPaid) {
        await expect(allPaid).toContainText(
          /all tenants are up to date|semua penyewa sudah lunas/i
        );
      } else {
        // Skip if there are outstanding balances — this case is tested elsewhere
        test.skip(true, "Outstanding balances present, skipping empty state test");
      }
    });
  });
});
