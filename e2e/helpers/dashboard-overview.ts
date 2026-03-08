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
    .getByText(/dashboard|overview|ringkasan|occupancy|okupansi|rooms|kamar/i)
    .first()
    .waitFor({ state: "visible", timeout: 15000 });
}
