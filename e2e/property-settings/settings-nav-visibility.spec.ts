// Traceability: property-settings (issue #104)
// AC-1  -> test('owner sees Settings link in property quick-nav')
// AC-1  -> test('staff does not see Settings link in property quick-nav')
// AC-2  -> test('staff navigating to settings URL sees forbidden state')

import * as fs from "fs";
import * as path from "path";
import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

function getPropertyId(): string {
  const filePath = path.join(process.cwd(), "e2e/.auth/property-id.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as { propertyId: string };
  return data.propertyId;
}

async function registerAndInviteStaff(
  page: Page,
  baseURL: string,
  propertyId: string,
  staffEmail: string,
  staffPassword: string,
  staffName: string
): Promise<void> {
  // Register staff via API (bypasses invite-only UI gate)
  const signUpRes = await fetch(`${baseURL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", origin: baseURL },
    body: JSON.stringify({ name: staffName, email: staffEmail, password: staffPassword }),
  });
  if (!signUpRes.ok) {
    throw new Error(`Staff registration failed: ${signUpRes.status} ${await signUpRes.text()}`);
  }

  // Invite staff via settings page (StaffSection is on settings page since #104)
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

test.describe("settings nav visibility", () => {
  test.describe("good cases", () => {
    test("owner sees Settings link in property quick-nav", async ({ page }) => {
      const propertyId = getPropertyId();
      await page.goto(`/properties/${propertyId}`);
      await expect(
        page.getByRole("link", { name: /^settings$|^pengaturan$/i })
      ).toBeVisible({ timeout: 15000 });
    });

    test("staff does not see Settings link in property quick-nav", async ({
      page,
      browser,
      baseURL,
    }) => {
      test.info().setTimeout(90000);
      const base = baseURL ?? "http://localhost:3000";
      const propertyId = getPropertyId();
      const suffix = Date.now();
      const staffEmail = `e2e-staff-nav-${suffix}@test.com`;
      const staffPassword = "TestPass123!";

      await registerAndInviteStaff(page, base, propertyId, staffEmail, staffPassword, `Staff Nav ${suffix}`);

      const { context, page: staffPage } = await createStaffContext(browser, base, staffEmail, staffPassword);
      try {
        await staffPage.goto(`/properties/${propertyId}`);
        await staffPage.getByRole("link", { name: /^payments$|^pembayaran$/i }).waitFor({
          state: "visible",
          timeout: 15000,
        });
        await expect(
          staffPage.getByRole("link", { name: /^settings$|^pengaturan$/i })
        ).not.toBeVisible();
      } finally {
        await context.close();
      }
    });
  });

  test.describe("bad cases", () => {
    test("staff navigating to settings URL sees forbidden state", async ({
      page,
      browser,
      baseURL,
    }) => {
      test.info().setTimeout(90000);
      const base = baseURL ?? "http://localhost:3000";
      const propertyId = getPropertyId();
      const suffix = Date.now();
      const staffEmail = `e2e-staff-forbidden-${suffix}@test.com`;
      const staffPassword = "TestPass123!";

      await registerAndInviteStaff(page, base, propertyId, staffEmail, staffPassword, `Staff Forbidden ${suffix}`);

      const { context, page: staffPage } = await createStaffContext(browser, base, staffEmail, staffPassword);
      try {
        await staffPage.goto(`/properties/${propertyId}/settings`);
        await expect(
          staffPage.getByText(/don't have permission|tidak memiliki izin/i)
        ).toBeVisible({ timeout: 15000 });
      } finally {
        await context.close();
      }
    });
  });
});
