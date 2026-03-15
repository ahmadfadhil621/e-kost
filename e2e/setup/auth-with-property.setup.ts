import * as fs from "fs";
import * as path from "path";
import { test as setup, expect } from "@playwright/test";

const authWithPropertyFile = "e2e/.auth/user-with-property.json";
const propertyIdFile = "e2e/.auth/property-id.json";
const ACTIVE_PROPERTY_KEY = "e-kost-active-property-id";

setup("create user with one property", async ({ page, baseURL }) => {
  setup.setTimeout(60000);
  await page.goto("/");
  const res = await page.request.post(`${baseURL}/api/properties`, {
    data: { name: "E2E Property", address: "123 E2E Street" },
  });
  expect(res.ok(), `Create property failed: ${await res.text()}`).toBe(true);
  const body = await res.json();
  const propertyId = body?.id;
  expect(propertyId, "Create property response must include id").toBeTruthy();

  const roomRes = await page.request.post(
    `${baseURL}/api/properties/${propertyId}/rooms`,
    {
      data: {
        roomNumber: "E2E-1",
        roomType: "single",
        monthlyRent: 1000000,
      },
    }
  );
  expect(roomRes.ok(), `Create room failed: ${await roomRes.text()}`).toBe(
    true
  );
  const roomBody = await roomRes.json();
  const roomId = roomBody?.id;
  expect(roomId, "Room response must include id").toBeTruthy();

  const tenantRes = await page.request.post(
    `${baseURL}/api/properties/${propertyId}/tenants`,
    {
      data: {
        name: "E2E Payment Tenant",
        phone: "081234567890",
        email: "e2e-payment-tenant@test.com",
      },
    }
  );
  expect(tenantRes.ok(), `Create tenant failed: ${await tenantRes.text()}`).toBe(
    true
  );
  const tenantBody = await tenantRes.json();
  const tenantId = tenantBody?.id;
  expect(tenantId, "Tenant response must include id").toBeTruthy();

  const assignRes = await page.request.post(
    `${baseURL}/api/properties/${propertyId}/tenants/${tenantId}/assign-room`,
    { data: { roomId } }
  );
  expect(assignRes.ok(), `Assign room failed: ${await assignRes.text()}`).toBe(
    true
  );

  await page.evaluate(
    ({ key, id }) => localStorage.setItem(key, id),
    { key: ACTIVE_PROPERTY_KEY, id: propertyId }
  );
  await page.context().storageState({ path: authWithPropertyFile });

  const authDir = path.dirname(authWithPropertyFile);
  if (!fs.existsSync(authDir)) {fs.mkdirSync(authDir, { recursive: true });}
  fs.writeFileSync(
    propertyIdFile,
    JSON.stringify({ propertyId }),
    "utf-8"
  );
});
