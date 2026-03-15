import * as fs from "fs";
import * as path from "path";
import type { Page } from "@playwright/test";

export function getPropertyId(): string {
  const filePath = path.join(process.cwd(), "e2e/.auth/property-id.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return data.propertyId;
}

export async function goToPaymentsList(page: Page) {
  const propertyId = getPropertyId();
  await page.goto(`/properties/${propertyId}/payments`);
  await page
    .getByRole("link", { name: /record payment|payments|no payments/i })
    .or(page.getByText(/payment history|riwayat pembayaran/i))
    .first()
    .waitFor({ state: "visible", timeout: 15000 });
}

export async function goToRecordPaymentPage(page: Page) {
  const propertyId = getPropertyId();
  await page.goto(`/properties/${propertyId}/payments/new`);
  await page
    .getByLabel(/tenant|penyewa/i)
    .first()
    .waitFor({ state: "visible", timeout: 20000 });
}
