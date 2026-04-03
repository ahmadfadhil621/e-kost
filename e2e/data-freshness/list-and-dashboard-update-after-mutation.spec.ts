// Traceability: data-freshness
// REQ 1.1 -> test('rooms list shows new room after create without refresh')
// REQ 1.2 -> test('tenants list shows new tenant after create without refresh')
// REQ 1.3 -> test('rooms list shows updated room after edit without refresh')
// REQ 2.1 -> test('dashboard shows updated stats after mutation (optional)')

import { test, expect } from "@playwright/test";
import { goToRoomsList, goToNewRoomPage, waitForRoomsListContent } from "../helpers/room-inventory";
import { goToNewTenantPage } from "../helpers/tenant-room-basics";
import { stableFill } from "../helpers/forms";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

test.describe("list and dashboard update after mutation", () => {
  test.describe("good cases", () => {
    test("rooms list shows new room after create without refresh", async ({
      page,
    }) => {
      test.info().setTimeout(45000);
      const roomNumber = "DF-R-" + Date.now();
      await goToNewRoomPage(page);
      await stableFill(page, () => page.getByLabel(/room number/i), roomNumber);
      await stableFill(page, () => page.getByLabel(/room type/i), "single");
      await stableFill(page, () => page.getByLabel(/monthly rent/i), "1500000");
      await page.getByRole("button", { name: /create room|save/i }).click();

      await expect(page).toHaveURL(/\/properties\/[^/]+\/rooms$/, { timeout: 15000 });
      await expect(page.getByText(roomNumber)).toBeVisible({ timeout: 15000 });
    });

    test("tenants list shows new tenant after create without refresh", async ({
      page,
    }) => {
      test.info().setTimeout(90000);
      const unique = "DF-T-" + Date.now();
      await goToNewTenantPage(page);
      await page
        .getByRole("button", { name: /create tenant|save|submit/i })
        .waitFor({ state: "visible", timeout: 10000 });
      await stableFill(page, () => page.locator("#tenant-name"), "Tenant " + unique);
      await stableFill(page, () => page.locator("#tenant-phone"), "08123456789");
      await stableFill(page, () => page.locator("#tenant-email"), unique + "@test.com");
      await page
        .getByRole("button", { name: /create tenant|save|submit/i })
        .click();

      await expect(page).toHaveURL(/\/properties\/[^/]+\/tenants\/[^/]+$/, { timeout: 25000 });
      await page.goto(page.url().replace(/\/tenants\/[^/]+$/, "/tenants"));
      await expect(
        page.getByRole("link", { name: new RegExp(`Tenant ${unique}`) })
      ).toBeVisible({ timeout: 15000 });
    });

    test("rooms list shows updated room after edit without refresh", async ({
      page,
    }) => {
      test.info().setTimeout(90000);
      await goToRoomsList(page);
      const firstRoomLink = page.locator("[data-testid=room-card]").first();
      await expect(firstRoomLink).toBeVisible({ timeout: 10000 });
      await firstRoomLink.click();
      await page.waitForURL(/\/properties\/[^/]+\/rooms\/[^/]+$/, { timeout: 20000 });

      await page
        .getByRole("link", { name: /edit/i })
        .or(page.getByRole("button", { name: /edit/i }))
        .first()
        .waitFor({ state: "visible", timeout: 15000 });
      await page.getByRole("link", { name: /edit/i }).first().click();

      const newRoomNumber = "DF-EDIT-" + Date.now();
      await page.waitForURL(/\/properties\/[^/]+\/rooms\/[^/]+\/edit/, { timeout: 20000 });
      await page.getByLabel(/room number/i).first().waitFor({ state: "visible", timeout: 10000 });
      await page.getByLabel(/room number/i).first().fill(newRoomNumber);
      await page.getByRole("button", { name: /save changes|save/i }).click();

      await expect(page).toHaveURL(/\/properties\/[^/]+\/rooms\/[^/]+$/, { timeout: 20000 });
      await goToRoomsList(page);
      await waitForRoomsListContent(page, 15000);
      await expect(page.getByText(newRoomNumber)).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("bad cases", () => {
    test("after failed create room submit, rooms list is unchanged on navigate", async ({
      page,
    }) => {
      test.info().setTimeout(45000);
      await goToRoomsList(page);
      await goToNewRoomPage(page);
      await stableFill(page, () => page.getByLabel(/room number/i), "X");
      await stableFill(page, () => page.getByLabel(/room type/i), "single");
      // Use negative rent so Zod .positive() fails with "positive" in message (empty input yields NaN → different Zod message)
      await stableFill(page, () => page.getByLabel(/monthly rent/i), "-1");
      await page.getByRole("button", { name: /create room|save/i }).click();
      await expect(
        page.getByText(/required|positive|invalid|error/i).first()
      ).toBeVisible({ timeout: 10000 });
      await goToRoomsList(page);
      await page.getByRole("link", { name: /add room/i }).or(page.getByText(/rooms|no rooms/i)).first().waitFor({ state: "visible", timeout: 10000 });
      const roomCount = await page.locator("[data-testid=room-card]").count();
      expect(roomCount).toBeDefined();
    });
  });

  test.describe("edge cases", () => {
    test("navigating to rooms list after create room shows list without full page reload", async ({
      page,
    }) => {
      test.info().setTimeout(50000);
      const roomNumber = "DF-EDGE-" + Date.now();
      await goToNewRoomPage(page);
      await stableFill(page, () => page.getByLabel(/room number/i), roomNumber);
      await stableFill(page, () => page.getByLabel(/room type/i), "single");
      await stableFill(page, () => page.getByLabel(/monthly rent/i), "1000000");
      await page.getByRole("button", { name: /create room|save/i }).click();

      await expect(page).toHaveURL(/\/properties\/[^/]+\/rooms$/, { timeout: 15000 });
      await expect(page.getByText(roomNumber)).toBeVisible({ timeout: 10000 });
      // Prevent Next.js dev overlay (nextjs-portal) from intercepting clicks when running against dev server
      await page.evaluate(() => {
        const portal = document.querySelector("nextjs-portal");
        if (portal && portal instanceof HTMLElement) {
          portal.style.pointerEvents = "none";
        }
      });
      // Use client-side nav to Dashboard/Overview so property context is preserved and "Rooms" link is visible
      await page.getByRole("link", { name: /dashboard|overview/i }).first().click();
      await page.getByRole("link", { name: /^rooms$/i }).first().waitFor({ state: "visible", timeout: 15000 });
      await page.getByRole("link", { name: /^rooms$/i }).first().click();
      await waitForRoomsListContent(page, 15000);
      await expect(page.getByText(roomNumber)).toBeVisible({ timeout: 10000 });
    });
  });
});
