// Traceability: property-archive-delete (issue #27)
// AC-7  -> test('user types property name and deletes — redirected to properties list')
// AC-9  -> test('delete button stays disabled until property name is typed correctly')
// AC-10 -> test('delete button is disabled when property has active tenants')
// AC-12 -> test('delete button is disabled when property has active tenants')
// AC-9  -> test('user cancels delete dialog and stays on property detail page')

import { test, expect, type APIRequestContext, type Page } from "@playwright/test";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

const BASE = "http://localhost:3000";

type RequestFixture = APIRequestContext;
type PageFixture = Page;

async function createProperty(request: RequestFixture, name: string): Promise<string> {
  const res = await request.post(`${BASE}/api/properties`, {
    data: { name, address: "123 E2E Street", currency: "IDR" },
  });
  if (!res.ok()) {
    throw new Error(`Failed to create property: ${res.status()} ${await res.text()}`);
  }
  const body = await res.json();
  return body.id as string;
}

async function deletePropertyApi(request: RequestFixture, propertyId: string): Promise<void> {
  await request.delete(`${BASE}/api/properties/${propertyId}`);
}

async function createRoomInProperty(
  request: RequestFixture,
  propertyId: string
): Promise<string> {
  const res = await request.post(`${BASE}/api/properties/${propertyId}/rooms`, {
    data: { roomNumber: "E2E-DEL-" + Date.now(), roomType: "single", monthlyRent: 1500000 },
  });
  if (!res.ok()) { throw new Error(`Failed to create room: ${res.status()}`); }
  const body = await res.json();
  return body.id as string;
}

async function createActiveTenant(
  request: RequestFixture,
  propertyId: string,
  roomId: string
): Promise<string> {
  const tenantRes = await request.post(`${BASE}/api/properties/${propertyId}/tenants`, {
    data: {
      name: "E2E Active Tenant " + Date.now(),
      phone: "08123456789",
      email: `e2e-del-${Date.now()}@test.com`,
    },
  });
  if (!tenantRes.ok()) { throw new Error(`Failed to create tenant: ${tenantRes.status()}`); }
  const tenant = await tenantRes.json();

  const assignRes = await request.post(
    `${BASE}/api/properties/${propertyId}/tenants/${tenant.id}/move`,
    { data: { targetRoomId: roomId, moveDate: new Date().toISOString().slice(0, 10) } }
  );
  if (!assignRes.ok()) { throw new Error(`Failed to assign room: ${assignRes.status()}`); }

  return tenant.id as string;
}

async function moveOutTenant(
  request: RequestFixture,
  propertyId: string,
  tenantId: string
): Promise<void> {
  await request.post(
    `${BASE}/api/properties/${propertyId}/tenants/${tenantId}/move-out`
  );
}

async function goToPropertyDetail(page: PageFixture, propertyId: string): Promise<void> {
  await page.goto(`/properties/${propertyId}`, { waitUntil: "domcontentloaded" });
  await page.waitForURL(/\/properties\/[^/]+$/, { timeout: 8000 }).catch(() => {});
  await page.getByText(/danger zone/i).waitFor({ state: "visible", timeout: 15000 });
}

test.describe("delete property", () => {
  test.describe("good cases", () => {
    test("user types property name exactly and deletes — redirected to properties list with success toast", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const name = "E2E Delete Prop " + Date.now();
      const propertyId = await createProperty(request, name);

      // No finally cleanup — property is deleted by the test itself
      await goToPropertyDetail(page, propertyId);

      await page.getByRole("button", { name: /delete property/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });

      // Delete button should be disabled before typing
      const confirmDeleteBtn = page
        .getByRole("dialog")
        .getByRole("button", { name: /^delete$/i });
      await expect(confirmDeleteBtn).toBeDisabled();

      // Type the property name to enable the button
      await page.getByLabel(/type the property name to confirm/i).fill(name);
      await expect(confirmDeleteBtn).toBeEnabled({ timeout: 3000 });

      await confirmDeleteBtn.click();

      await page.waitForURL(/\/properties$/, { timeout: 15000 });
      await expect(
        page.getByText("Property deleted successfully", { exact: true })
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("bad cases", () => {
    test("delete button stays disabled until property name is typed correctly", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const name = "E2E Confirm Name " + Date.now();
      const propertyId = await createProperty(request, name);

      try {
        await goToPropertyDetail(page, propertyId);

        await page.getByRole("button", { name: /delete property/i }).click();
        await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });

        const confirmDeleteBtn = page
          .getByRole("dialog")
          .getByRole("button", { name: /^delete$/i });
        const nameInput = page.getByLabel(/type the property name to confirm/i);

        // Initially disabled
        await expect(confirmDeleteBtn).toBeDisabled();

        // Wrong name — button stays disabled
        await nameInput.fill("wrong name");
        await expect(confirmDeleteBtn).toBeDisabled();

        // Partial match — button stays disabled
        await nameInput.fill(name.slice(0, -1));
        await expect(confirmDeleteBtn).toBeDisabled();

        // Exact match — button becomes enabled
        await nameInput.fill(name);
        await expect(confirmDeleteBtn).toBeEnabled({ timeout: 3000 });
      } finally {
        await page.getByRole("button", { name: /cancel/i }).click();
        await deletePropertyApi(request, propertyId);
      }
    });

    test("delete button is disabled when property has active tenants", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const name = "E2E Occupied Del " + Date.now();
      const propertyId = await createProperty(request, name);
      const roomId = await createRoomInProperty(request, propertyId);
      const tenantId = await createActiveTenant(request, propertyId, roomId);

      try {
        await goToPropertyDetail(page, propertyId);

        const deleteBtn = page.getByRole("button", { name: /delete property/i });
        await expect(deleteBtn).toBeVisible({ timeout: 5000 });
        await expect(deleteBtn).toBeDisabled();
        await expect(
          page.getByText(/move all tenants out before archiving or deleting/i)
        ).toBeVisible();

        // Dialog must not open on force click
        await deleteBtn.click({ force: true });
        await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 3000 });
      } finally {
        await moveOutTenant(request, propertyId, tenantId);
        await deletePropertyApi(request, propertyId);
      }
    });
  });

  test.describe("edge cases", () => {
    test("user cancels delete dialog and stays on property detail page", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const name = "E2E Cancel Delete " + Date.now();
      const propertyId = await createProperty(request, name);

      try {
        await goToPropertyDetail(page, propertyId);

        await page.getByRole("button", { name: /delete property/i }).click();
        await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
        await page.getByRole("button", { name: /cancel/i }).click();

        await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
        await expect(page.url()).toMatch(/\/properties\/[^/]+$/);
        await expect(page.getByText(/danger zone/i)).toBeVisible({ timeout: 5000 });
      } finally {
        await deletePropertyApi(request, propertyId);
      }
    });
  });
});
