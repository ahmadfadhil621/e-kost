// Traceability: settings-language-persistence
// REQ 3.1 -> test('language preference is restored after logout and re-login')
// REQ 4.1 -> test('selecting a language updates the active indicator immediately')
// REQ 5.3 -> test('selecting the current language again does not cause an error')
// PROP 1  -> test('language preference is restored after logout and re-login')

import { test, expect } from "@playwright/test";
import { stableFill } from "../helpers/forms";

// These tests manage their own login flow — clear any inherited auth state
// so page.goto("/login") is not redirected away by an active session.
test.use({ storageState: { cookies: [], origins: [] } });

const TEST_USER_NAME = "Language Persistence User";
const TEST_USER_PASSWORD = "LangTest123!";

let testUserEmail: string;

test.beforeAll(async ({ request, baseURL }) => {
  testUserEmail = `lang-persist-${Date.now()}@test.com`;
  const origin = baseURL ?? "http://localhost:3000";

  const res = await request.post("/api/auth/sign-up/email", {
    headers: { origin },
    data: {
      name: TEST_USER_NAME,
      email: testUserEmail,
      password: TEST_USER_PASSWORD,
    },
  });

  if (!res.ok()) {
    throw new Error(`Failed to create test user: ${await res.text()}`);
  }
});

async function loginAs(page: Parameters<typeof stableFill>[0], email: string, password: string) {
  await page.goto("/login");
  await stableFill(page, () => page.getByLabel(/email address/i), email);
  await stableFill(page, () => page.getByLabel(/password/i), password);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL("/", { timeout: 25000 });
  await page.waitForLoadState("domcontentloaded");
}

async function logout(page: Parameters<typeof stableFill>[0]) {
  // Button label is translated — match both English and Indonesian
  await page.getByRole("button", { name: /user profile|profil pengguna/i }).click();
  await page.getByRole("menuitem", { name: /log out|keluar/i }).click();
  await page.waitForURL(/\/login/, { timeout: 20000 });
}

test.describe("language persistence", () => {
  test.describe("good cases", () => {
    test("language preference is restored after logout and re-login", async ({
      page,
    }) => {
      test.setTimeout(120000);

      // Step 1: Log in
      await loginAs(page, testUserEmail, TEST_USER_PASSWORD);

      // Step 2: Go to settings and select Indonesian
      await page.goto("/settings");
      await expect(
        page.getByRole("main").getByRole("heading", { name: /language|bahasa/i })
      ).toBeVisible({ timeout: 10000 });

      await page
        .getByRole("main")
        .getByRole("button", { name: /indonesian|bahasa indonesia/i })
        .click();

      // Step 3: Verify the button is now active
      await expect(
        page.getByRole("main").getByRole("button", { name: /indonesian|bahasa indonesia/i })
      ).toHaveAttribute("aria-pressed", "true", { timeout: 5000 });

      // Step 4: Wait briefly for the PATCH to reach the server (fire-and-forget)
      await page.waitForTimeout(500);

      // Step 5: Log out
      await logout(page);

      // Step 6: Log back in
      await loginAs(page, testUserEmail, TEST_USER_PASSWORD);

      // Step 7: Navigate to settings — language should be restored from server
      await page.goto("/settings");
      await expect(
        page.getByRole("main").getByRole("heading", { name: /language|bahasa/i })
      ).toBeVisible({ timeout: 10000 });

      // The useLanguageSync hook fetches the persisted language after auth
      await expect(
        page.getByRole("main").getByRole("button", { name: /indonesian|bahasa indonesia/i })
      ).toHaveAttribute("aria-pressed", "true", { timeout: 8000 });
    });

    test("selecting a language updates the active indicator immediately", async ({
      page,
    }) => {
      test.setTimeout(60000);

      await loginAs(page, testUserEmail, TEST_USER_PASSWORD);
      await page.goto("/settings");

      await expect(
        page.getByRole("main").getByRole("heading", { name: /language|bahasa/i })
      ).toBeVisible({ timeout: 10000 });

      // Switch to English explicitly first to ensure a known state
      await page
        .getByRole("main")
        .getByRole("button", { name: /^english$/i })
        .click();
      await expect(
        page.getByRole("main").getByRole("button", { name: /^english$/i })
      ).toHaveAttribute("aria-pressed", "true", { timeout: 3000 });

      // Now switch to Indonesian — UI must update without a page reload
      await page
        .getByRole("main")
        .getByRole("button", { name: /indonesian|bahasa indonesia/i })
        .click();
      await expect(
        page.getByRole("main").getByRole("button", { name: /indonesian|bahasa indonesia/i })
      ).toHaveAttribute("aria-pressed", "true", { timeout: 3000 });
    });
  });

  test.describe("edge cases", () => {
    test("selecting the current language again does not cause an error", async ({
      page,
    }) => {
      test.setTimeout(60000);

      await loginAs(page, testUserEmail, TEST_USER_PASSWORD);
      await page.goto("/settings");

      await expect(
        page.getByRole("main").getByRole("heading", { name: /language|bahasa/i })
      ).toBeVisible({ timeout: 10000 });

      // Click the already-active language button twice
      const englishButton = page
        .getByRole("main")
        .getByRole("button", { name: /^english$/i });

      // Make English active first
      await englishButton.click();
      await expect(englishButton).toHaveAttribute("aria-pressed", "true", { timeout: 3000 });

      // Click it again — should not error or break the UI
      await englishButton.click();
      await expect(englishButton).toHaveAttribute("aria-pressed", "true", { timeout: 3000 });

      // Page should still be functional
      await expect(
        page.getByRole("main").getByRole("heading", { name: /language|settings/i }).first()
      ).toBeVisible();
    });
  });
});
