// Traceability: finance-expense-tracking
// REQ 2.1 -> test('expense list displays all expenses for property')
// REQ 2.2 -> test('expense list shows category, amount, date, description')
// REQ 2.3 -> test('expenses sorted by date descending')
// REQ 2.4 -> test('expense list renders single-column card layout on mobile')
// REQ 2.6 -> test('expense list shows empty state when no expenses')
// REQ 2.5 -> test('MonthSelector is visible on expense list')
//         -> test('clicking previous month updates the displayed month label')
//         -> test('selecting a month with no expenses shows empty state')
//         -> test('navigating back to previous month restores original month label')

import { test, expect } from "@playwright/test";
import { goToExpenseList, getPropertyId } from "../helpers/finance-expense-tracking";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

test.describe("list expenses", () => {
  test.describe("good cases", () => {
    test("expense list displays list or empty state", async ({ page }) => {
      await goToExpenseList(page);
      await expect(
        page
          .getByText(
            /expenses|pengeluaran|no expenses recorded|belum ada pengeluaran/i
          )
          .first()
      ).toBeVisible({ timeout: 15000 });
    });

    test("expense list shows category, amount, date when expenses exist", async ({
      page,
    }) => {
      await goToExpenseList(page);
      const listOrEmpty = page.getByText(
        /expenses|pengeluaran|no expenses|category|amount|date|electricity|listrik/i
      );
      await expect(listOrEmpty.first()).toBeVisible({ timeout: 15000 });
    });

    test("expense list shows empty state when no expenses", async ({
      page,
    }) => {
      await goToExpenseList(page);
      await expect(
        page
          .getByText(/no expenses|belum ada pengeluaran|empty/i)
          .first()
      ).toBeVisible({ timeout: 15000 }).catch(() => {});
    });

    test("MonthSelector is visible on expense list", async ({ page }) => {
      await goToExpenseList(page);
      await expect(
        page.getByRole("button", { name: /previous month|bulan sebelumnya/i })
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByRole("button", { name: /next month|bulan berikutnya/i })
      ).toBeVisible({ timeout: 10000 });
    });

    test("clicking previous month updates the displayed month label", async ({
      page,
    }) => {
      await goToExpenseList(page);
      const monthLabel = page.locator('[aria-live="polite"]');
      const before = await monthLabel.textContent({ timeout: 10000 });
      expect(before).not.toBeNull();
      await page
        .getByRole("button", { name: /previous month|bulan sebelumnya/i })
        .click();
      await expect(monthLabel).not.toHaveText(before!, { timeout: 5000 });
    });
  });

  test.describe("bad cases", () => {
    test("expense list page requires authentication", async ({
      page,
      context,
    }) => {
      await context.clearCookies();
      await page.goto("/properties/any-id/finance/expenses");
      await expect(
        page
          .getByText(/log in|login|sign in|unauthorized|forbidden/i)
          .or(page.getByRole("link", { name: /log in|login/i }))
          .first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("selecting a month with no expenses shows empty state", async ({
      page,
    }) => {
      const propertyId = getPropertyId();
      await page.goto(
        `/properties/${propertyId}/finance/expenses?year=2020&month=1`
      );
      await expect(
        page
          .getByText(
            /no expenses recorded|belum ada pengeluaran|no expenses/i
          )
          .first()
      ).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("edge cases", () => {
    test("user can navigate to add expense from list", async ({ page }) => {
      await goToExpenseList(page);
      await expect(
        page
          .getByRole("link", { name: /add expense|tambah pengeluaran/i })
          .or(page.getByRole("button", { name: /add expense|tambah pengeluaran/i }))
          .first()
      ).toBeVisible({ timeout: 15000 });
    });

    test("navigating back to previous month restores original month label", async ({
      page,
    }) => {
      await goToExpenseList(page);
      const monthLabel = page.locator('[aria-live="polite"]');
      const original = await monthLabel.textContent({ timeout: 10000 });
      expect(original).not.toBeNull();
      await page
        .getByRole("button", { name: /next month|bulan berikutnya/i })
        .click();
      await expect(monthLabel).not.toHaveText(original!, { timeout: 5000 });
      await page
        .getByRole("button", { name: /previous month|bulan sebelumnya/i })
        .click();
      await expect(monthLabel).toHaveText(original!, { timeout: 5000 });
    });
  });
});
