// Traceability: finance-staff-summary (issue #109)
// REQ 3.1 -> test('staff summary section title is visible on finance page')
// REQ 3.5 -> test('staff summary row shows collected and added labels')
// REQ 3.7 -> test('empty state is shown for a month with no staff activity')
// REQ 3.2 -> test('staff summary section remains visible after month navigation')

import { test, expect } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";
import { goToFinanceOverview, getPropertyId } from "../helpers/finance-expense-tracking";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

async function seedPayment(
  request: APIRequestContext,
  baseURL: string | undefined,
  propertyId: string,
  tenantId: string,
  amount: number,
  paymentDate: string
) {
  return request.post(`${baseURL}/api/properties/${propertyId}/payments`, {
    data: { tenantId, amount, paymentDate },
  });
}

async function seedExpense(
  request: APIRequestContext,
  baseURL: string | undefined,
  propertyId: string,
  amount: number,
  date: string
) {
  return request.post(`${baseURL}/api/properties/${propertyId}/expenses`, {
    data: { category: "electricity", amount, date },
  });
}

function getEmptyMonth() {
  return { year: 2000, month: 1 };
}

test.describe("view staff summary (owner)", () => {
  test.describe("good cases", () => {
    test("staff summary section title is visible on finance page", async ({
      page,
    }) => {
      await goToFinanceOverview(page);
      // Summary cards must load before the section appears
      await page
        .getByText(/income|pemasukan/i)
        .first()
        .waitFor({ state: "visible", timeout: 15000 });

      await expect(
        page.getByText(/cash accountability|akuntabilitas kas/i).first()
      ).toBeVisible({ timeout: 15000 });
    });

    test("staff summary row shows collected and added labels after seeding activity", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const today = now.toISOString().slice(0, 10);

      const tenantsRes = await request.get(
        `${baseURL}/api/properties/${propertyId}/tenants`
      );
      const { tenants } = (await tenantsRes.json()) as {
        tenants: Array<{
          id: string;
          roomId: string | null;
          movedOutAt: string | null;
        }>;
      };
      const activeTenant = tenants.find((t) => t.roomId && !t.movedOutAt);
      test.skip(!activeTenant, "No active tenant to seed payment");

      await seedPayment(
        request,
        baseURL,
        propertyId,
        activeTenant!.id,
        200_000,
        today
      );
      await seedExpense(request, baseURL, propertyId, 75_000, today);

      await page.goto(
        `/properties/${propertyId}/finance?year=${year}&month=${month}`
      );
      await page
        .getByText(/cash accountability|akuntabilitas kas/i)
        .first()
        .waitFor({ state: "visible", timeout: 20000 });

      await expect(
        page.getByText(/collected|dikumpulkan/i).first()
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByText(/added|ditambahkan/i).first()
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("bad cases", () => {
    test("empty state is shown for a month with no staff activity", async ({
      page,
    }) => {
      const propertyId = getPropertyId();
      const { year, month } = getEmptyMonth();

      await page.goto(
        `/properties/${propertyId}/finance?year=${year}&month=${month}`
      );
      await page
        .getByText(/cash accountability|akuntabilitas kas/i)
        .first()
        .waitFor({ state: "visible", timeout: 20000 });

      await expect(
        page
          .getByText(/no activity recorded this month|tidak ada aktivitas/i)
          .first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("edge cases", () => {
    test("staff summary section remains visible after month navigation", async ({
      page,
    }) => {
      const propertyId = getPropertyId();
      await page.goto(`/properties/${propertyId}/finance`);
      await page
        .getByText(/cash accountability|akuntabilitas kas/i)
        .first()
        .waitFor({ state: "visible", timeout: 20000 });

      const prevButton = page.getByRole("button", {
        name: /previous month|bulan sebelumnya/i,
      });
      await expect(prevButton).toBeVisible({ timeout: 10000 });
      await prevButton.click();
      await page.waitForTimeout(500);

      await expect(
        page.getByText(/cash accountability|akuntabilitas kas/i).first()
      ).toBeVisible({ timeout: 10000 });
    });
  });
});
