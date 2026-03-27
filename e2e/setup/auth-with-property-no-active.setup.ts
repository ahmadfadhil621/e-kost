import { test as setup, expect } from "@playwright/test";

const authNoActiveFile = "e2e/.auth/user-properties-no-active.json";

/**
 * Creates authenticated state with TWO properties but no active property
 * (no e-kost-active-property-id in localStorage). Used for Property Selector E2E.
 * Two properties ensure the auto-select feature (single-property) does NOT trigger,
 * so the selector screen is still shown. See issue #79.
 */
setup("create user with two properties but no active selection", async ({
  page,
  baseURL,
}) => {
  setup.setTimeout(60000);
  await page.goto("/");

  const res1 = await page.request.post(`${baseURL}/api/properties`, {
    data: { name: "E2E Selector Property", address: "456 Selector St" },
  });
  expect(res1.ok(), `Create property 1 failed: ${await res1.text()}`).toBe(true);

  const res2 = await page.request.post(`${baseURL}/api/properties`, {
    data: { name: "E2E Selector Property 2", address: "789 Selector Ave" },
  });
  expect(res2.ok(), `Create property 2 failed: ${await res2.text()}`).toBe(true);

  // Do not set e-kost-active-property-id so the app shows Property Selector.
  await page.context().storageState({ path: authNoActiveFile });
});
