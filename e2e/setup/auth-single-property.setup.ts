import { test as setup, expect } from "@playwright/test";

const authSinglePropertyFile = "e2e/.auth/user-single-property-no-active.json";

/**
 * Creates a FRESH user with exactly ONE property and no active property
 * (no e-kost-active-property-id in localStorage).
 * A fresh user is required so no other setup step adds extra properties,
 * which would prevent the auto-select feature from triggering. See issue #79.
 */
setup("create fresh user with single property", async ({ page, baseURL }) => {
  setup.setTimeout(60000);
  const base = baseURL ?? "http://localhost:3000";
  const email = `e2e-single-prop-${Date.now()}@test.com`;

  const signUpRes = await page.request.post(`${base}/api/auth/sign-up/email`, {
    headers: { origin: base },
    data: { name: "E2E Single Property User", email, password: "TestPass123!" },
  });
  expect(signUpRes.ok(), `Sign-up failed: ${await signUpRes.text()}`).toBe(true);

  const signInRes = await page.request.post(`${base}/api/auth/sign-in/email`, {
    headers: { origin: base },
    data: { email, password: "TestPass123!", rememberMe: true },
  });
  expect(signInRes.ok(), `Sign-in failed: ${await signInRes.text()}`).toBe(true);

  // Navigate to establish the session cookie in the page context
  await page.goto("/");
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 30000,
  });

  const res = await page.request.post(`${base}/api/properties`, {
    data: { name: "E2E Single Property", address: "1 Solo St" },
  });
  expect(res.ok(), `Create property failed: ${await res.text()}`).toBe(true);

  // Save auth state WITHOUT e-kost-active-property-id in localStorage.
  await page.context().storageState({ path: authSinglePropertyFile });
});
