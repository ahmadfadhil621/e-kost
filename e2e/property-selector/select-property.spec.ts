// Traceability: multi-property-management / property selection flow
// Plan: With auth state "user has properties, none selected", opening app at /
//       redirects to /properties; tapping a property leads to the dashboard.

import { test, expect } from "@playwright/test";

test.use({ storageState: "e2e/.auth/user-properties-no-active.json" });

test.describe("select property", () => {
  test.describe("good cases", () => {
    test("when no property is selected, / redirects to /properties", async ({
      page,
    }) => {
      await page.goto("/");

      await expect(page).toHaveURL(/\/properties$/, { timeout: 15000 });
      await expect(
        page.getByRole("heading", {
          name: /my properties|properti saya/i,
        })
      ).toBeVisible({ timeout: 5000 });
    });

    test("property cards are visible at /properties", async ({ page }) => {
      await page.goto("/properties");

      const card = page.getByText(/e2e selector property|selector property/i).first();
      await expect(card).toBeVisible({ timeout: 10000 });
    });

    test("tapping a property card leads to the dashboard", async ({ page }) => {
      await page.goto("/properties");

      await page
        .getByText(/e2e selector property|selector property|456 selector/i)
        .first()
        .click();

      await expect(page).toHaveURL(/\/$/, { timeout: 15000 });
      await expect(
        page.getByRole("main").or(page.getByRole("heading", { name: /overview|dashboard|occupancy|create property/i }))
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("bad cases", () => {
    test("unauthenticated user is redirected when opening app", async ({
      page,
      context,
    }) => {
      await context.clearCookies();
      await page.goto("/");

      await expect(
        page.getByText(/log in|login|sign in/i).or(
          page.getByRole("link", { name: /log in|login/i })
        )
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("edge cases", () => {
    test("direct navigation to app root with no active property redirects to /properties", async ({
      page,
    }) => {
      await page.goto("/");

      await expect(page).toHaveURL(/\/properties$/, { timeout: 15000 });
    });
  });
});
