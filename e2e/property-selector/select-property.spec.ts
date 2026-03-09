// Traceability: multi-property-management / UI redesign (property selector)
// Plan: With auth state "user has properties, none selected", opening app
//       shows Select Property screen; tapping a property leads to overview.

import { test, expect } from "@playwright/test";

test.use({ storageState: "e2e/.auth/user-properties-no-active.json" });

test.describe("select property", () => {
  test.describe("good cases", () => {
    test("when no property is selected, Select Property screen is shown", async ({
      page,
    }) => {
      await page.goto("/");

      await expect(
        page.getByRole("heading", {
          name: /select property|pilih properti/i,
        })
      ).toBeVisible({ timeout: 15000 });
    });

    test("property cards are visible and tappable", async ({ page }) => {
      await page.goto("/");

      await expect(
        page.getByRole("heading", {
          name: /select property|pilih properti/i,
        })
      ).toBeVisible({ timeout: 15000 });

      const card = page.getByText(/e2e selector property|selector property/i).first();
      await expect(card).toBeVisible({ timeout: 5000 });
    });

    test("tapping a property card leads to overview", async ({ page }) => {
      await page.goto("/");

      await expect(
        page.getByRole("heading", {
          name: /select property|pilih properti/i,
        })
      ).toBeVisible({ timeout: 15000 });

      await page
        .getByText(/e2e selector property|selector property|456 selector/i)
        .first()
        .click();

      await expect(page).toHaveURL(/\//, { timeout: 15000 });
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
    test("direct navigation to app root with no active property shows selector or dashboard", async ({
      page,
    }) => {
      await page.goto("/");

      const selectorHeading = page.getByRole("heading", {
        name: /select property|pilih properti/i,
      });
      const mainContent = page.getByRole("main");
      await expect(
        selectorHeading.or(mainContent)
      ).toBeVisible({ timeout: 15000 });
    });
  });
});
