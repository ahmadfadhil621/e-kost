import { test as setup, expect } from "@playwright/test";

const authFile = "e2e/.auth/user.json";

const E2E_USER_NAME = "E2E Test User";
const E2E_USER_EMAIL = `e2e-setup-${Date.now()}@test.com`;
const E2E_USER_PASSWORD = "TestPass123!";

setup("authenticate", async ({ page }) => {
  await page.goto("/register");

  await page.getByLabel(/full name/i).fill(E2E_USER_NAME);
  await page.getByLabel(/email address/i).fill(E2E_USER_EMAIL);
  await page.getByLabel(/password/i).fill(E2E_USER_PASSWORD);
  await page.getByRole("button", { name: /register/i }).click();

  await expect(page).toHaveURL("/", { timeout: 10000 });

  await page.context().storageState({ path: authFile });
});
