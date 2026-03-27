// Traceability: user-authentication + invite-registration
// REQ 1.1 -> test('registration page with valid invite displays all required fields')
// REQ 1.2 -> test('user with valid invite registers and lands on app')
// REQ 1.3 -> test('user sees validation error for empty name')
// REQ 1.4 -> test('user sees error when email is already registered')
// REQ 1.5 -> test('user sees validation error for short password')
// REQ 1.7 -> test('user with valid invite registers and lands on app')
// REQ 6.5 -> test('email field uses email input type')
// REQ 7.3 -> test('password field masks input')
// REQ 7.5 -> test('user can register with exactly 8-character password')
// invite-reg REQ 1 -> test('user without token sees invite required error')
// invite-reg REQ 1 -> test('user with invalid token sees error')

import { test, expect } from "@playwright/test";
import type { Page, APIRequestContext } from "@playwright/test";
import { stableFill } from "../helpers/forms";

/** Waits for either redirect to / or form error; throws with error message if error appears first (fail-fast). */
async function waitForRegistrationOutcome(
  page: Page,
  timeout = 30000
): Promise<void> {
  const redirectPromise = page
    .waitForURL((url) => url.pathname === "/", { timeout })
    .then(() => "redirect" as const);
  const alertPromise = page
    .locator("form [role='alert']")
    .waitFor({ state: "visible", timeout })
    .then(() => "alert" as const);
  const outcome = await Promise.race([redirectPromise, alertPromise]);
  if (outcome === "alert") {
    const text = (await page.locator("form [role='alert']").textContent())?.trim();
    throw new Error(`Registration failed: ${text ?? "(no message)"}`);
  }
}

/** Creates an invite token for the given email using an already-authenticated request context. */
async function createInviteToken(
  request: APIRequestContext,
  baseURL: string,
  email: string
): Promise<string> {
  const res = await request.post(`${baseURL}/api/invites`, {
    headers: { origin: baseURL },
    data: { email, role: "owner" },
  });
  if (!res.ok()) {
    throw new Error(`Failed to create invite for ${email}: ${await res.text()}`);
  }
  const json = await res.json();
  return (json.data as { token: string }).token;
}

// Tokens minted once in beforeAll and shared across tests.
// Success tests each get a unique token; view/validation tests share one.
let sharedToken: string;
let goodRegToken: string;
let edgePwToken: string;
let dupToken: string;

test.beforeAll(async ({ browser, baseURL }) => {
  const base = baseURL ?? "http://localhost:3000";
  const ts = Date.now();

  // Reuse the E2E user session created by the setup project rather than
  // signing up a new account here. This avoids extra sign-ups that would
  // hit Better Auth's rate limiter in local runs (only disabled in CI).
  const authCtx = await browser.newContext({
    storageState: "e2e/.auth/user.json",
  });
  try {
    sharedToken = await createInviteToken(authCtx.request, base, `shared-reg-${ts}@test.com`);
    goodRegToken = await createInviteToken(authCtx.request, base, `reg-good-${ts}@test.com`);
    edgePwToken = await createInviteToken(authCtx.request, base, `edge-pw-${ts}@test.com`);
    // demo@ekost.app is always registered by auth.setup.ts — perfect for the
    // duplicate-email test without needing an additional sign-up.
    dupToken = await createInviteToken(authCtx.request, base, "demo@ekost.app");
  } finally {
    await authCtx.close();
  }
});

test.describe("register", () => {
  test.describe("good cases", () => {
    test("user with valid invite registers and lands on app", async ({
      page,
    }) => {
      await page.goto(`/register?token=${goodRegToken}`);
      await stableFill(page, () => page.getByLabel(/full name/i), "New User");
      await stableFill(page, () => page.getByLabel(/password/i), "SecurePass123!");
      await page.getByRole("button", { name: /register/i }).click();

      await waitForRegistrationOutcome(page);
      await expect(page).toHaveURL("/");
    });

    test("registration page with valid invite displays all required fields", async ({
      page,
    }) => {
      await page.goto(`/register?token=${sharedToken}`);

      await expect(page.getByLabel(/full name/i)).toBeVisible();
      await expect(page.getByLabel(/email address/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(
        page.getByRole("button", { name: /register/i })
      ).toBeVisible();
    });

    test("registration page has link to login", async ({ page }) => {
      await page.goto("/register");

      await expect(page.getByRole("link", { name: /log in/i })).toBeVisible();
    });
  });

  test.describe("bad cases", () => {
    test("user sees validation error for empty name", async ({ page }) => {
      await page.goto(`/register?token=${sharedToken}`);

      await stableFill(page, () => page.getByLabel(/password/i), "ValidPass123!");
      await page.getByRole("button", { name: /register/i }).click();

      await expect(page.getByText(/name is required/i)).toBeVisible();
    });

    test("user without invite token sees invite required error", async ({ page }) => {
      await page.goto("/register");

      await expect(page).toHaveURL(/\/register/);
      await expect(
        page.getByText(/registration requires a valid invite link/i)
      ).toBeVisible();
    });

    test("user with invalid token sees error", async ({ page }) => {
      await page.goto("/register?token=invalid-token-xyz");

      await expect(page).toHaveURL(/\/register/);
      await expect(
        page.getByText(/invalid or has expired|invite.*invalid|invalid.*invite/i)
      ).toBeVisible();
    });

    test("user sees validation error for short password", async ({ page }) => {
      await page.goto(`/register?token=${sharedToken}`);

      await stableFill(page, () => page.getByLabel(/full name/i), "Test User");
      await stableFill(page, () => page.getByLabel(/password/i), "short");
      await page.getByRole("button", { name: /register/i }).click();

      await expect(
        page.getByText(/password must be at least 8 characters/i)
      ).toBeVisible();
    });

    test("user sees error when email is already registered", async ({
      page,
    }) => {
      await page.goto(`/register?token=${dupToken}`);
      await stableFill(page, () => page.getByLabel(/full name/i), "Duplicate User");
      await stableFill(page, () => page.getByLabel(/password/i), "SecurePass123!");
      await page.getByRole("button", { name: /register/i }).click();

      await expect(
        page.locator("form [role='alert']").or(
          page.getByText(/already registered|email.*taken|log in instead/i)
        )
      ).toBeVisible({ timeout: 20000 });
    });
  });

  test.describe("edge cases", () => {
    test("user can register with exactly 8-character password", async ({
      page,
    }) => {
      await page.goto(`/register?token=${edgePwToken}`);
      await stableFill(page, () => page.getByLabel(/full name/i), "Edge User");
      await stableFill(page, () => page.getByLabel(/password/i), "Exactly8");
      await page.getByRole("button", { name: /register/i }).click();

      await waitForRegistrationOutcome(page);
      await expect(page).toHaveURL("/");
    });

    test("password field masks input", async ({ page }) => {
      await page.goto(`/register?token=${sharedToken}`);

      const passwordField = page.getByLabel(/password/i);
      await expect(passwordField).toHaveAttribute("type", "password");
    });

    test("email field uses email input type", async ({ page }) => {
      await page.goto(`/register?token=${sharedToken}`);

      const emailField = page.getByLabel(/email address/i);
      await expect(emailField).toHaveAttribute("type", "email");
    });
  });
});
