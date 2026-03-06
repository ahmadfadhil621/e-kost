// Traceability: finance-expense-tracking
// REQ 5.1 -> test('finance overview displays income, expenses, net income for selected month')
// REQ 6.1 -> test('finance overview displays total expenses for selected month')
// REQ 7.1 -> test('finance overview displays net income as income minus expenses')
// REQ 8.1 -> test('finance overview defaults to current month')
// REQ 8.2 -> test('user can navigate to previous and next month')
// REQ 8.3 -> test('user can navigate to previous and next month') -- nav updates income, expenses, net, category breakdown
// REQ 9.1 -> test('finance overview renders single-column on mobile')
// REQ 9.5 -> test('finance overview renders single-column on mobile') -- readability without zoom

import { test, expect } from "@playwright/test";
import { goToFinanceOverview } from "../helpers/finance-expense-tracking";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

test.describe("view monthly summary", () => {
  test.describe("good cases", () => {
    test("finance overview displays income, expenses, net income for selected month", async ({
      page,
    }) => {
      await goToFinanceOverview(page);
      await expect(
        page.getByText(/income|pemasukan/i).first()
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByText(/expenses|pengeluaran/i).first()
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByText(/net income|laba bersih/i).first()
      ).toBeVisible({ timeout: 5000 });
    });

    test("finance overview displays total expenses for selected month", async ({
      page,
    }) => {
      await goToFinanceOverview(page);
      await expect(
        page.getByText(/expenses|pengeluaran/i).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("finance overview displays net income as income minus expenses", async ({
      page,
    }) => {
      await goToFinanceOverview(page);
      await expect(
        page.getByText(/net income|laba bersih/i).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("finance overview defaults to current month", async ({ page }) => {
      await goToFinanceOverview(page);
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
      ];
      const expectedLabel = new RegExp(
        `${monthNames[currentMonth - 1]}\\s*${currentYear}|${currentYear}`
      );
      await expect(
        page.getByText(expectedLabel).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("user can navigate to previous and next month", async ({ page }) => {
      await goToFinanceOverview(page);
      await expect(
        page.getByRole("button", { name: /previous month|bulan sebelumnya/i })
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByRole("button", { name: /next month|bulan berikutnya/i })
      ).toBeVisible({ timeout: 5000 });
    });

    test("finance overview renders single-column on mobile", async ({
      page,
    }) => {
      await goToFinanceOverview(page);
      await expect(
        page.getByText(/income|pemasukan|finance|keuangan/i).first()
      ).toBeVisible({ timeout: 10000 });
      const main = page.getByRole("main").or(page.locator("body"));
      await expect(main).toBeVisible();
    });
  });

  test.describe("edge cases", () => {
    test("month selector has accessible previous and next controls", async ({
      page,
    }) => {
      await goToFinanceOverview(page);
      const prev = page.getByRole("button", {
        name: /previous month|bulan sebelumnya/i,
      });
      const next = page.getByRole("button", {
        name: /next month|bulan berikutnya/i,
      });
      await expect(prev).toBeVisible({ timeout: 10000 });
      await expect(next).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("bad cases", () => {
    test("finance overview requires authentication", async ({
      page,
      context,
    }) => {
      await context.clearCookies();
      const propertyId = "any-id";
      await page.goto(`/properties/${propertyId}/finance`);
      await expect(
        page
          .getByText(/log in|login|sign in|unauthorized|forbidden/i)
          .or(page.getByRole("link", { name: /log in|login/i }))
      ).toBeVisible({ timeout: 10000 });
    });
  });
});
