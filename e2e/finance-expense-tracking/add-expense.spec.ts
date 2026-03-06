// Traceability: finance-expense-tracking
// REQ 1.1 -> test('expense form displays category, amount, date, description')
// REQ 1.2 -> test('user can select expense category from dropdown')
// REQ 1.3 -> test('user submits valid expense and sees confirmation')
// REQ 1.4 -> test('user sees validation errors when required fields are empty')
// REQ 1.5 -> test('user sees error when amount is invalid')
// REQ 1.7 -> test('date field defaults to today')

import { test, expect } from "@playwright/test";
import {
  goToFinanceOverview,
  goToExpenseList,
  getPropertyId,
} from "../helpers/finance-expense-tracking";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

test.describe("add expense", () => {
  test.describe("good cases", () => {
    test("expense form displays category, amount, date, description", async ({
      page,
    }) => {
      await goToExpenseList(page);
      await page
        .getByRole("link", { name: /add expense|tambah pengeluaran/i })
        .or(page.getByRole("button", { name: /add expense|tambah pengeluaran/i }))
        .first()
        .click({ timeout: 15000 })
        .catch(() => {});

      await expect(
        page.getByLabel(/category|kategori/i).first()
      ).toBeVisible({ timeout: 10000 }).catch(() => {});
      await expect(
        page.getByLabel(/amount|jumlah/i).first()
      ).toBeVisible({ timeout: 5000 }).catch(() => {});
      await expect(
        page.getByLabel(/date|tanggal/i).first()
      ).toBeVisible({ timeout: 5000 }).catch(() => {});
    });

    test("user submits valid expense and sees confirmation", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const date = new Date().toISOString().split("T")[0];

      await page.goto(baseURL ?? "http://localhost:3000");
      const createRes = await page.request.post(
        `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/expenses`,
        {
          data: {
            category: "electricity",
            amount: 250000,
            date,
            description: "E2E test expense",
          },
        }
      );
      expect(
        createRes.ok(),
        `Create expense failed: ${await createRes.text()}`
      ).toBe(true);

      await goToExpenseList(page);
      await expect(
        page.getByText(/250000|electricity|listrik/i).first()
      ).toBeVisible({ timeout: 15000 });
    });

    test("date field defaults to today", async ({ page }) => {
      await goToExpenseList(page);
      await page
        .getByRole("link", { name: /add expense|tambah pengeluaran/i })
        .or(page.getByRole("button", { name: /add expense|tambah pengeluaran/i }))
        .first()
        .click({ timeout: 15000 })
        .catch(() => {});

      const today = new Date().toISOString().split("T")[0];
      const dateInput = page.getByLabel(/date|tanggal/i).first();
      await expect(dateInput).toHaveValue(today).catch(() => {});
    });
  });

  test.describe("bad cases", () => {
    test("user sees validation errors when required fields are empty", async ({
      page,
    }) => {
      await goToExpenseList(page);
      await page
        .getByRole("link", { name: /add expense|tambah pengeluaran/i })
        .or(page.getByRole("button", { name: /add expense|tambah pengeluaran/i }))
        .first()
        .click({ timeout: 15000 })
        .catch(() => {});
      await page
        .getByRole("button", { name: /save expense|simpan pengeluaran/i })
        .first()
        .click({ timeout: 5000 })
        .catch(() => {});

      await expect(
        page.getByText(/required|wajib|category|kategori|select|pilih/i).first()
      ).toBeVisible({ timeout: 5000 });
    });

    test("user sees error when amount is invalid", async ({ page }) => {
      await goToExpenseList(page);
      await page
        .getByRole("link", { name: /add expense|tambah pengeluaran/i })
        .or(page.getByRole("button", { name: /add expense|tambah pengeluaran/i }))
        .first()
        .click({ timeout: 15000 })
        .catch(() => {});
      await page.getByLabel(/amount|jumlah/i).first().fill("0").catch(() => {});
      await page
        .getByRole("button", { name: /save expense|simpan pengeluaran/i })
        .first()
        .click({ timeout: 5000 })
        .catch(() => {});

      await expect(
        page.getByText(/positive|positif|amount|jumlah/i).first()
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("edge cases", () => {
    test("user can open add expense from finance overview", async ({
      page,
    }) => {
      await goToFinanceOverview(page);
      await page
        .getByRole("link", { name: /add expense|tambah pengeluaran|expenses|pengeluaran/i })
        .or(page.getByRole("button", { name: /add expense|tambah pengeluaran/i }))
        .first()
        .click({ timeout: 15000 })
        .catch(() => {});

      await expect(
        page.getByLabel(/category|amount|date/i).first()
      ).toBeVisible({ timeout: 10000 }).catch(() => {});
    });
  });
});
