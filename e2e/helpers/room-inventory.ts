import * as fs from "fs";
import * as path from "path";
import type { Page } from "@playwright/test";

function getPropertyId(): string {
  const filePath = path.join(process.cwd(), "e2e/.auth/property-id.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return data.propertyId;
}

const GOTO_OPTIONS = { waitUntil: "domcontentloaded" as const };

/** Wait for rooms list content (add room link or empty state). Call after navigation or client-side route to rooms. */
export async function waitForRoomsListContent(page: Page, timeout = 15000) {
  await page.getByText(/loading/i).first().waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  await page
    .getByRole("link", { name: /add room/i })
    .or(page.getByText(/rooms|no rooms found/i))
    .first()
    .waitFor({ state: "visible", timeout });
}

/** Wait for rooms list to be ready (list or empty state). Uses domcontentloaded for faster navigation. */
export async function goToRoomsList(page: Page) {
  const propertyId = getPropertyId();
  const roomsUrl = `/properties/${propertyId}/rooms`;
  const currentPath = new URL(page.url()).pathname.replace(/\/$/, "");
  if (currentPath !== roomsUrl) {
    await page.goto(roomsUrl, GOTO_OPTIONS);
  }
  await page.waitForURL(/\/properties\/[^/]+\/rooms/, { timeout: 8000 }).catch(() => {});
  if (page.url().includes("/login")) {
    throw new Error(
      "goToRoomsList: redirected to login; check auth storage state (e2e/.auth/user-with-property.json)"
    );
  }
  await waitForRoomsListContent(page);
}

export async function goToNewRoomPage(page: Page) {
  const propertyId = getPropertyId();
  await page.goto(`/properties/${propertyId}/rooms/new`, GOTO_OPTIONS);
  await page.waitForURL(/\/properties\/[^/]+\/rooms\/new/, { timeout: 8000 }).catch(() => {});
  if (page.url().includes("/login")) {
    throw new Error(
      "goToNewRoomPage: redirected to login; check auth storage state (e2e/.auth/user-with-property.json)"
    );
  }
  await page
    .getByLabel(/room number/i)
    .first()
    .waitFor({ state: "visible", timeout: 15000 });
}
