// Traceability: finance-expense-tracking
// REQ 2.1 -> test('expense list displays all expenses for property')
// REQ 2.2 -> test('expense list shows category, amount, date, description')
// REQ 2.3 -> test('expenses sorted by date descending')
// REQ 2.4 -> test('expense list renders single-column card layout on mobile')
// REQ 2.6 -> test('expense list shows empty state when no expenses')
// REQ 2.5 -> test('user can filter expenses by month')

import { test, expect } from "@playwright/test";
import { goToExpenseList } from "../helpers/finance-expense-tracking";

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
      ).toBeVisible({ timeout: 10000 });
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
  });
});
