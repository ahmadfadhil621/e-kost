import * as fs from "fs";
import * as path from "path";
import type { Page } from "@playwright/test";

function getPropertyId(): string {
  const filePath = path.join(process.cwd(), "e2e/.auth/property-id.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return data.propertyId;
}

/** Wait for rooms list to be ready (list or empty state). Resilient to slow API locally. */
export async function goToRoomsList(page: Page) {
  const propertyId = getPropertyId();
  await page.goto(`/properties/${propertyId}/rooms`);
  // Wait for loading to finish (optional short wait), then for final content.
  await page.getByText(/loading/i).first().waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  await page
    .getByRole("link", { name: /add room/i })
    .or(page.getByText(/rooms|no rooms found/i))
    .first()
    .waitFor({ state: "visible", timeout: 25000 });
}

export async function goToNewRoomPage(page: Page) {
  const propertyId = getPropertyId();
  await page.goto(`/properties/${propertyId}/rooms/new`);
  await page
    .getByLabel(/room number/i)
    .first()
    .waitFor({ state: "visible", timeout: 20000 });
}
