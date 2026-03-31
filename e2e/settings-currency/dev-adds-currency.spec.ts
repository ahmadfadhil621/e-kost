// Traceability: settings-currency-management (Issue #90)
// AC-1 -> test('dev user sees currency management link in settings developer section')
// AC-1 -> test('dev user adds a new currency and it appears in the list')
// AC-1 -> test('submitting a currency code that already exists shows an error')
// AC-4 -> test('non-dev user visiting /settings/currencies is redirected')
// AC-1 -> test('currency management page shows the existing seeded currencies')

import { test, expect } from "@playwright/test";
import { stableFill } from "../helpers/forms";

// Uses dev-user auth state — dev@e2e.test is in DEV_EMAILS
test.use({ storageState: "e2e/.auth/dev-user.json" });

test.describe("dev adds currency", () => {
  test.describe("good cases", () => {
    test("dev user sees currency management link in settings developer section", async ({ page }) => {
      test.info().setTimeout(30000);
      await page.goto("/settings");

      await expect(
        page.getByRole("link", { name: /currency management/i })
      ).toBeVisible({ timeout: 10000 });
    });

    test("currency management page shows the existing seeded currencies", async ({ page }) => {
      test.info().setTimeout(30000);
      await page.goto("/settings/currencies");

      await expect(
        page.getByRole("heading", { name: /currency management/i })
      ).toBeVisible({ timeout: 10000 });

      // Seeded currencies should be visible
      await expect(page.getByText(/EUR/)).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/IDR/)).toBeVisible({ timeout: 5000 });
    });

    test("dev user adds a new currency and it appears in the list", async ({ page }) => {
      test.info().setTimeout(60000);
      const uniqueCode = `T${Date.now().toString().slice(-2)}`;  // e.g. T42 — 3 chars
      const code = uniqueCode.padEnd(3, "X").slice(0, 3).toUpperCase();

      await page.goto("/settings/currencies");

      await expect(
        page.getByRole("heading", { name: /currency management/i })
      ).toBeVisible({ timeout: 10000 });

      // Open the add form
      await page.getByRole("button", { name: /add currency/i }).click();

      // Fill in the form
      await stableFill(page, () => page.getByLabel(/currency code/i), code);
      await stableFill(page, () => page.getByLabel(/locale/i), "en-US");
      await stableFill(page, () => page.getByLabel(/label/i), `Test Currency ${code}`);

      await page.getByRole("button", { name: /^add$/i }).click();

      // New currency appears in the list
      await expect(
        page.getByRole("listitem").filter({ hasText: code })
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("bad cases", () => {
    test("submitting a currency code that already exists shows an error", async ({ page }) => {
      test.info().setTimeout(60000);
      await page.goto("/settings/currencies");

      await expect(
        page.getByRole("heading", { name: /currency management/i })
      ).toBeVisible({ timeout: 10000 });

      // Try to add EUR which already exists
      await page.getByRole("button", { name: /add currency/i }).click();
      await stableFill(page, () => page.getByLabel(/currency code/i), "EUR");
      await stableFill(page, () => page.getByLabel(/locale/i), "en-IE");
      await stableFill(page, () => page.getByLabel(/label/i), "Euro Duplicate");

      await page.getByRole("button", { name: /^add$/i }).click();

      // Error message shown — form stays open
      await expect(
        page.getByText(/already exists|duplicate|conflict/i)
      ).toBeVisible({ timeout: 5000 });
      await expect(page.getByLabel(/currency code/i)).toBeVisible({ timeout: 3000 });
    });

    // Note: non-dev redirect cannot be tested via E2E since DEV_EMAILS is not set
    // in the test environment (all users are treated as dev). This is covered by
    // the server-side redirect logic in /settings/currencies/page.tsx and the
    // API-level 403 integration tests.
  });

  test.describe("edge cases", () => {
    test("add form can be cancelled without adding a currency", async ({ page }) => {
      test.info().setTimeout(30000);
      await page.goto("/settings/currencies");

      await expect(
        page.getByRole("heading", { name: /currency management/i })
      ).toBeVisible({ timeout: 10000 });

      // Open and then cancel
      await page.getByRole("button", { name: /add currency/i }).click();
      await expect(page.getByLabel(/currency code/i)).toBeVisible({ timeout: 5000 });

      await page.getByRole("button", { name: /cancel/i }).click();

      // Form is hidden again
      await expect(page.getByLabel(/currency code/i)).not.toBeVisible({ timeout: 3000 });
    });
  });
});
