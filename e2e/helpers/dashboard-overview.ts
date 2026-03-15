import * as path from "path";
import * as fs from "fs";
import type { Page } from "@playwright/test";

export function getPropertyId(): string {
  const filePath = path.join(process.cwd(), "e2e/.auth/property-id.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return data.propertyId;
}

export async function goToDashboard(page: Page) {
  await page.goto("/");
  await page
    .getByTestId("occupancy-card")
    .or(page.getByTestId("finance-summary-card"))
    .or(page.getByTestId("outstanding-balances-list"))
    .or(page.getByTestId("recent-payments-list"))
    .first()
    .waitFor({ state: "visible", timeout: 15000 });
}
