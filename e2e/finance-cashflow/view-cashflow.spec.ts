// Traceability: finance-cashflow
// AC-1 -> test('net income card links to cashflow page')
// AC-2 -> test('cashflow page shows income entries with green + prefix')
// AC-2 -> test('cashflow page shows expense entries with red − prefix')
// AC-2 -> test('month navigation updates the cashflow list')
// AC-3 -> test('empty state is shown when no transactions exist for the selected month')
// AC-3 -> test('cashflow page renders without horizontal scroll at 320px')
//
// NOTE: After implementing this feature, the existing test
// "net income card is not a link" in e2e/finance-summary-card-navigation/summary-card-navigation.spec.ts
// must be updated — issue #69 intentionally makes the Net Income card a link.

import { test, expect } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";
import {
  goToFinanceOverview,
  getPropertyId,
} from "../helpers/finance-expense-tracking";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

// ─── helpers ────────────────────────────────────────────────────────────────

async function goToCashflowPage(
  request: APIRequestContext,
  baseURL: string | undefined,
  page: import("@playwright/test").Page
) {
  const propertyId = getPropertyId();
  await page.goto(`/properties/${propertyId}/finance/cashflow`);
  await page
    .getByText(/cashflow|arus kas/i)
    .first()
    .waitFor({ state: "visible", timeout: 15000 });
}

async function seedPayment(
  request: APIRequestContext,
  baseURL: string | undefined,
  propertyId: string,
  tenantId: string,
  amount: number,
  paymentDate: string
) {
  const res = await request.post(
    `${baseURL}/api/properties/${propertyId}/payments`,
    {
      data: { tenantId, amount, paymentDate },
    }
  );
  return res.json();
}

async function seedExpense(
  request: APIRequestContext,
  baseURL: string | undefined,
  propertyId: string,
  amount: number,
  date: string
) {
  const res = await request.post(
    `${baseURL}/api/properties/${propertyId}/expenses`,
    {
      data: { category: "electricity", amount, date },
    }
  );
  return res.json();
}

/** Returns the ISO YYYY-MM for a far-past month unlikely to have any seeded data */
function getEmptyMonth() {
  return { year: 2000, month: 1 };
}

// ─── tests ──────────────────────────────────────────────────────────────────

test.describe("view cashflow", () => {
  test.describe("good cases", () => {
    test("net income card links to cashflow page", async ({ page }) => {
      const propertyId = getPropertyId();
      await goToFinanceOverview(page);

      // Net Income card should now be an <a> linking to cashflow
      const netIncomeLink = page
        .locator("a")
        .filter({ has: page.getByText(/net income|laba bersih/i) })
        .first();
      await expect(netIncomeLink).toBeVisible({ timeout: 10000 });

      await netIncomeLink.click();

      await expect(page).toHaveURL(
        new RegExp(`/properties/${propertyId}/finance/cashflow`),
        { timeout: 10000 }
      );

      // Page title is visible
      await expect(
        page.getByText(/cashflow|arus kas/i).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("cashflow page shows income entries with + prefix", async ({
      page,
      request,
      baseURL,
    }) => {
      const propertyId = getPropertyId();

      // Fetch existing tenants to get a valid tenantId for seeding
      const tenantsRes = await request.get(
        `${baseURL}/api/properties/${propertyId}/tenants`
      );
      const { tenants } = await tenantsRes.json() as { tenants: Array<{ id: string; roomId: string | null; movedOutAt: string | null }> };
      const activeTenant = tenants.find((t) => t.roomId && !t.movedOutAt);

      test.skip(!activeTenant, "No active tenant available to seed payment");

      const now = new Date();
      const paymentDate = now.toISOString().slice(0, 10);

      await seedPayment(request, baseURL, propertyId, activeTenant!.id, 1_500_000, paymentDate);

      await page.goto(`/properties/${propertyId}/finance/cashflow`);
      await page
        .getByText(/cashflow|arus kas/i)
        .first()
        .waitFor({ state: "visible", timeout: 15000 });

      // Income row must show a + prefix on the amount
      await expect(
        page.getByText(/^\+/).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("cashflow page shows expense entries with − prefix", async ({
      page,
      request,
      baseURL,
    }) => {
      const propertyId = getPropertyId();

      const now = new Date();
      const expenseDate = now.toISOString().slice(0, 10);

      await seedExpense(request, baseURL, propertyId, 75_000, expenseDate);

      await page.goto(`/properties/${propertyId}/finance/cashflow`);
      await page
        .getByText(/cashflow|arus kas/i)
        .first()
        .waitFor({ state: "visible", timeout: 15000 });

      // Expense row must show a − (minus) prefix on the amount
      await expect(
        page.getByText(/^−|^-/).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("month navigation changes the displayed month", async ({
      page,
      baseURL,
    }) => {
      const propertyId = getPropertyId();
      await page.goto(`/properties/${propertyId}/finance/cashflow`);
      await page
        .getByText(/cashflow|arus kas/i)
        .first()
        .waitFor({ state: "visible", timeout: 15000 });

      // Capture the current month label
      const prevButton = page.getByRole("button", {
        name: /previous month|bulan sebelumnya/i,
      });
      await expect(prevButton).toBeVisible({ timeout: 10000 });

      // Get current displayed month text before navigation
      const monthLabelBefore = await page
        .getByText(/january|february|march|april|may|june|july|august|september|october|november|december/i)
        .first()
        .textContent({ timeout: 5000 })
        .catch(() => "");

      // Navigate to previous month
      await prevButton.click();

      // Wait for the month label to change
      await page.waitForTimeout(500);

      const monthLabelAfter = await page
        .getByText(/january|february|march|april|may|june|july|august|september|october|november|december/i)
        .first()
        .textContent({ timeout: 5000 })
        .catch(() => "");

      // The displayed month should have changed
      expect(monthLabelAfter).not.toBe(monthLabelBefore);
    });
  });

  test.describe("bad cases", () => {
    test("empty state is shown when no transactions exist for the selected month", async ({
      page,
    }) => {
      const propertyId = getPropertyId();
      const { year, month } = getEmptyMonth();

      await page.goto(
        `/properties/${propertyId}/finance/cashflow?year=${year}&month=${month}`
      );
      await page
        .getByText(/cashflow|arus kas/i)
        .first()
        .waitFor({ state: "visible", timeout: 15000 });

      await expect(
        page.getByText(/no transactions for this month|tidak ada transaksi bulan ini/i)
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("edge cases", () => {
    test("cashflow page renders without horizontal scroll at 320px", async ({
      page,
      browserName,
    }) => {
      test.skip(
        browserName !== "chromium",
        "viewport scroll check — chromium only"
      );

      await page.setViewportSize({ width: 320, height: 667 });

      const propertyId = getPropertyId();
      await page.goto(`/properties/${propertyId}/finance/cashflow`);
      await page
        .getByText(/cashflow|arus kas/i)
        .first()
        .waitFor({ state: "visible", timeout: 15000 });

      const scrollWidth = await page.evaluate(
        () => document.documentElement.scrollWidth
      );
      const clientWidth = await page.evaluate(
        () => document.documentElement.clientWidth
      );
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });

    test("cashflow page defaults to current month on load", async ({ page }) => {
      const propertyId = getPropertyId();
      await page.goto(`/properties/${propertyId}/finance/cashflow`);
      await page
        .getByText(/cashflow|arus kas/i)
        .first()
        .waitFor({ state: "visible", timeout: 15000 });

      const currentYear = new Date().getFullYear();
      const currentMonthName = new Date().toLocaleString("en", {
        month: "long",
      });

      // MonthSelector should show the current month
      await expect(
        page.getByText(new RegExp(currentMonthName, "i")).first()
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByText(String(currentYear)).first()
      ).toBeVisible({ timeout: 5000 });
    });

    test("month navigation buttons are accessible at 320px", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 667 });

      const propertyId = getPropertyId();
      await page.goto(`/properties/${propertyId}/finance/cashflow`);
      await page
        .getByText(/cashflow|arus kas/i)
        .first()
        .waitFor({ state: "visible", timeout: 15000 });

      const prevButton = page.getByRole("button", {
        name: /previous month|bulan sebelumnya/i,
      });
      const nextButton = page.getByRole("button", {
        name: /next month|bulan berikutnya/i,
      });

      await expect(prevButton).toBeVisible({ timeout: 10000 });
      await expect(nextButton).toBeVisible({ timeout: 5000 });

      // Touch target size ≥ 44px
      const prevBox = await prevButton.boundingBox();
      const nextBox = await nextButton.boundingBox();
      if (prevBox) {
        expect(prevBox.height).toBeGreaterThanOrEqual(44);
      }
      if (nextBox) {
        expect(nextBox.height).toBeGreaterThanOrEqual(44);
      }
    });
  });
});
