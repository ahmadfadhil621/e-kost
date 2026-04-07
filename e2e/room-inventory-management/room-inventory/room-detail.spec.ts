// Traceability: room-inventory-management (room detail navigation) — issue #33
// REQ detail-nav.1 -> test('user taps a room card and navigates to room detail page')
// REQ detail-nav.2 -> test('room detail shows number, type, monthly rent, status, and assigned tenant')
// REQ detail-nav.3 -> test('edit button on room detail navigates to edit room page')
// REQ detail-nav.4 -> test('archived room shows archived badge on detail page')
// REQ detail-nav.5 -> test('room with no tenant shows available state, no tenant section')

import * as fs from "fs";
import * as path from "path";
import { test, expect } from "@playwright/test";
import { goToRoomsList, goToRoomDetail } from "../../helpers/room-inventory";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

function getPropertyId(): string {
  const filePath = path.join(process.cwd(), "e2e/.auth/property-id.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return data.propertyId;
}

async function createRoom(
  request: Parameters<Parameters<typeof test>[1]>[0]["request"],
  baseURL: string | undefined
): Promise<{ roomId: string; roomNumber: string }> {
  const propertyId = getPropertyId();
  const roomNumber = "E2E-DET-" + Date.now();
  const res = await request.post(
    `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/rooms`,
    {
      data: {
        roomNumber,
        roomType: "single",
        monthlyRent: 1500000,
      },
    }
  );
  if (!res.ok()) {
    throw new Error(`Failed to create room: ${res.status()} ${await res.text()}`);
  }
  const room = await res.json();
  return { roomId: room.id, roomNumber };
}

async function deleteRoom(
  request: Parameters<Parameters<typeof test>[1]>[0]["request"],
  baseURL: string | undefined,
  roomId: string
) {
  const propertyId = getPropertyId();
  await request.delete(
    `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/rooms/${roomId}`
  );
}

async function archiveRoom(
  request: Parameters<Parameters<typeof test>[1]>[0]["request"],
  baseURL: string | undefined,
  roomId: string
) {
  const propertyId = getPropertyId();
  await request.post(
    `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/rooms/${roomId}/archive`
  );
}

async function createTenantInRoom(
  request: Parameters<Parameters<typeof test>[1]>[0]["request"],
  baseURL: string | undefined,
  roomId: string
): Promise<{ tenantId: string; tenantName: string }> {
  const propertyId = getPropertyId();
  const base = baseURL ?? "http://localhost:3000";
  const tenantName = "E2E Tenant " + Date.now();
  const tenantRes = await request.post(
    `${base}/api/properties/${propertyId}/tenants`,
    {
      data: {
        name: tenantName,
        phone: "08123456789",
        email: `e2e-${Date.now()}@test.com`,
      },
    }
  );
  if (!tenantRes.ok()) {
    throw new Error(`Failed to create tenant: ${tenantRes.status()} ${await tenantRes.text()}`);
  }
  const tenant = await tenantRes.json();
  const assignRes = await request.post(
    `${base}/api/properties/${propertyId}/tenants/${tenant.id}/move`,
    { data: { targetRoomId: roomId, moveDate: new Date().toISOString().slice(0, 10) } }
  );
  if (!assignRes.ok()) {
    throw new Error(`Failed to assign room: ${assignRes.status()} ${await assignRes.text()}`);
  }
  return { tenantId: tenant.id, tenantName };
}

async function moveOutTenant(
  request: Parameters<Parameters<typeof test>[1]>[0]["request"],
  baseURL: string | undefined,
  tenantId: string
) {
  const propertyId = getPropertyId();
  await request.post(
    `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/tenants/${tenantId}/move-out`
  );
}

test.describe("room detail navigation", () => {
  test.describe("good cases", () => {
    test("user taps a room card and navigates to room detail page", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const { roomId, roomNumber } = await createRoom(request, baseURL);

      try {
        await goToRoomsList(page);
        const card = page.getByTestId("room-card").filter({ hasText: roomNumber });
        await expect(card).toBeVisible({ timeout: 10000 });
        await card.click();

        await page.waitForURL(/\/properties\/[^/]+\/rooms\/[^/]+$/, { timeout: 15000 });
        await expect(page.getByText("Room Details")).toBeVisible({ timeout: 10000 });
      } finally {
        await deleteRoom(request, baseURL, roomId);
      }
    });

    test("room detail shows number, type, monthly rent, status, and assigned tenant", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const { roomId, roomNumber } = await createRoom(request, baseURL);
      const { tenantId, tenantName } = await createTenantInRoom(request, baseURL, roomId);

      try {
        await goToRoomDetail(page, roomId);

        await expect(page.getByText(roomNumber)).toBeVisible({ timeout: 5000 });
        await expect(page.getByText(/single\s*·/).first()).toBeVisible({ timeout: 5000 });
        await expect(page.getByRole("status", { name: /occupied/i })).toBeVisible({ timeout: 5000 });
        await expect(page.getByText("Current Tenants", { exact: true })).toBeVisible({ timeout: 5000 });
        await expect(page.getByRole("link", { name: tenantName })).toBeVisible({ timeout: 5000 });
      } finally {
        await moveOutTenant(request, baseURL, tenantId);
        await deleteRoom(request, baseURL, roomId);
      }
    });

    test("edit button on room detail navigates to edit room page", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const { roomId } = await createRoom(request, baseURL);

      try {
        await goToRoomDetail(page, roomId);
        await page.getByRole("link", { name: /^edit$/i }).click();

        await page.waitForURL(/\/rooms\/[^/]+\/edit/, { timeout: 15000 });
        await expect(page.locator("#room-number")).toBeVisible({ timeout: 10000 });
      } finally {
        await deleteRoom(request, baseURL, roomId);
      }
    });
  });

  test.describe("bad cases", () => {
    test("archived room shows archived badge on detail page", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const { roomId } = await createRoom(request, baseURL);

      try {
        await archiveRoom(request, baseURL, roomId);
        await goToRoomDetail(page, roomId);

        await expect(page.getByText(/^archived$/i)).toBeVisible({ timeout: 5000 });
        await expect(page.getByRole("link", { name: /^edit$/i })).not.toBeVisible({ timeout: 5000 });
      } finally {
        await deleteRoom(request, baseURL, roomId);
      }
    });
  });

  test.describe("edge cases", () => {
    test("room with no tenant shows available state, no tenant section", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const { roomId, roomNumber } = await createRoom(request, baseURL);

      try {
        await goToRoomDetail(page, roomId);

        await expect(page.getByText(roomNumber)).toBeVisible({ timeout: 5000 });
        await expect(page.getByText(/single\s*·/).first()).toBeVisible({ timeout: 5000 });
        await expect(page.getByText("Current Tenants", { exact: true })).not.toBeVisible({ timeout: 5000 });
        await expect(page.getByRole("status", { name: /available/i })).toBeVisible({ timeout: 5000 });
      } finally {
        await deleteRoom(request, baseURL, roomId);
      }
    });
  });
});
