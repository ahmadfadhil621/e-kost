import * as fs from "fs";
import * as path from "path";
import type { Page } from "@playwright/test";

export function getPropertyId(): string {
  const filePath = path.join(process.cwd(), "e2e/.auth/property-id.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return data.propertyId;
}

export async function goToFinanceOverview(page: Page) {
  const propertyId = getPropertyId();
  await page.goto(`/properties/${propertyId}/finance`);
  await page
    .getByText(/income|pemasukan|finance|keuangan|net income|laba bersih/i)
    .first()
    .waitFor({ state: "visible", timeout: 15000 });
}

export async function goToExpenseList(page: Page) {
  const propertyId = getPropertyId();
  await page.goto(`/properties/${propertyId}/finance/expenses`);
  await page
    .getByText(/expenses|pengeluaran|add expense|tambah pengeluaran|no expenses/i)
    .first()
    .waitFor({ state: "visible", timeout: 15000 });
}

export async function goToExpenseDetail(page: Page, expenseId: string) {
  const propertyId = getPropertyId();
  await page.goto(`/properties/${propertyId}/finance/expenses/${expenseId}`);
  await page.waitForURL(/\/expenses\/[^/]+(?!\/edit)$/, { timeout: 8000 }).catch(() => {});
  if (page.url().includes("/login")) {
    throw new Error(
      "goToExpenseDetail: redirected to login; check auth storage state (e2e/.auth/user-with-property.json)"
    );
  }
  await page
    .getByText(/expense detail|detail pengeluaran/i)
    .first()
    .waitFor({ state: "visible", timeout: 15000 });
}

export async function goToEditExpensePage(page: Page, expenseId: string) {
  const propertyId = getPropertyId();
  await page.goto(`/properties/${propertyId}/finance/expenses/${expenseId}/edit`);
  await page.waitForURL(/\/expenses\/[^/]+\/edit/, { timeout: 8000 }).catch(() => {});
  if (page.url().includes("/login")) {
    throw new Error(
      "goToEditExpensePage: redirected to login; check auth storage state (e2e/.auth/user-with-property.json)"
    );
  }
  await page
    .locator("#expense-amount")
    .waitFor({ state: "visible", timeout: 15000 });
}
