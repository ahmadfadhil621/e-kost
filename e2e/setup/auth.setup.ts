import { test as setup } from "@playwright/test";

const authFile = "e2e/.auth/user.json";

const E2E_USER_NAME = "E2E Test User";
const E2E_USER_EMAIL = `e2e-setup-${Date.now()}@test.com`;
const E2E_USER_PASSWORD = "TestPass123!";

setup("authenticate", async ({ page }) => {
  setup.setTimeout(60000);
  await page.goto("/register");

  await page.getByLabel(/full name/i).fill(E2E_USER_NAME);
  await page.getByLabel(/email address/i).fill(E2E_USER_EMAIL);
  await page.getByLabel(/password/i).fill(E2E_USER_PASSWORD);
  await page.getByRole("button", { name: /register/i }).click();

  const redirectTimeout = 35000;
  const redirected = await page
    .waitForURL((url) => url.pathname === "/", { timeout: redirectTimeout })
    .then(() => true)
    .catch(() => false);

  if (!redirected) {
    // Form server error is in role="alert" inside the form
    const formAlert = page.locator("form [role='alert']");
    await formAlert.waitFor({ state: "visible", timeout: 2000 }).catch(() => {});
    const errorText =
      (await formAlert.isVisible()) && (await formAlert.textContent())
        ? (await formAlert.textContent())?.trim()
        : "(no message — request may have hung or failed without a message)";
    throw new Error(
      `Registration did not redirect to /. Server error: ${errorText}. For E2E: ensure .env has DATABASE_URL and BETTER_AUTH_SECRET; set NEXT_PUBLIC_APP_URL=http://localhost:3000 or leave unset; run "npx prisma migrate deploy".`
    );
  }

  await page.context().storageState({ path: authFile });
});
