// Traceability: settings-staff-management, staff-permissions (issue #34)
// REQ 1.1 -> test('invited staff user can see the property in their property list')
// REQ 1.2 -> test('staff user can view rooms page')
// REQ 1.3 -> test('staff user can view tenants page')
// REQ 1.4 -> test('staff user can view payments page')
// REQ 2.1 -> test('removed staff member cannot access the property')
// REQ 3.1 -> test('staff user does not see danger zone actions')
// REQ 3.2 -> test('staff user does not see add staff controls')

import * as fs from "fs";
import * as path from "path";
import { test, expect, type Browser, type Page, type BrowserContext } from "@playwright/test";
import { stableFill } from "../helpers/forms";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

function getPropertyId(): string {
  const filePath = path.join(process.cwd(), "e2e/.auth/property-id.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as { propertyId: string };
  return data.propertyId;
}

async function registerStaffUser(
  baseURL: string,
  email: string,
  password: string,
  name: string
): Promise<void> {
  // Use plain fetch (not page.request) so the sign-up response's Set-Cookie
  // does not overwrite the owner's session in the page cookie jar.
  const res = await fetch(`${baseURL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", origin: baseURL },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    throw new Error(`Staff registration failed: ${res.status} ${await res.text()}`);
  }
}

async function addStaffViaUI(page: Page, propertyId: string, staffEmail: string): Promise<void> {
  await page.goto(`/properties/${propertyId}`);
  const staffSection = page.getByTestId("staff-management");
  await staffSection.waitFor({ state: "visible", timeout: 20000 });
  await staffSection.getByRole("button", { name: /add staff|tambah staf/i }).click();
  await stableFill(page, () => staffSection.locator("#staff-email"), staffEmail);
  await staffSection.getByRole("button", { name: /^invite$|^undang$/i }).click();
  await expect(
    page.getByRole("status").filter({ hasText: /invited successfully|berhasil diundang|staff invited/i })
  ).toBeVisible({ timeout: 20000 });
}

async function removeStaffViaUI(page: Page, propertyId: string, staffEmail: string): Promise<void> {
  await page.goto(`/properties/${propertyId}`);
  const staffSection = page.getByTestId("staff-management");
  await staffSection.waitFor({ state: "visible", timeout: 20000 });
  const listItem = staffSection.getByRole("listitem").filter({ hasText: staffEmail });
  await listItem.waitFor({ state: "visible", timeout: 15000 });
  await listItem.getByRole("button", { name: /remove|hapus|delete/i }).click();
  await page.getByRole("dialog").getByRole("button", { name: /confirm|remove|hapus|yes|ya/i }).click();
  await expect(listItem).not.toBeVisible({ timeout: 10000 });
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
    await context.close();
    throw new Error(`Staff login failed: ${signInRes.status()} ${await signInRes.text()}`);
  }
  return { context, page: staffPage };
}

test.describe("staff permission boundaries", () => {
  test.describe("good cases", () => {
    test("invited staff user can see the property in their property list", async ({
      page,
      browser,
      baseURL,
    }) => {
      test.setTimeout(90000);
      const base = baseURL ?? "http://localhost:3000";
      const propertyId = getPropertyId();
      const staffEmail = `staff-list-${Date.now()}@test.com`;
      const staffPassword = "StaffPass123!";

      await registerStaffUser(base, staffEmail, staffPassword, "Staff List User");
      await addStaffViaUI(page, propertyId, staffEmail);

      const { context: staffCtx, page: staffPage } = await createStaffContext(
        browser, base, staffEmail, staffPassword
      );
      try {
        await staffPage.goto(`${base}/properties`);
        // Scope to main content to avoid matching the property name in the nav header
        await expect(
          staffPage.locator("main").getByText("E2E Property").first()
        ).toBeVisible({ timeout: 15000 });
      } finally {
        await staffCtx.close();
        await removeStaffViaUI(page, propertyId, staffEmail);
      }
    });

    test("staff user can view rooms page", async ({ page, browser, baseURL }) => {
      test.setTimeout(90000);
      const base = baseURL ?? "http://localhost:3000";
      const propertyId = getPropertyId();
      const staffEmail = `staff-rooms-${Date.now()}@test.com`;
      const staffPassword = "StaffPass123!";

      await registerStaffUser(base, staffEmail, staffPassword, "Staff Rooms User");
      await addStaffViaUI(page, propertyId, staffEmail);

      const { context: staffCtx, page: staffPage } = await createStaffContext(
        browser, base, staffEmail, staffPassword
      );
      try {
        await staffPage.goto(`${base}/properties/${propertyId}/rooms`);
        // URL should stay on rooms page — not redirected to login
        await staffPage.waitForURL(`**/properties/${propertyId}/rooms`, { timeout: 15000 });
        expect(staffPage.url()).not.toContain("/login");
      } finally {
        await staffCtx.close();
        await removeStaffViaUI(page, propertyId, staffEmail);
      }
    });

    test("staff user can view tenants page", async ({ page, browser, baseURL }) => {
      test.setTimeout(90000);
      const base = baseURL ?? "http://localhost:3000";
      const propertyId = getPropertyId();
      const staffEmail = `staff-tenants-${Date.now()}@test.com`;
      const staffPassword = "StaffPass123!";

      await registerStaffUser(base, staffEmail, staffPassword, "Staff Tenants User");
      await addStaffViaUI(page, propertyId, staffEmail);

      const { context: staffCtx, page: staffPage } = await createStaffContext(
        browser, base, staffEmail, staffPassword
      );
      try {
        await staffPage.goto(`${base}/properties/${propertyId}/tenants`);
        await staffPage.waitForURL(`**/properties/${propertyId}/tenants`, { timeout: 15000 });
        expect(staffPage.url()).not.toContain("/login");
      } finally {
        await staffCtx.close();
        await removeStaffViaUI(page, propertyId, staffEmail);
      }
    });

    test("staff user can view payments page", async ({ page, browser, baseURL }) => {
      test.setTimeout(90000);
      const base = baseURL ?? "http://localhost:3000";
      const propertyId = getPropertyId();
      const staffEmail = `staff-payments-${Date.now()}@test.com`;
      const staffPassword = "StaffPass123!";

      await registerStaffUser(base, staffEmail, staffPassword, "Staff Payments User");
      await addStaffViaUI(page, propertyId, staffEmail);

      const { context: staffCtx, page: staffPage } = await createStaffContext(
        browser, base, staffEmail, staffPassword
      );
      try {
        await staffPage.goto(`${base}/properties/${propertyId}/payments`);
        await staffPage.waitForURL(`**/properties/${propertyId}/payments`, { timeout: 15000 });
        expect(staffPage.url()).not.toContain("/login");
      } finally {
        await staffCtx.close();
        await removeStaffViaUI(page, propertyId, staffEmail);
      }
    });
  });

  test.describe("bad cases", () => {
    test("removed staff member cannot access the property", async ({
      page,
      browser,
      baseURL,
    }) => {
      test.setTimeout(90000);
      const base = baseURL ?? "http://localhost:3000";
      const propertyId = getPropertyId();
      const staffEmail = `staff-removed-${Date.now()}@test.com`;
      const staffPassword = "StaffPass123!";

      await registerStaffUser(base, staffEmail, staffPassword, "Staff Removed User");
      await addStaffViaUI(page, propertyId, staffEmail);

      // Login as staff while still a member
      const { context: staffCtx, page: staffPage } = await createStaffContext(
        browser, base, staffEmail, staffPassword
      );
      try {
        // Verify access is granted before removal
        await staffPage.goto(`${base}/properties/${propertyId}`);
        await expect(
          staffPage.locator("main").getByText("E2E Property").first()
        ).toBeVisible({ timeout: 15000 });

        // Owner removes staff
        await removeStaffViaUI(page, propertyId, staffEmail);

        // Navigate away first to avoid any router/HTTP cache on the same URL
        await staffPage.goto(`${base}/`);
        // Now try to access the property — should fail with unavailable message
        await staffPage.goto(`${base}/properties/${propertyId}`);
        await expect(
          staffPage.getByText(/property unavailable|unavailable|not found|forbidden/i)
        ).toBeVisible({ timeout: 15000 });
      } finally {
        await staffCtx.close();
      }
    });
  });

  test.describe("edge cases", () => {
    test("staff user does not see danger zone actions", async ({
      page,
      browser,
      baseURL,
    }) => {
      test.setTimeout(90000);
      const base = baseURL ?? "http://localhost:3000";
      const propertyId = getPropertyId();
      const staffEmail = `staff-nodanger-${Date.now()}@test.com`;
      const staffPassword = "StaffPass123!";

      await registerStaffUser(base, staffEmail, staffPassword, "Staff No Danger User");
      await addStaffViaUI(page, propertyId, staffEmail);

      const { context: staffCtx, page: staffPage } = await createStaffContext(
        browser, base, staffEmail, staffPassword
      );
      try {
        await staffPage.goto(`${base}/properties/${propertyId}`);
        await expect(
          staffPage.locator("main").getByText("E2E Property").first()
        ).toBeVisible({ timeout: 15000 });

        // Danger zone and its destructive buttons must not be visible
        await expect(staffPage.getByText(/danger zone/i)).not.toBeVisible();
        await expect(
          staffPage.getByRole("button", { name: /delete property|hapus properti/i })
        ).not.toBeVisible();
        await expect(
          staffPage.getByRole("button", { name: /archive property|arsipkan properti/i })
        ).not.toBeVisible();
      } finally {
        await staffCtx.close();
        await removeStaffViaUI(page, propertyId, staffEmail);
      }
    });

    test("staff user does not see add staff controls", async ({
      page,
      browser,
      baseURL,
    }) => {
      test.setTimeout(90000);
      const base = baseURL ?? "http://localhost:3000";
      const propertyId = getPropertyId();
      const staffEmail = `staff-nocontrols-${Date.now()}@test.com`;
      const staffPassword = "StaffPass123!";

      await registerStaffUser(base, staffEmail, staffPassword, "Staff No Controls User");
      await addStaffViaUI(page, propertyId, staffEmail);

      const { context: staffCtx, page: staffPage } = await createStaffContext(
        browser, base, staffEmail, staffPassword
      );
      try {
        await staffPage.goto(`${base}/properties/${propertyId}`);
        await expect(
          staffPage.locator("main").getByText("E2E Property").first()
        ).toBeVisible({ timeout: 15000 });

        // Staff management add/remove controls must not be visible to staff
        await expect(
          staffPage.getByRole("button", { name: /add staff|tambah staf/i })
        ).not.toBeVisible();
      } finally {
        await staffCtx.close();
        await removeStaffViaUI(page, propertyId, staffEmail);
      }
    });
  });
});
