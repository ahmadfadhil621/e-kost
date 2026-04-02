// Traceability: finance-summary-card-navigation
// REQ 2.1 -> test('income card navigates to payments page')
// REQ 2.2 -> test('expense card navigates to expense history page')
// REQ 2.3 -> test('net income card is not a link')
// REQ 3.1 -> test('recent payment items are not interactive links')
// REQ 3.2 -> test('view finances header link is preserved on dashboard')
// REQ 4.1 -> test('finance overview has no horizontal scroll at 320px')

import { test, expect } from "@playwright/test";
import {
  goToFinanceOverview,
  getPropertyId,
} from "../helpers/finance-expense-tracking";
import { goToDashboard } from "../helpers/dashboard-overview";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

test.describe("summary card navigation", () => {
  test.describe("good cases", () => {
    test("income card navigates to payments page", async ({ page }) => {
      const propertyId = getPropertyId();
      await goToFinanceOverview(page);

      // The income SummaryCard should be wrapped in a link — clicking it navigates
      await page
        .locator("a")
        .filter({ has: page.getByText(/^income$|^pemasukan$/i) })
        .first()
        .click({ timeout: 10000 });

      await expect(page).toHaveURL(
        new RegExp(`/properties/${propertyId}/payments`),
        { timeout: 10000 }
      );
    });

    test("expense card navigates to expense history page", async ({ page }) => {
      const propertyId = getPropertyId();
      await goToFinanceOverview(page);

      // The expense SummaryCard should be wrapped in a link — clicking it navigates
      await page
        .locator("a")
        .filter({ has: page.getByText(/^expenses$|^pengeluaran$/i) })
        .first()
        .click({ timeout: 10000 });

      await expect(page).toHaveURL(
        new RegExp(`/properties/${propertyId}/finance/expenses`),
        { timeout: 10000 }
      );
    });

    test("recent payment items are not interactive links", async ({ page }) => {
      await goToDashboard(page);

      const paymentCard = page.getByTestId("recent-payments-list");
      await expect(paymentCard).toBeVisible({ timeout: 10000 });

      // Collect all list items inside the payment list
      const listItems = paymentCard.getByRole("listitem");
      const count = await listItems.count();

      if (count > 0) {
        // Each payment item must NOT be or contain a link
        for (let i = 0; i < count; i++) {
          const item = listItems.nth(i);
          await expect(item.getByRole("link")).toHaveCount(0);
        }
      }
    });

    test("view finances header link is preserved on dashboard", async ({
      page,
    }) => {
      const propertyId = getPropertyId();
      await goToDashboard(page);

      const paymentCard = page.getByTestId("recent-payments-list");
      await expect(paymentCard).toBeVisible({ timeout: 10000 });

      const viewLink = paymentCard.getByRole("link", {
        name: /view finances →|lihat keuangan →/i,
      });
      await expect(viewLink).toBeVisible();
      await expect(viewLink).toHaveAttribute(
        "href",
        `/properties/${propertyId}/finance`
      );
    });
  });

  test.describe("bad cases", () => {
    test("net income card links to cashflow page", async ({ page }) => {
      const propertyId = getPropertyId();
      await goToFinanceOverview(page);

      // Net Income card label must be visible
      await expect(
        page.getByText(/net income|laba bersih/i).first()
      ).toBeVisible({ timeout: 10000 });

      // Net Income card is now a link to the cashflow page (issue #69)
      const netIncomeLink = page
        .locator("a")
        .filter({ has: page.getByText(/net income|laba bersih/i) })
        .first();
      await expect(netIncomeLink).toBeVisible({ timeout: 5000 });
      await expect(netIncomeLink).toHaveAttribute(
        "href",
        new RegExp(
          `^/properties/${propertyId}/finance/cashflow\\?year=\\d{4}&month=\\d{1,2}$`
        )
      );
    });
  });

  test.describe("edge cases", () => {
    test("finance overview has no horizontal scroll at 320px", async ({
      page,
      browserName,
    }) => {
      test.skip(browserName !== "chromium", "viewport scroll check — chromium only");

      await page.setViewportSize({ width: 320, height: 812 });
      await goToFinanceOverview(page);

      const scrollWidth = await page.evaluate(
        () => document.documentElement.scrollWidth
      );
      const clientWidth = await page.evaluate(
        () => document.documentElement.clientWidth
      );
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });
  });
});
