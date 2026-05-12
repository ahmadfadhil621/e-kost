// Traceability: finance-expense-export (issue #122)
// AC-1  -> test('user clicks Export and file download starts with xlsx filename')
// AC-1  -> test('downloaded filename matches expenses-YYYY-MM-DD_to_YYYY-MM-DD pattern')
// AC-4  -> test('export button is visible in toolbar when expenses exist')
// AC-7  -> test('export button is disabled when no expenses exist for the month')

import { test, expect } from "@playwright/test";
import {
  getPropertyId,
  goToExpenseList,
} from "../helpers/finance-expense-tracking";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;

// Seeds one expense for the current month via API. Returns the expense id or null.
async function seedExpense(
  page: Parameters<typeof test>[1] extends { page: infer P } ? P : never,
  baseURL: string
): Promise<string | null> {
  const propertyId = getPropertyId();
  const date = now.toISOString().split("T")[0];

  const createRes = await page.request.post(
    `${baseURL}/api/properties/${propertyId}/expenses`,
    {
      data: {
        category: "maintenance",
        amount: 250_000,
        date,
        description: "E2E export test expense",
      },
    }
  );
  if (!createRes.ok()) { return null; }
  const body = await createRes.json();
  return (body as { id: string }).id ?? null;
}

// Deletes all expenses for the current month via individual DELETE calls.
async function deleteAllExpensesThisMonth(
  page: Parameters<typeof test>[1] extends { page: infer P } ? P : never,
  baseURL: string
) {
  const propertyId = getPropertyId();
  const res = await page.request.get(
    `${baseURL}/api/properties/${propertyId}/expenses?year=${currentYear}&month=${currentMonth}`
  );
  if (!res.ok()) { return; }
  const expenses = (await res.json()) as { id: string }[];
  for (const e of expenses) {
    await page.request.delete(
      `${baseURL}/api/properties/${propertyId}/expenses/${e.id}`
    );
  }
}

test.describe("export expenses", () => {
  test.describe("good cases", () => {
    test("export button is visible in toolbar when expenses exist", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      await seedExpense(page, baseURL ?? "http://localhost:3000");
      await goToExpenseList(page);

      await expect(
        page
          .getByRole("button", { name: /export|ekspor/i })
          .or(page.getByLabel(/export|ekspor/i))
          .first()
      ).toBeVisible({ timeout: 15000 });
    });

    test("user clicks Export and file download starts with xlsx filename", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const base = baseURL ?? "http://localhost:3000";

      const expenseId = await seedExpense(page, base);
      if (!expenseId) {
        test.skip();
        return;
      }

      await goToExpenseList(page);

      const exportBtn = page
        .getByRole("button", { name: /export|ekspor/i })
        .or(page.getByLabel(/export|ekspor/i))
        .first();

      await expect(exportBtn).toBeVisible({ timeout: 15000 });
      await expect(exportBtn).toBeEnabled({ timeout: 5000 });

      const [download] = await Promise.all([
        page.waitForEvent("download"),
        exportBtn.click(),
      ]);

      expect(download.suggestedFilename()).toMatch(/^expenses-.*\.xlsx$/);
    });
  });

  test.describe("bad cases", () => {
    test("export button is disabled when no expenses exist for the month", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      await deleteAllExpensesThisMonth(page, baseURL ?? "http://localhost:3000");
      await goToExpenseList(page);

      const exportBtn = page
        .getByRole("button", { name: /export|ekspor/i })
        .or(page.getByLabel(/export|ekspor/i))
        .first();

      await expect(exportBtn).toBeVisible({ timeout: 15000 });
      await expect(exportBtn).toBeDisabled({ timeout: 5000 });
    });
  });

  test.describe("edge cases", () => {
    test("downloaded filename matches expenses-YYYY-MM-DD_to_YYYY-MM-DD pattern", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const base = baseURL ?? "http://localhost:3000";

      const expenseId = await seedExpense(page, base);
      if (!expenseId) {
        test.skip();
        return;
      }

      await goToExpenseList(page);

      const exportBtn = page
        .getByRole("button", { name: /export|ekspor/i })
        .or(page.getByLabel(/export|ekspor/i))
        .first();

      await expect(exportBtn).toBeEnabled({ timeout: 15000 });

      const [download] = await Promise.all([
        page.waitForEvent("download"),
        exportBtn.click(),
      ]);

      expect(download.suggestedFilename()).toMatch(
        /^expenses-\d{4}-\d{2}-\d{2}_to_\d{4}-\d{2}-\d{2}\.xlsx$/
      );
    });
  });
});
