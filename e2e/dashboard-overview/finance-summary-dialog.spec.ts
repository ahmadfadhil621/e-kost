// Traceability: finance-summary-card-detail-popup
// REQ 1 -> test('clicking income trigger opens income detail dialog')
// REQ 2 -> test('clicking expenses trigger opens expense breakdown dialog')
// REQ 3 -> test('income dialog shows income label and from-rent text')
// REQ 4 -> test('expenses dialog shows expense breakdown title')
// REQ 5 -> test('income dialog closes when dismissed via close button')
// REQ 5 -> test('expenses dialog closes when dismissed via Escape key')
// REQ 6 -> test('income and expenses triggers meet minimum touch target size')

import { test, expect } from "@playwright/test";
import { goToDashboard } from "../helpers/dashboard-overview";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

test.describe("finance summary dialog", () => {
  test.describe("good cases", () => {
    test("clicking income trigger opens income detail dialog", async ({
      page,
    }) => {
      test.info().setTimeout(60000);
      await goToDashboard(page);

      const card = page.getByTestId("finance-summary-card");
      await expect(card).toBeVisible({ timeout: 15000 });

      await page.getByTestId("finance-income-trigger").click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 5000 });
      await expect(dialog).toContainText(/income detail/i);
      await expect(dialog).toContainText(/from rent payments/i);
    });

    test("clicking expenses trigger opens expense breakdown dialog", async ({
      page,
    }) => {
      test.info().setTimeout(60000);
      await goToDashboard(page);

      const card = page.getByTestId("finance-summary-card");
      await expect(card).toBeVisible({ timeout: 15000 });

      await page.getByTestId("finance-expenses-trigger").click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 5000 });
      await expect(dialog).toContainText(/expense breakdown/i);
    });

    test("income dialog closes when dismissed via close button", async ({
      page,
    }) => {
      test.info().setTimeout(60000);
      await goToDashboard(page);

      const card = page.getByTestId("finance-summary-card");
      await expect(card).toBeVisible({ timeout: 15000 });

      await page.getByTestId("finance-income-trigger").click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 5000 });

      await page
        .getByRole("button", { name: /close|tutup/i })
        .last()
        .click();

      await expect(dialog).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("bad cases", () => {
    test("no dialog is visible on initial dashboard load", async ({ page }) => {
      test.info().setTimeout(60000);
      await goToDashboard(page);

      const card = page.getByTestId("finance-summary-card");
      await expect(card).toBeVisible({ timeout: 15000 });

      await expect(page.getByRole("dialog")).not.toBeVisible();
    });
  });

  test.describe("edge cases", () => {
    test("income dialog does not show expense-breakdown content", async ({
      page,
    }) => {
      test.info().setTimeout(60000);
      await goToDashboard(page);

      const card = page.getByTestId("finance-summary-card");
      await expect(card).toBeVisible({ timeout: 15000 });

      await page.getByTestId("finance-income-trigger").click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 5000 });
      await expect(dialog).not.toContainText(/expense breakdown/i);
    });

    test("expenses dialog does not show from-rent-payments content", async ({
      page,
    }) => {
      test.info().setTimeout(60000);
      await goToDashboard(page);

      const card = page.getByTestId("finance-summary-card");
      await expect(card).toBeVisible({ timeout: 15000 });

      await page.getByTestId("finance-expenses-trigger").click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 5000 });
      await expect(dialog).not.toContainText(/from rent payments/i);
    });

    test("expenses dialog closes when dismissed via Escape key", async ({
      page,
    }) => {
      test.info().setTimeout(60000);
      await goToDashboard(page);

      const card = page.getByTestId("finance-summary-card");
      await expect(card).toBeVisible({ timeout: 15000 });

      await page.getByTestId("finance-expenses-trigger").click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 5000 });

      await page.keyboard.press("Escape");

      await expect(dialog).not.toBeVisible({ timeout: 5000 });
    });

    test("income and expenses triggers meet minimum touch target size", async ({
      page,
    }) => {
      test.info().setTimeout(60000);
      await goToDashboard(page);

      const card = page.getByTestId("finance-summary-card");
      await expect(card).toBeVisible({ timeout: 15000 });

      const incomeTrigger = page.getByTestId("finance-income-trigger");
      const expensesTrigger = page.getByTestId("finance-expenses-trigger");

      const incomeBox = await incomeTrigger.boundingBox();
      const expensesBox = await expensesTrigger.boundingBox();

      expect(incomeBox).not.toBeNull();
      expect(expensesBox).not.toBeNull();

      if (incomeBox) {
        expect(incomeBox.height).toBeGreaterThanOrEqual(44);
      }
      if (expensesBox) {
        expect(expensesBox.height).toBeGreaterThanOrEqual(44);
      }
    });
  });
});
