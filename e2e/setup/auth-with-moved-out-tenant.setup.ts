import * as fs from "fs";
import * as path from "path";
import { test as setup, expect } from "@playwright/test";

const authWithMovedOutFile = "e2e/.auth/user-with-moved-out-tenant.json";
const movedOutTenantFile = "e2e/.auth/moved-out-tenant.json";
const ACTIVE_PROPERTY_KEY = "e-kost-active-property-id";

setup("create user with property and moved-out tenant with note", async ({
  page,
  baseURL,
}) => {
  setup.setTimeout(90000);
  await page.goto("/");

  const createPropertyRes = await page.request.post(`${baseURL}/api/properties`, {
    data: { name: "E2E Moved-Out Property", address: "456 E2E Moved-Out St" },
  });
  expect(
    createPropertyRes.ok(),
    `Create property failed: ${await createPropertyRes.text()}`
  ).toBe(true);
  const propertyBody = await createPropertyRes.json();
  const propertyId = propertyBody?.id;
  expect(propertyId, "Create property response must include id").toBeTruthy();

  const roomRes = await page.request.post(
    `${baseURL}/api/properties/${propertyId}/rooms`,
    {
      data: {
        roomNumber: "E2E-MO-1",
        roomType: "single",
        monthlyRent: 800000,
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
        name: "E2E Moved-Out Tenant",
        phone: "081298765432",
        email: "e2e-moved-out-tenant@test.com",
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

  // Create note before move-out (API disallows adding notes to moved-out tenants)
  const noteRes = await page.request.post(
    `${baseURL}/api/properties/${propertyId}/tenants/${tenantId}/notes`,
    {
      data: {
        content: "E2E note for moved-out tenant",
        date: new Date().toISOString().split("T")[0],
      },
    }
  );
  expect(noteRes.ok(), `Create note failed: ${await noteRes.text()}`).toBe(
    true
  );

  const moveOutRes = await page.request.post(
    `${baseURL}/api/properties/${propertyId}/tenants/${tenantId}/move-out`
  );
  expect(
    moveOutRes.ok(),
    `Move-out failed: ${await moveOutRes.text()}`
  ).toBe(true);

  await page.evaluate(
    ({ key, id }) => localStorage.setItem(key, id),
    { key: ACTIVE_PROPERTY_KEY, id: propertyId }
  );
  await page.context().storageState({ path: authWithMovedOutFile });

  const authDir = path.dirname(authWithMovedOutFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  // Do not write property-id.json here; it is shared with setup-with-property.
  // chromium tests must use the main property from setup-with-property.
  // moved-out-notes tests use getMovedOutTenantSetup() which reads this file.
  fs.writeFileSync(
    movedOutTenantFile,
    JSON.stringify({ propertyId, movedOutTenantId: tenantId }),
    "utf-8"
  );
});
