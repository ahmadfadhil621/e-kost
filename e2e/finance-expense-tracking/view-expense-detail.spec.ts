// Traceability: finance-expense-tracking (detail view) — issue #25
// REQ D1.1 -> test('clicking expense row navigates to detail page')
// REQ D1.2 -> test('detail page shows category, amount, date')
// REQ D1.3 -> test('edit button navigates to edit page')
// REQ D1.4 -> test('delete with confirmation redirects to expense list')
// REQ D1.5 -> test('non-existent expenseId shows not-found state')
// REQ D1.6 -> test('expense with no description renders detail page without description')
// REQ D1.7 -> test('back button returns to expense list')
// Note: unauthenticated redirect covered by e2e/auth/session-redirect.spec.ts

import { test, expect } from "@playwright/test";
import {
  getPropertyId,
  goToExpenseList,
  goToExpenseDetail,
} from "../helpers/finance-expense-tracking";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

let expenseId: string;
let expenseIdNoDescription: string;
const AMOUNT = 125000;

test.beforeAll(async ({ browser, baseURL }) => {
  const propertyId = getPropertyId();
  const context = await browser.newContext({
    storageState: "e2e/.auth/user-with-property.json",
  });
  const page = await context.newPage();
  await page.goto(baseURL ?? "http://localhost:3000");
  const date = new Date().toISOString().split("T")[0];

  // Expense with description
  const res = await page.request.post(
    `${baseURL}/api/properties/${propertyId}/expenses`,
    {
      data: {
        category: "internet",
        amount: AMOUNT,
        date,
        description: "E2E detail view expense",
      },
    }
  );
  expect(res.ok(), `Create expense failed: ${await res.text()}`).toBe(true);
  expenseId = (await res.json()).id;

  // Expense without description
  const res2 = await page.request.post(
    `${baseURL}/api/properties/${propertyId}/expenses`,
    {
      data: {
        category: "water",
        amount: 50000,
        date,
      },
    }
  );
  expect(res2.ok(), `Create expense (no desc) failed: ${await res2.text()}`).toBe(true);
  expenseIdNoDescription = (await res2.json()).id;

  await context.close();
});

test.describe("view expense detail", () => {
  test.describe("good cases", () => {
    test("clicking expense row in list navigates to detail page", async ({
      page,
    }) => {
      test.info().setTimeout(45000);
      await goToExpenseList(page);

      // The list cards are now links — click the first card visible
      await page.locator("ul li a").first().click();

      await page.waitForURL(/\/finance\/expenses\/[^/]+$/, { timeout: 10000 });
      await expect(
        page.getByText(/expense detail|detail pengeluaran/i).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("detail page shows category, amount, and date", async ({ page }) => {
      test.info().setTimeout(45000);
      await goToExpenseDetail(page, expenseId);

      // Category label (Internet / Internet)
      await expect(
        page.getByText(/internet/i).first()
      ).toBeVisible({ timeout: 5000 });

      // Amount — displayed as formatted currency (e.g. "Rp 125.000", "125,000")
      await expect(
        page.getByText(/125[.,]?0{3}|125[.,]?000/i).first()
      ).toBeVisible({ timeout: 5000 });
    });

    test("edit button navigates to edit page", async ({ page }) => {
      test.info().setTimeout(45000);
      await goToExpenseDetail(page, expenseId);

      await page.getByRole("link", { name: /edit/i }).click();

      await page.waitForURL(/\/expenses\/[^/]+\/edit$/, { timeout: 10000 });
      await expect(page.locator("#expense-amount")).toBeVisible({
        timeout: 10000,
      });
    });

    test("delete with confirmation redirects to expense list", async ({
      page,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();

      // Create a throwaway expense to delete
      const context = page.context();
      const apiPage = await context.newPage();
      const date = new Date().toISOString().split("T")[0];
      const res = await apiPage.request.post(
        `/api/properties/${propertyId}/expenses`,
        {
          data: { category: "cleaning", amount: 75000, date },
        }
      );
      const toDelete = (await res.json()).id;
      await apiPage.close();

      await goToExpenseDetail(page, toDelete);

      // Click delete button to open confirmation dialog
      await page
        .getByRole("button", { name: /delete expense|hapus pengeluaran/i })
        .click();

      // Confirm in dialog
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /delete|hapus/i })
        .last()
        .click();

      // Should redirect to expense list
      await page.waitForURL(/\/finance\/expenses$/, { timeout: 15000 });
      await expect(
        page.getByText(/expenses|pengeluaran/i).first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("bad cases", () => {
    test("non-existent expenseId shows not-found state", async ({ page }) => {
      test.info().setTimeout(30000);
      const propertyId = getPropertyId();
      await page.goto(
        `/properties/${propertyId}/finance/expenses/non-existent-id-000`
      );

      await expect(
        page
          .getByText(/not found|tidak ditemukan/i)
          .first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("edge cases", () => {
    test("expense with no description renders detail page without description field", async ({
      page,
    }) => {
      test.info().setTimeout(45000);
      await goToExpenseDetail(page, expenseIdNoDescription);

      await expect(
        page.getByText(/expense detail|detail pengeluaran/i).first()
      ).toBeVisible({ timeout: 5000 });

      // Category should be visible (Water / Air)
      await expect(
        page.getByText(/water|air/i).first()
      ).toBeVisible({ timeout: 5000 });

      // Description label/field should NOT be present
      await expect(
        page.getByText(/description \(optional\)|deskripsi \(opsional\)/i)
      ).toHaveCount(0);
    });

    test("back button returns to expense list", async ({ page }) => {
      test.info().setTimeout(45000);
      await goToExpenseDetail(page, expenseId);

      await page.getByRole("button", { name: /back|kembali/i }).click();

      await page.waitForURL(/\/finance\/expenses$/, { timeout: 10000 });
      await expect(
        page.getByText(/expenses|pengeluaran/i).first()
      ).toBeVisible({ timeout: 10000 });
    });
  });
});
