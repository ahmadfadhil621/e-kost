// Traceability: property-archive-delete (issue #27)
// AC-1  -> test('user archives property with no active tenants and is redirected')
// AC-3  -> test('user restores archived property and can manage it again')
// AC-4  -> test('archive button is disabled when property has active tenants')
// AC-12 -> test('archive button is disabled when property has active tenants')
// AC-15 -> test('user archives property with no active tenants and is redirected')
// AC-3  -> test('user cancels archive dialog and stays on detail page') [cancel = preserve]

import { test, expect, type APIRequestContext, type Page } from "@playwright/test";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

const BASE = "http://localhost:3000";

type RequestFixture = APIRequestContext;

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

async function deleteProperty(request: RequestFixture, propertyId: string): Promise<void> {
  await request.delete(`${BASE}/api/properties/${propertyId}`);
}

async function archiveProperty(request: RequestFixture, propertyId: string): Promise<void> {
  await request.post(`${BASE}/api/properties/${propertyId}/archive`);
}

async function unarchiveProperty(request: RequestFixture, propertyId: string): Promise<void> {
  await request.post(`${BASE}/api/properties/${propertyId}/unarchive`);
}

async function createRoomInProperty(
  request: RequestFixture,
  propertyId: string
): Promise<string> {
  const res = await request.post(`${BASE}/api/properties/${propertyId}/rooms`, {
    data: { roomNumber: "E2E-ARC-" + Date.now(), roomType: "single", monthlyRent: 1500000 },
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
      email: `e2e-arc-${Date.now()}@test.com`,
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

async function goToPropertyDetail(
  page: Page,
  propertyId: string
): Promise<void> {
  await page.goto(`/properties/${propertyId}`, { waitUntil: "domcontentloaded" });
  await page.waitForURL(/\/properties\/[^/]+$/, { timeout: 8000 }).catch(() => {});
  await page.getByText(/danger zone/i).waitFor({ state: "visible", timeout: 15000 });
}

test.describe("archive property", () => {
  test.describe("good cases", () => {
    test("user archives property with no active tenants and is redirected to properties list", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const name = "E2E Archive Prop " + Date.now();
      const propertyId = await createProperty(request, name);

      try {
        await goToPropertyDetail(page, propertyId);

        await page.getByRole("button", { name: /archive property/i }).click();
        await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
        await page.getByRole("dialog").getByRole("button", { name: /^archive$/i }).click();

        await page.waitForURL(/\/properties$/, { timeout: 15000 });
        await expect(
          page.getByText("Property archived successfully", { exact: true })
        ).toBeVisible({ timeout: 10000 });
      } finally {
        await unarchiveProperty(request, propertyId);
        await deleteProperty(request, propertyId);
      }
    });

    test("user restores archived property and property detail is accessible again", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const name = "E2E Restore Prop " + Date.now();
      const propertyId = await createProperty(request, name);

      try {
        await archiveProperty(request, propertyId);
        await goToPropertyDetail(page, propertyId);

        await page.getByRole("button", { name: /restore/i }).click();
        await expect(
          page.getByText("Property restored successfully", { exact: true })
        ).toBeVisible({ timeout: 10000 });
        // Restore button should disappear after unarchiving
        await expect(page.getByRole("button", { name: /restore/i })).not.toBeVisible({
          timeout: 5000,
        });
      } finally {
        await deleteProperty(request, propertyId);
      }
    });
  });

  test.describe("bad cases", () => {
    test("archive button is disabled when property has active tenants", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const name = "E2E Occupied Prop " + Date.now();
      const propertyId = await createProperty(request, name);
      const roomId = await createRoomInProperty(request, propertyId);
      const tenantId = await createActiveTenant(request, propertyId, roomId);

      try {
        await goToPropertyDetail(page, propertyId);

        const archiveBtn = page.getByRole("button", { name: /archive property/i });
        await expect(archiveBtn).toBeVisible({ timeout: 5000 });
        await expect(archiveBtn).toBeDisabled();
        await expect(
          page.getByText(/move all tenants out before archiving or deleting/i)
        ).toBeVisible();

        // Dialog must not open on force click
        await archiveBtn.click({ force: true });
        await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 3000 });
      } finally {
        await moveOutTenant(request, propertyId, tenantId);
        await deleteProperty(request, propertyId);
      }
    });
  });

  test.describe("edge cases", () => {
    test("user cancels archive dialog and stays on property detail page", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const name = "E2E Cancel Archive " + Date.now();
      const propertyId = await createProperty(request, name);

      try {
        await goToPropertyDetail(page, propertyId);

        await page.getByRole("button", { name: /archive property/i }).click();
        await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
        await page.getByRole("button", { name: /cancel/i }).click();

        await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
        await expect(page.url()).toMatch(/\/properties\/[^/]+$/);
        await expect(page.getByText(/danger zone/i)).toBeVisible({ timeout: 5000 });
      } finally {
        await deleteProperty(request, propertyId);
      }
    });
  });
});
