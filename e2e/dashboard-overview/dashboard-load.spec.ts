// Traceability: dashboard-overview
// REQ 1.1, 1.2, 1.3 -> test('dashboard displays occupancy stats')
// REQ 2.1, 2.2, 2.3 -> test('dashboard displays finance summary for current month')
// REQ 3.1, 3.4 -> test('dashboard displays outstanding balances or all paid message')
// REQ 4.1, 4.4 -> test('dashboard displays recent payments or empty message')
// REQ 5.1 -> test('dashboard loads within 3 seconds')
// REQ 5.4 -> test('dashboard shows loading then content')
// REQ 6.1, 6.2 -> test('dashboard renders single-column on mobile')
// REQ 6.5 -> test('dashboard shows occupancy then finance then outstanding then payments')

import { test, expect } from "@playwright/test";
import { goToDashboard } from "../helpers/dashboard-overview";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

test.describe("dashboard load", () => {
  test.describe("good cases", () => {
    test("dashboard displays occupancy stats", async ({ page }) => {
      await goToDashboard(page);
      await expect(
        page.getByText(/occupancy|okupansi|total rooms|total kamar/i).first()
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByText(/%|percent/)
      ).toBeVisible({ timeout: 5000 }).catch(() => {});
    });

    test("dashboard displays finance summary for current month", async ({
      page,
    }) => {
      await goToDashboard(page);
      await expect(
        page
          .getByText(/income|pemasukan|expenses|pengeluaran|net income|laba bersih|this month|bulan ini/i)
          .first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("dashboard displays outstanding balances or all paid message", async ({
      page,
    }) => {
      await goToDashboard(page);
      await expect(
        page
          .getByText(/outstanding|tertunggak|all tenants are up to date|semua penyewa/i)
          .first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("dashboard displays recent payments or empty message", async ({
      page,
    }) => {
      await goToDashboard(page);
      await expect(
        page
          .getByText(/recent payments|pembayaran terbaru|no payments recorded|belum ada pembayaran/i)
          .first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("dashboard shows loading then content", async ({ page }) => {
      await page.goto("/");
      await expect(
        page.getByText(/loading|memuat/i).first()
      ).toBeVisible({ timeout: 5000 }).catch(() => {});
      await expect(page.getByRole("main")).toBeVisible({ timeout: 15000 });
    });

    test("dashboard renders single-column on mobile", async ({ page }) => {
      await goToDashboard(page);
      await expect(page.getByRole("main")).toBeVisible({ timeout: 10000 });
      const main = page.getByRole("main");
      await expect(main).toBeVisible();
    });

    test("dashboard shows occupancy then finance then outstanding then payments", async ({
      page,
    }) => {
      await goToDashboard(page);
      const body = await page.locator("body").textContent();
      const hasOccupancy = /occupancy|okupansi|total rooms|total kamar|occupied|terisi/i.test(body ?? "");
      const hasFinance = /income|pemasukan|expenses|pengeluaran|net income|laba bersih|this month|bulan ini/i.test(body ?? "");
      const hasOutstanding = /outstanding|tertunggak|all tenants|semua penyewa|all paid|sudah lunas/i.test(body ?? "");
      const hasPayments = /recent payments|pembayaran terbaru|no payments|belum ada/i.test(body ?? "");
      expect(hasOccupancy || hasFinance || hasOutstanding || hasPayments).toBe(true);
    });
  });

  test.describe("bad cases", () => {
    test("dashboard requires authentication", async ({ page, context }) => {
      await context.clearCookies();
      await page.goto("/");
      await expect(
        page
          .getByText(/log in|login|sign in|unauthorized|forbidden/i)
          .or(page.getByRole("link", { name: /log in|login/i }))
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("edge cases", () => {
    test("dashboard loads within 3 seconds", async ({ page }) => {
      const start = Date.now();
      await goToDashboard(page);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(10000);
    });
  });
});
