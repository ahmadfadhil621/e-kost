// Traceability: room-inventory-management
// REQ archive.1 -> test('user archives room and is redirected to rooms list')
// REQ archive.2 -> test('user cancels archive and room detail remains')
// REQ archive.3 -> test('user cannot archive room with active tenant')
// REQ unarchive.1 -> test('user restores archived room and sees active state')
// REQ delete.1 -> test('user deletes room and is redirected to rooms list')
// REQ delete.2 -> test('user cancels delete and room detail remains')
// REQ delete.3 -> test('user cannot delete room with active tenant')

import * as fs from "fs";
import * as path from "path";
import { test, expect } from "@playwright/test";
import { goToRoomDetail } from "../../helpers/room-inventory";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

function getPropertyId(): string {
  const filePath = path.join(process.cwd(), "e2e/.auth/property-id.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return data.propertyId;
}

async function createRoom(
  request: Parameters<Parameters<typeof test>[1]>[0]["request"],
  baseURL: string | undefined
): Promise<string> {
  const propertyId = getPropertyId();
  const res = await request.post(
    `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/rooms`,
    {
      data: {
        roomNumber: "E2E-ARC-" + Date.now(),
        roomType: "single",
        monthlyRent: 1500000,
      },
    }
  );
  if (!res.ok()) {
    throw new Error(`Failed to create room: ${res.status()} ${await res.text()}`);
  }
  const room = await res.json();
  return room.id;
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
): Promise<string> {
  const propertyId = getPropertyId();
  const base = baseURL ?? "http://localhost:3000";
  const tenantRes = await request.post(
    `${base}/api/properties/${propertyId}/tenants`,
    {
      data: {
        name: "E2E Tenant " + Date.now(),
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
    `${base}/api/properties/${propertyId}/tenants/${tenant.id}/assign-room`,
    { data: { roomId } }
  );
  if (!assignRes.ok()) {
    throw new Error(`Failed to assign room: ${assignRes.status()} ${await assignRes.text()}`);
  }
  return tenant.id;
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

test.describe("archive and delete room", () => {
  test.describe("good cases", () => {
    test("user archives room and is redirected to rooms list", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const roomId = await createRoom(request, baseURL);

      try {
        await goToRoomDetail(page, roomId);
        await page.getByRole("button", { name: /archive room/i }).click();
        await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
        await page.getByRole("dialog").getByRole("button", { name: /^archive$/i }).click();

        await page.waitForURL(/\/properties\/[^/]+\/rooms$/, { timeout: 15000 });
        await expect(page.getByText(/room archived successfully/i)).toBeVisible({ timeout: 10000 });
      } finally {
        await deleteRoom(request, baseURL, roomId);
      }
    });

    test("user deletes room and is redirected to rooms list", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const roomId = await createRoom(request, baseURL);

      await goToRoomDetail(page, roomId);
      await page.getByRole("button", { name: /delete room/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
      await page.getByRole("dialog").getByRole("button", { name: /^delete$/i }).click();

      await page.waitForURL(/\/properties\/[^/]+\/rooms$/, { timeout: 15000 });
      await expect(page.getByText(/room deleted successfully/i)).toBeVisible({ timeout: 10000 });
    });

    test("user restores archived room and sees active state", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const roomId = await createRoom(request, baseURL);

      try {
        await archiveRoom(request, baseURL, roomId);
        await goToRoomDetail(page, roomId);
        await expect(page.getByText(/^archived$/i)).toBeVisible({ timeout: 5000 });

        await page.getByRole("button", { name: /restore/i }).click();
        await expect(page.getByText(/room restored successfully/i)).toBeVisible({ timeout: 10000 });
        await expect(page.getByText(/^archived$/i)).not.toBeVisible({ timeout: 5000 });
      } finally {
        await deleteRoom(request, baseURL, roomId);
      }
    });
  });

  test.describe("bad cases", () => {
    test("user cannot archive room with active tenant", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const roomId = await createRoom(request, baseURL);
      const tenantId = await createTenantInRoom(request, baseURL, roomId);

      try {
        await goToRoomDetail(page, roomId);
        await page.getByRole("button", { name: /archive room/i }).click();
        await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
        await page.getByRole("dialog").getByRole("button", { name: /^archive$/i }).click();
        await expect(
          page.getByText(/cannot archive.*active tenant|move the tenant out/i)
        ).toBeVisible({ timeout: 10000 });
        // Still on room detail page — no redirect
        await expect(page.getByText(/danger zone/i)).toBeVisible({ timeout: 5000 });
      } finally {
        await moveOutTenant(request, baseURL, tenantId);
        await deleteRoom(request, baseURL, roomId);
      }
    });

    test("user cannot delete room with active tenant", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const roomId = await createRoom(request, baseURL);
      const tenantId = await createTenantInRoom(request, baseURL, roomId);

      try {
        await goToRoomDetail(page, roomId);
        await page.getByRole("button", { name: /delete room/i }).click();
        await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
        await page.getByRole("dialog").getByRole("button", { name: /^delete$/i }).click();
        await expect(
          page.getByText(/cannot delete.*active tenant|move the tenant out/i)
        ).toBeVisible({ timeout: 10000 });
        // Still on room detail page — no redirect
        await expect(page.getByText(/danger zone/i)).toBeVisible({ timeout: 5000 });
      } finally {
        await moveOutTenant(request, baseURL, tenantId);
        await deleteRoom(request, baseURL, roomId);
      }
    });
  });

  test.describe("edge cases", () => {
    test("user cancels archive and room detail remains", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const roomId = await createRoom(request, baseURL);

      try {
        await goToRoomDetail(page, roomId);
        await page.getByRole("button", { name: /archive room/i }).click();
        await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
        await page.getByRole("button", { name: /cancel/i }).click();
        await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
        await expect(page.url()).toMatch(/\/properties\/[^/]+\/rooms\/[^/]+$/);
        await expect(page.getByText(/danger zone/i)).toBeVisible({ timeout: 5000 });
      } finally {
        await deleteRoom(request, baseURL, roomId);
      }
    });

    test("user cancels delete and room detail remains", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const roomId = await createRoom(request, baseURL);

      try {
        await goToRoomDetail(page, roomId);
        await page.getByRole("button", { name: /delete room/i }).click();
        await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
        await page.getByRole("button", { name: /cancel/i }).click();
        await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
        await expect(page.url()).toMatch(/\/properties\/[^/]+\/rooms\/[^/]+$/);
        await expect(page.getByText(/danger zone/i)).toBeVisible({ timeout: 5000 });
      } finally {
        await deleteRoom(request, baseURL, roomId);
      }
    });
  });
});
