import * as fs from "fs";
import * as path from "path";
import { test as setup, expect } from "@playwright/test";

const authDevFile = "e2e/.auth/dev-user.json";
const propertyIdFile = "e2e/.auth/dev-property-id.json";
const ACTIVE_PROPERTY_KEY = "e-kost-active-property-id";
const DEV_E2E_EMAIL = "dev@e2e.test";
const DEV_E2E_PASSWORD = "DevPass123!";
const DEV_E2E_NAME = "E2E Dev User";

setup("create dev user with property", async ({ page, baseURL }) => {
  setup.setTimeout(60000);
  const base = baseURL ?? "http://localhost:3000";

  // Try sign-up — may already exist from a previous run (not deleted by teardown since not @test.com)
  const signUpRes = await page.request.post(`${base}/api/auth/sign-up/email`, {
    headers: { origin: base },
    data: { name: DEV_E2E_NAME, email: DEV_E2E_EMAIL, password: DEV_E2E_PASSWORD },
  });

  // 422 = already exists; anything else unexpected is an error
  if (!signUpRes.ok() && signUpRes.status() !== 422) {
    throw new Error(`Dev user sign-up failed: ${signUpRes.status()} ${await signUpRes.text()}`);
  }

  const signInRes = await page.request.post(`${base}/api/auth/sign-in/email`, {
    headers: { origin: base },
    data: { email: DEV_E2E_EMAIL, password: DEV_E2E_PASSWORD, rememberMe: true },
  });
  expect(signInRes.ok(), `Dev sign-in failed: ${await signInRes.text()}`).toBe(true);

  await page.goto("/");
  await page.waitForURL((url) => url.pathname === "/", { timeout: 30000 });

  const res = await page.request.post(`${base}/api/properties`, {
    data: { name: "Dev E2E Property", address: "1 Dev Street", currency: "IDR" },
  });
  const body = res.ok() ? await res.json() : null;
  const propertyId = body?.id;

  if (propertyId) {
    await page.evaluate(
      ({ key, id }) => localStorage.setItem(key, id),
      { key: ACTIVE_PROPERTY_KEY, id: propertyId }
    );
  }

  // Seed default currencies (EUR, IDR) required by currency E2E tests.
  // 409 = already exists from a previous run — safe to ignore.
  const defaultCurrencies = [
    { code: "EUR", locale: "en-IE", label: "Euro" },
    { code: "IDR", locale: "id-ID", label: "Indonesian Rupiah" },
  ];
  for (const currency of defaultCurrencies) {
    const seedRes = await page.request.post(`${base}/api/currencies`, {
      data: currency,
    });
    if (!seedRes.ok() && seedRes.status() !== 409) {
      console.warn(`[setup] Currency seed for ${currency.code} returned ${seedRes.status()} — continuing`);
    }
  }

  await page.context().storageState({ path: authDevFile });

  const authDir = path.dirname(authDevFile);
  if (!fs.existsSync(authDir)) { fs.mkdirSync(authDir, { recursive: true }); }
  if (propertyId) {
    fs.writeFileSync(propertyIdFile, JSON.stringify({ propertyId }), "utf-8");
  }
});
