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
