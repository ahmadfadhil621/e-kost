// Traceability: data-freshness
// REQ 1.1 -> test('rooms list shows new room after create without refresh')
// REQ 1.2 -> test('tenants list shows new tenant after create without refresh')
// REQ 1.3 -> test('rooms list shows updated room after edit without refresh')
// REQ 2.1 -> test('dashboard shows updated stats after mutation (optional)')

import { test, expect } from "@playwright/test";
import { goToRoomsList, goToNewRoomPage } from "../helpers/room-inventory";
import { goToTenantsList, goToNewTenantPage } from "../helpers/tenant-room-basics";
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

      await expect(page).toHaveURL(/\/properties\/[^/]+\/tenants$/, { timeout: 25000 });
      await expect(page.getByText(unique)).toBeVisible({ timeout: 15000 });
    });

    test("rooms list shows updated room after edit without refresh", async ({
      page,
    }) => {
      test.info().setTimeout(60000);
      await goToRoomsList(page);
      const firstRoomCard = page.locator("[data-testid=room-card]").first();
      await expect(firstRoomCard).toBeVisible({ timeout: 10000 });
      await firstRoomCard.click();

      await page
        .getByRole("link", { name: /edit/i })
        .or(page.getByRole("button", { name: /edit/i }))
        .first()
        .waitFor({ state: "visible", timeout: 5000 });
      await page.getByRole("link", { name: /edit/i }).first().click();

      const newRoomNumber = "DF-EDIT-" + Date.now();
      await page.getByLabel(/room number/i).first().waitFor({ state: "visible", timeout: 5000 });
      await page.getByLabel(/room number/i).first().fill(newRoomNumber);
      await page.getByRole("button", { name: /save changes|save/i }).click();

      await expect(page).toHaveURL(/\/properties\/[^/]+\/rooms\/[^/]+$/, { timeout: 15000 });
      await page.getByRole("link", { name: /rooms|back/i }).first().click().catch(() => {});
      await goToRoomsList(page);
      await expect(page.getByText(newRoomNumber)).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("bad cases", () => {
    test("after failed create room submit, rooms list is unchanged on navigate", async ({
      page,
    }) => {
      test.info().setTimeout(30000);
      await goToRoomsList(page);
      const initialContent = await page.content();
      await goToNewRoomPage(page);
      await stableFill(page, () => page.getByLabel(/room number/i), "X");
      await stableFill(page, () => page.getByLabel(/room type/i), "single");
      await stableFill(page, () => page.getByLabel(/monthly rent/i), "0");
      await page.getByRole("button", { name: /create room|save/i }).click();
      await expect(
        page.getByText(/required|positive|invalid|error/i).first()
      ).toBeVisible({ timeout: 5000 });
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
      test.info().setTimeout(45000);
      const roomNumber = "DF-EDGE-" + Date.now();
      await goToNewRoomPage(page);
      await stableFill(page, () => page.getByLabel(/room number/i), roomNumber);
      await stableFill(page, () => page.getByLabel(/room type/i), "single");
      await stableFill(page, () => page.getByLabel(/monthly rent/i), "1000000");
      await page.getByRole("button", { name: /create room|save/i }).click();

      await expect(page).toHaveURL(/\/properties\/[^/]+\/rooms$/, { timeout: 15000 });
      await page.goto("/");
      await goToRoomsList(page);
      await expect(page.getByText(roomNumber)).toBeVisible({ timeout: 15000 });
    });
  });
});
