import { test as setup, expect } from "@playwright/test";

const authNoActiveFile = "e2e/.auth/user-properties-no-active.json";

/**
 * Creates authenticated state with at least one property but no active property
 * (no e-kost-active-property-id in localStorage). Used for Property Selector E2E.
 */
setup("create user with property but no active selection", async ({
  page,
  baseURL,
}) => {
  setup.setTimeout(60000);
  await page.goto("/");

  const res = await page.request.post(`${baseURL}/api/properties`, {
    data: { name: "E2E Selector Property", address: "456 Selector St" },
  });
  expect(res.ok(), `Create property failed: ${await res.text()}`).toBe(true);
  const body = await res.json();
  const propertyId = body?.id;
  expect(propertyId, "Create property response must include id").toBeTruthy();

  // Do not set e-kost-active-property-id so the app shows Property Selector when implemented.
  await page.context().storageState({ path: authNoActiveFile });
});
