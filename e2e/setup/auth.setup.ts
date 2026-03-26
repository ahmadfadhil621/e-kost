import { test as setup } from "@playwright/test";
import { stableFill } from "../helpers/forms";

const authFile = "e2e/.auth/user.json";
const authLogoutFile = "e2e/.auth/user-logout.json";

const E2E_USER_NAME = "E2E Test User";
const E2E_USER_EMAIL = `e2e-setup-${Date.now()}@test.com`;
const E2E_USER_PASSWORD = "TestPass123!";

const E2E_LOGOUT_USER_NAME = "E2E Logout User";
const E2E_LOGOUT_USER_EMAIL = `e2e-logout-${Date.now()}@test.com`;
const E2E_LOGOUT_USER_PASSWORD = "TestPass123!";

setup("authenticate", async ({ page, browser }) => {
  setup.setTimeout(120000);

  // ── Step 1: Register main E2E user ──────────────────────────────────────
  await page.goto("/register");
  await stableFill(page, () => page.getByLabel(/full name/i), E2E_USER_NAME);
  await stableFill(page, () => page.getByLabel(/email address/i), E2E_USER_EMAIL);
  await stableFill(page, () => page.getByLabel(/password/i), E2E_USER_PASSWORD);
  await page.getByRole("button", { name: /register/i }).click();

  const redirectTimeout = 35000;
  const redirected = await page
    .waitForURL((url) => url.pathname === "/", { timeout: redirectTimeout })
    .then(() => true)
    .catch(() => false);

  if (!redirected) {
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

  // Save main user session — must happen before any other registration below
  // overwrites the current session cookie.
  await page.context().storageState({ path: authFile });

  // ── Step 2: Register demo user (needed for demo-login E2E tests) ─────────
  // Use a separate browser context so the main user's cookie is not overridden.
  const demoPassword = process.env.DEMO_PASSWORD ?? "Demo@395762@";
  const demoCtx = await browser.newContext();
  const demoPage = await demoCtx.newPage();
  try {
    await demoPage.goto("/register");
    await stableFill(demoPage, () => demoPage.getByLabel(/full name/i), "Demo User");
    await stableFill(demoPage, () => demoPage.getByLabel(/email address/i), "demo@ekost.app");
    await stableFill(demoPage, () => demoPage.getByLabel(/password/i), demoPassword);
    await demoPage.getByRole("button", { name: /register/i }).click();
    // Wait for success or error (user may already exist in local dev)
    await Promise.race([
      demoPage.waitForURL("/", { timeout: 15000 }),
      demoPage.locator("form [role='alert']").waitFor({ state: "visible", timeout: 15000 }),
    ]).catch(() => {});
  } finally {
    await demoCtx.close();
  }

  // ── Step 3: Register dedicated logout user ───────────────────────────────
  // A separate user means logout tests don't invalidate the main E2E session,
  // preventing session cascade failures when tests run longer than the
  // 5-minute cookieCache window.
  const logoutCtx = await browser.newContext();
  const logoutPage = await logoutCtx.newPage();
  try {
    await logoutPage.goto("/register");
    await stableFill(logoutPage, () => logoutPage.getByLabel(/full name/i), E2E_LOGOUT_USER_NAME);
    await stableFill(logoutPage, () => logoutPage.getByLabel(/email address/i), E2E_LOGOUT_USER_EMAIL);
    await stableFill(logoutPage, () => logoutPage.getByLabel(/password/i), E2E_LOGOUT_USER_PASSWORD);
    await logoutPage.getByRole("button", { name: /register/i }).click();
    await logoutPage.waitForURL("/", { timeout: 35000 });
    await logoutCtx.storageState({ path: authLogoutFile });
  } finally {
    await logoutCtx.close();
  }
});
