import { test as setup, expect } from "@playwright/test";

const authFile = "e2e/.auth/user.json";
const authLogoutFile = "e2e/.auth/user-logout.json";

const E2E_USER_NAME = "E2E Test User";
const E2E_USER_EMAIL = `e2e-setup-${Date.now()}@test.com`;
const E2E_USER_PASSWORD = "TestPass123!";

const E2E_LOGOUT_USER_NAME = "E2E Logout User";
const E2E_LOGOUT_USER_EMAIL = `e2e-logout-${Date.now()}@test.com`;
const E2E_LOGOUT_USER_PASSWORD = "TestPass123!";

async function createAndAuthUser(
  page: Parameters<Parameters<typeof setup>[1]>[0],
  baseURL: string,
  name: string,
  email: string,
  password: string
): Promise<void> {
  // Create user via Better Auth API — no invite token required at the API level.
  // The invite gate is UI-only (/register page). E2E setup bypasses it here
  // to avoid a chicken-and-egg problem (no owner → can't create invite → can't register).
  const signUpRes = await page.request.post(`${baseURL}/api/auth/sign-up/email`, {
    data: { name, email, password },
  });

  const signUpOk = signUpRes.ok();
  if (!signUpOk) {
    const body = await signUpRes.text();
    throw new Error(`Sign-up failed for ${email}: ${signUpRes.status()} ${body}`);
  }

  // Sign in to get a session cookie on this page context
  const signInRes = await page.request.post(`${baseURL}/api/auth/sign-in/email`, {
    data: { email, password, rememberMe: true },
  });

  expect(signInRes.ok(), `Sign-in failed for ${email}: ${await signInRes.text()}`).toBe(true);

  // Navigate to / to confirm session is active
  await page.goto("/");
  await page.waitForURL((url) => url.pathname === "/", { timeout: 30000 });
}

setup("authenticate", async ({ page, browser, baseURL }) => {
  setup.setTimeout(120000);
  const base = baseURL ?? "http://localhost:3000";

  // ── Step 1: Create and authenticate main E2E user ────────────────────────
  await createAndAuthUser(page, base, E2E_USER_NAME, E2E_USER_EMAIL, E2E_USER_PASSWORD);
  await page.context().storageState({ path: authFile });

  // ── Step 2: Create demo user (needed for demo-login E2E tests) ───────────
  const demoPassword = process.env.DEMO_PASSWORD ?? "Demo@395762@";
  const demoCtx = await browser.newContext();
  const demoPage = await demoCtx.newPage();
  try {
    const demoRes = await demoPage.request.post(`${base}/api/auth/sign-up/email`, {
      data: { name: "Demo User", email: "demo@ekost.app", password: demoPassword },
    });
    // Ignore 422 — demo user may already exist in the test DB
    if (!demoRes.ok() && demoRes.status() !== 422) {
      console.warn(`Demo user creation returned ${demoRes.status()} — continuing`);
    }
  } finally {
    await demoCtx.close();
  }

  // ── Step 3: Create dedicated logout user ─────────────────────────────────
  // A separate user means logout tests don't invalidate the main E2E session.
  const logoutCtx = await browser.newContext();
  const logoutPage = await logoutCtx.newPage();
  try {
    await createAndAuthUser(
      logoutPage, base,
      E2E_LOGOUT_USER_NAME, E2E_LOGOUT_USER_EMAIL, E2E_LOGOUT_USER_PASSWORD
    );
    await logoutCtx.storageState({ path: authLogoutFile });
  } finally {
    await logoutCtx.close();
  }
});
