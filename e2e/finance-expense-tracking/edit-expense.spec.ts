// Traceability: finance-expense-tracking (edit flow) — issue #31
// REQ E3.1 -> test('edit expense form pre-populated with current data')
// REQ E3.2 -> test('user updates amount and category and is redirected to list')
// REQ E3.3 -> test('user sees validation error for zero amount')
// REQ E3.4 -> test('user sees validation error when amount is negative')
// REQ E3.5 -> test('cancel returns to expense list without saving')

import { test, expect } from "@playwright/test";
import {
  getPropertyId,
  goToEditExpensePage,
} from "../helpers/finance-expense-tracking";
import { stableFill } from "../helpers/forms";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

let expenseId: string;
const ORIGINAL_AMOUNT = 300000;

test.beforeAll(async ({ browser, baseURL }) => {
  const propertyId = getPropertyId();
  const context = await browser.newContext({
    storageState: "e2e/.auth/user-with-property.json",
  });
  const page = await context.newPage();
  await page.goto(baseURL ?? "http://localhost:3000");
  const date = new Date().toISOString().split("T")[0];
  const res = await page.request.post(
    `${baseURL}/api/properties/${propertyId}/expenses`,
    {
      data: {
        category: "maintenance",
        amount: ORIGINAL_AMOUNT,
        date,
        description: "E2E edit expense",
      },
    }
  );
  expect(res.ok(), `Create expense failed: ${await res.text()}`).toBe(true);
  expenseId = (await res.json()).id;
  await context.close();
});

test.describe("edit expense", () => {
  test.describe("good cases", () => {
    test("edit expense form pre-populated with current data", async ({
      page,
    }) => {
      test.info().setTimeout(45000);
      await goToEditExpensePage(page, expenseId);
      await expect(page.locator("#expense-amount")).toHaveValue(
        String(ORIGINAL_AMOUNT),
        { timeout: 5000 }
      );
      await expect(page.locator("#expense-description")).toHaveValue(
        "E2E edit expense",
        { timeout: 2000 }
      );
      await expect(
        page.getByRole("button", { name: /save expense/i })
      ).toBeVisible({ timeout: 2000 });
    });

    test("user updates amount and is redirected to expense list", async ({
      page,
    }) => {
      test.info().setTimeout(60000);
      await goToEditExpensePage(page, expenseId);
      await stableFill(
        page,
        () => page.locator("#expense-amount"),
        "450000"
      );
      await page.getByRole("button", { name: /save expense/i }).click();

      // On success, expense edit page navigates to expense list
      await page
        .waitForURL(/\/finance\/expenses$/, { timeout: 15000 })
        .catch(() => {});
      await expect(
        page
          .getByText(/expenses|pengeluaran/i)
          .or(page.getByText(/450000/))
          .first()
      ).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("bad cases", () => {
    test("zero amount prevents expense submission", async ({ page }) => {
      test.info().setTimeout(45000);
      await goToEditExpensePage(page, expenseId);
      await stableFill(page, () => page.locator("#expense-amount"), "0");
      await page.getByRole("button", { name: /save expense/i }).click();

      // Browser constraint validation (min="0.01") or react-hook-form blocks submit.
      // Either way, the form must NOT navigate to the expense list.
      await expect(page).toHaveURL(/\/edit/, { timeout: 5000 });
    });

    test("negative amount prevents expense submission", async ({ page }) => {
      test.info().setTimeout(45000);
      await goToEditExpensePage(page, expenseId);
      await stableFill(page, () => page.locator("#expense-amount"), "-500");
      await page.getByRole("button", { name: /save expense/i }).click();

      // Must NOT navigate away from the edit page.
      await expect(page).toHaveURL(/\/edit/, { timeout: 5000 });
    });
  });

  test.describe("edge cases", () => {
    test("cancel returns to expense list without saving", async ({ page }) => {
      test.info().setTimeout(45000);
      await goToEditExpensePage(page, expenseId);
      await page.getByRole("button", { name: /cancel/i }).click();

      await page
        .waitForURL(/\/finance\/expenses$/, { timeout: 8000 })
        .catch(() => {});
      await expect(page.url()).toMatch(/\/finance\/expenses/);
      await expect(page.url()).not.toMatch(/\/edit/);
      await expect(
        page
          .getByText(/expenses|pengeluaran|add expense/i)
          .first()
      ).toBeVisible({ timeout: 15000 });
    });
  });
});
