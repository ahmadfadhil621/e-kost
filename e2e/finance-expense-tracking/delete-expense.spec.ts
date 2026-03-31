// Traceability: finance-inline-cards (issue #86)
// AC-EL-4 -> test('delete expense from list card with confirmation removes it from the list')
// AC-EL-5 -> test('cancelling delete confirmation keeps expense in list')
// AC-EL-8 -> test('delete button meets 44px touch target requirement')

import { test, expect } from "@playwright/test";
import {
  getPropertyId,
  goToExpenseList,
} from "../helpers/finance-expense-tracking";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

test.describe("delete expense", () => {
  test.describe("good cases", () => {
    test("delete expense from list card with confirmation removes it from the list", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const date = new Date().toISOString().split("T")[0];
      const uniqueDesc = `E2E delete test expense ${Date.now()}`;

      // Create a throwaway expense via API
      const res = await page.request.post(
        `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/expenses`,
        {
          data: {
            category: "cleaning",
            amount: 88000,
            date,
            description: uniqueDesc,
          },
        }
      );
      expect(res.ok(), `Create expense failed: ${await res.text()}`).toBe(true);

      await goToExpenseList(page);

      // Find the specific expense card and open its overflow menu
      const expenseCard = page.locator("li").filter({ hasText: uniqueDesc });
      await expenseCard
        .getByRole("button", { name: /more|options|lainnya/i })
        .click({ timeout: 10000 });

      // Click delete in the dropdown menu
      await page
        .getByRole("menuitem", { name: /delete|hapus/i })
        .click({ timeout: 5000 });

      // Confirmation dialog should appear — click the confirm button
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /delete|hapus/i })
        .last()
        .click({ timeout: 10000 });

      // Should stay on the expense list
      await expect(page).toHaveURL(/\/finance\/expenses$/, { timeout: 15000 });

      // The deleted expense's description should no longer be visible
      await expect(
        page.getByText(uniqueDesc)
      ).toHaveCount(0, { timeout: 10000 });
    });
  });

  test.describe("bad cases", () => {
    test("cancelling delete confirmation keeps expense in list", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const date = new Date().toISOString().split("T")[0];
      const uniqueDesc = `E2E cancel-delete ${Date.now()}`;

      // Create a fresh expense with a unique description
      const res = await page.request.post(
        `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/expenses`,
        {
          data: {
            category: "maintenance",
            amount: 55000,
            date,
            description: uniqueDesc,
          },
        }
      );
      expect(res.ok(), `Create expense failed: ${await res.text()}`).toBe(true);

      await goToExpenseList(page);

      // Open overflow menu on a card
      await page
        .getByRole("button", { name: /more|options|lainnya/i })
        .first()
        .click({ timeout: 10000 });

      // Click delete in the dropdown menu
      await page
        .getByRole("menuitem", { name: /delete|hapus/i })
        .click({ timeout: 5000 });

      // Click Cancel in the dialog
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /cancel|batal/i })
        .click({ timeout: 5000 });

      // The expense description should still be visible
      await expect(
        page.getByText(uniqueDesc)
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("edge cases", () => {
    test("delete button meets 44px touch target requirement", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(45000);
      await page.setViewportSize({ width: 390, height: 844 });

      const propertyId = getPropertyId();
      const date = new Date().toISOString().split("T")[0];

      // Ensure at least one expense exists
      await page.request.post(
        `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/expenses`,
        {
          data: { category: "water", amount: 30000, date },
        }
      );

      await goToExpenseList(page);

      const moreButton = page
        .getByRole("button", { name: /more|options|lainnya/i })
        .first();

      await expect(moreButton).toBeVisible({ timeout: 10000 });

      const box = await moreButton.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.width).toBeGreaterThanOrEqual(44);
      }
    });
  });
});
