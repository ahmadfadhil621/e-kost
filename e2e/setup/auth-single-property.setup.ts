import { test as setup, expect } from "@playwright/test";

const authSinglePropertyFile = "e2e/.auth/user-single-property-no-active.json";

/**
 * Creates authenticated state with exactly ONE property and no active property
 * (no e-kost-active-property-id in localStorage).
 * Used to test the auto-select feature: the app should auto-pick the only property
 * and redirect to "/" without showing the property selector. See issue #79.
 */
setup("create user with single property but no active selection", async ({
  page,
  baseURL,
}) => {
  setup.setTimeout(60000);
  await page.goto("/");

  const res = await page.request.post(`${baseURL}/api/properties`, {
    data: { name: "E2E Single Property", address: "1 Solo St" },
  });
  expect(res.ok(), `Create property failed: ${await res.text()}`).toBe(true);

  // Do not set e-kost-active-property-id — auto-select should handle it on page load.
  await page.context().storageState({ path: authSinglePropertyFile });
});
