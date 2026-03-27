// Traceability: nav-disabled-no-property (issue #79)
// Plan: When no active property is set and user has multiple properties,
//       nav items for property-scoped routes are disabled (aria-disabled, pointer-events-none).
//       When user has exactly one property, it is auto-selected on app load.

import { test, expect } from "@playwright/test";

test.describe("nav disabled — no active property", () => {
  // This spec uses user-properties-no-active.json (2 properties, no active).
  // Overridden per test below when needed.

  test.describe("good cases", () => {
    test.use({ storageState: "e2e/.auth/user-properties-no-active.json" });

    test("nav items Rooms, Tenants, Finance are aria-disabled when no property is active", async ({
      page,
    }) => {
      await page.goto("/properties");

      const nav = page.getByRole("navigation");
      await expect(nav).toBeVisible({ timeout: 10000 });

      // Rooms, Tenants, Finance should be disabled
      const rooms = nav.getByRole("link", { name: /rooms|kamar/i });
      const tenants = nav.getByRole("link", { name: /tenants|penyewa/i });
      const finance = nav.getByRole("link", { name: /finance|keuangan/i });

      await expect(rooms).toHaveAttribute("aria-disabled", "true");
      await expect(tenants).toHaveAttribute("aria-disabled", "true");
      await expect(finance).toHaveAttribute("aria-disabled", "true");
    });

    test("Overview nav item is NOT disabled when no property is active", async ({
      page,
    }) => {
      await page.goto("/properties");

      const nav = page.getByRole("navigation");
      await expect(nav).toBeVisible({ timeout: 10000 });

      const overview = nav.getByRole("link", { name: /overview|dashboard|dasbor/i });
      await expect(overview).not.toHaveAttribute("aria-disabled", "true");
    });

    test("disabled nav items do not navigate when tapped (no active property)", async ({
      page,
    }) => {
      await page.goto("/properties");

      await expect(page.getByRole("navigation")).toBeVisible({ timeout: 10000 });

      const roomsLink = page
        .getByRole("navigation")
        .getByRole("link", { name: /rooms|kamar/i });

      await expect(roomsLink).toHaveAttribute("aria-disabled", "true");

      // Clicking a disabled item should not change the URL
      await roomsLink.click({ force: true });
      await expect(page).toHaveURL(/\/properties$/, { timeout: 5000 });
    });
  });

  test.describe("auto-select single property", () => {
    test.use({ storageState: "e2e/.auth/user-single-property-no-active.json" });

    test("user with exactly one property is auto-directed to dashboard (not /properties)", async ({
      page,
    }) => {
      await page.goto("/");

      // Should NOT stay on /properties — auto-select kicks in
      await expect(page).not.toHaveURL(/\/properties$/, { timeout: 15000 });
      // Should end up on dashboard (root or property-scoped route)
      await expect(page).toHaveURL(/\/$/, { timeout: 15000 });
    });

    test("after auto-select, nav items are enabled", async ({ page }) => {
      await page.goto("/");

      // Wait for the dashboard content to appear — confirms activePropertyId is set
      // and PropertyProvider has propagated it to the nav.
      await expect(
        page
          .getByTestId("occupancy-card")
          .or(page.getByTestId("finance-summary-card"))
          .or(page.getByRole("heading", { name: /overview|dashboard|dasbor/i }))
          .first()
      ).toBeVisible({ timeout: 20000 });

      const nav = page.getByRole("navigation");
      const rooms = nav.getByRole("link", { name: /rooms|kamar/i });
      await expect(rooms).not.toHaveAttribute("aria-disabled", "true", {
        timeout: 10000,
      });
    });
  });

  test.describe("accessibility", () => {
    test.use({ storageState: "e2e/.auth/user-properties-no-active.json" });

    test("disabled nav items remain reachable via keyboard (tabIndex=0)", async ({
      page,
    }) => {
      await page.goto("/properties");

      const nav = page.getByRole("navigation");
      await expect(nav).toBeVisible({ timeout: 10000 });

      // Disabled items should have tabindex=0 so keyboard users can reach them
      const roomsItem = nav.getByRole("link", { name: /rooms|kamar/i });
      await expect(roomsItem).toHaveAttribute("tabindex", "0");
    });

    test("disabled nav items maintain minimum 44px touch targets", async ({
      page,
    }) => {
      await page.goto("/properties");

      const nav = page.getByRole("navigation");
      await expect(nav).toBeVisible({ timeout: 10000 });

      const disabledItems = [
        nav.getByRole("link", { name: /rooms|kamar/i }),
        nav.getByRole("link", { name: /tenants|penyewa/i }),
        nav.getByRole("link", { name: /finance|keuangan/i }),
      ];

      for (const item of disabledItems) {
        const box = await item.boundingBox();
        expect(box!.height).toBeGreaterThanOrEqual(44);
        expect(box!.width).toBeGreaterThanOrEqual(44);
      }
    });
  });
});
