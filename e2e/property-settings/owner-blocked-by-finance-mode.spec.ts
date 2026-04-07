// Traceability: property-settings (issue #104)
// AC-9  -> test('owner does not see Record Payment button when staffOnlyFinance is true')
// AC-9  -> test('owner does not see Add Expense button when staffOnlyFinance is true')
// AC-10 -> test('owner sees Record Payment button when staffOnlyFinance is false')
// AC-11 -> test('staff sees Record Payment button regardless of staffOnlyFinance')

import * as fs from "fs";
import * as path from "path";
import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

function getPropertyId(): string {
  const filePath = path.join(process.cwd(), "e2e/.auth/property-id.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as { propertyId: string };
  return data.propertyId;
}

async function setStaffOnlyFinance(
  page: Page,
  baseURL: string,
  propertyId: string,
  value: boolean
) {
  const res = await page.request.patch(`${baseURL}/api/properties/${propertyId}/settings`, {
    data: { staffOnlyFinance: value },
  });
  if (!res.ok()) {
    throw new Error(`Failed to set staffOnlyFinance=${value}: ${res.status()} ${await res.text()}`);
  }
}

async function registerAndInviteStaff(
  page: Page,
  baseURL: string,
  propertyId: string,
  staffEmail: string,
  staffPassword: string,
  staffName: string
): Promise<void> {
  const signUpRes = await fetch(`${baseURL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", origin: baseURL },
    body: JSON.stringify({ name: staffName, email: staffEmail, password: staffPassword }),
  });
  if (!signUpRes.ok) {
    throw new Error(`Staff registration failed: ${signUpRes.status} ${await signUpRes.text()}`);
  }

  await page.goto(`/properties/${propertyId}/settings`);
  const staffSection = page.getByTestId("staff-management");
  await staffSection.waitFor({ state: "visible", timeout: 20000 });
  await staffSection.getByRole("button", { name: /add staff|tambah staf/i }).click();
  await page.locator("#staff-email").fill(staffEmail);
  await staffSection.getByRole("button", { name: /^invite$|^undang$/i }).click();
  await expect(
    page.getByRole("status").filter({ hasText: /invited|berhasil/i })
  ).toBeVisible({ timeout: 20000 });
}

async function createStaffContext(
  browser: Browser,
  baseURL: string,
  email: string,
  password: string
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ viewport: { width: 375, height: 667 } });
  const staffPage = await context.newPage();
  const signInRes = await staffPage.request.post(`${baseURL}/api/auth/sign-in/email`, {
    headers: { origin: baseURL },
    data: { email, password, rememberMe: true },
  });
  if (!signInRes.ok()) {
    throw new Error(`Staff sign-in failed: ${signInRes.status()} ${await signInRes.text()}`);
  }
  return { context, page: staffPage };
}

test.describe("owner blocked by finance mode", () => {
  test.describe("good cases", () => {
    test("owner sees Record Payment button when staffOnlyFinance is false", async ({
      page,
      baseURL,
    }) => {
      const base = baseURL ?? "http://localhost:3000";
      const propertyId = getPropertyId();
      await setStaffOnlyFinance(page, base, propertyId, false);

      await page.goto(`/properties/${propertyId}/payments`);
      await expect(
        page.getByRole("link", { name: /record payment|catat pembayaran/i })
      ).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("bad cases", () => {
    test("owner does not see Record Payment button when staffOnlyFinance is true", async ({
      page,
      baseURL,
    }) => {
      const base = baseURL ?? "http://localhost:3000";
      const propertyId = getPropertyId();
      await setStaffOnlyFinance(page, base, propertyId, true);

      try {
        await page.goto(`/properties/${propertyId}/payments`);
        // Wait for page to load (payments list or empty state visible)
        await page
          .getByRole("heading", { name: /payments|pembayaran/i })
          .waitFor({ state: "visible", timeout: 15000 });
        await expect(
          page.getByRole("link", { name: /record payment|catat pembayaran/i })
        ).not.toBeVisible();
      } finally {
        await setStaffOnlyFinance(page, base, propertyId, false);
      }
    });

    test("owner does not see Add Expense button when staffOnlyFinance is true", async ({
      page,
      baseURL,
    }) => {
      const base = baseURL ?? "http://localhost:3000";
      const propertyId = getPropertyId();
      await setStaffOnlyFinance(page, base, propertyId, true);

      try {
        await page.goto(`/properties/${propertyId}/finance/expenses`);
        await page
          .getByRole("heading", { name: /expense|pengeluaran/i })
          .waitFor({ state: "visible", timeout: 15000 });
        await expect(
          page.getByRole("link", { name: /add expense|tambah pengeluaran/i })
        ).not.toBeVisible();
      } finally {
        await setStaffOnlyFinance(page, base, propertyId, false);
      }
    });
  });

  test.describe("edge cases", () => {
    test("staff sees Record Payment button regardless of staffOnlyFinance", async ({
      page,
      browser,
      baseURL,
    }) => {
      test.info().setTimeout(90000);
      const base = baseURL ?? "http://localhost:3000";
      const propertyId = getPropertyId();
      const suffix = Date.now();
      const staffEmail = `e2e-staff-finance-${suffix}@test.com`;
      const staffPassword = "TestPass123!";

      await registerAndInviteStaff(
        page, base, propertyId, staffEmail, staffPassword, `Staff Finance ${suffix}`
      );
      await setStaffOnlyFinance(page, base, propertyId, true);

      const { context, page: staffPage } = await createStaffContext(browser, base, staffEmail, staffPassword);
      try {
        await staffPage.goto(`/properties/${propertyId}/payments`);
        await expect(
          staffPage.getByRole("link", { name: /record payment|catat pembayaran/i })
        ).toBeVisible({ timeout: 15000 });
      } finally {
        await context.close();
        await setStaffOnlyFinance(page, base, propertyId, false);
      }
    });
  });
});
