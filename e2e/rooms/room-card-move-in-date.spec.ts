// Traceability: room-tenant-move-in-date
// AC-1 -> test('occupied room card shows tenant name and move-in date')
// AC-2 -> test('occupied room card with multi-tenant shows multiple names')
// AC-4 -> (covered by Vitest component tests)
// AC-5 -> (covered by Vitest component tests)

import * as fs from "fs";
import * as path from "path";
import { test, expect, type APIRequestContext } from "@playwright/test";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPropertyId(): string {
  const filePath = path.join(process.cwd(), "e2e/.auth/property-id.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return data.propertyId;
}

async function createRoom(
  request: APIRequestContext,
  propertyId: string,
  opts: { capacity?: number } = {}
): Promise<{ roomId: string; roomNumber: string }> {
  const roomNumber = "MoveIn-" + Date.now();
  const res = await request.post(
    `/api/properties/${propertyId}/rooms`,
    {
      data: {
        roomNumber,
        roomType: "single",
        monthlyRent: 1500000,
        ...(opts.capacity !== undefined ? { capacity: opts.capacity } : {}),
      },
    }
  );
  if (!res.ok()) {
    throw new Error(
      `Failed to create room: ${res.status()} ${await res.text()}`
    );
  }
  const body = await res.json();
  return { roomId: body.id as string, roomNumber };
}

async function createTenantAndAssign(
  request: APIRequestContext,
  propertyId: string,
  roomId: string,
  nameSuffix: string
): Promise<{ tenantId: string; tenantName: string }> {
  const tenantName = "MoveIn Tenant " + nameSuffix;
  const ts = Date.now();

  const tenantRes = await request.post(
    `/api/properties/${propertyId}/tenants`,
    {
      data: {
        name: tenantName,
        phone: "08123456789",
        email: `movein-${ts}-${nameSuffix.replace(/[^a-zA-Z0-9]/g, "")}@test.com`,
      },
    }
  );
  if (!tenantRes.ok()) {
    throw new Error(
      `Failed to create tenant: ${tenantRes.status()} ${await tenantRes.text()}`
    );
  }
  const tenant = await tenantRes.json();

  const assignRes = await request.post(
    `/api/properties/${propertyId}/tenants/${tenant.id}/move`,
    { data: { targetRoomId: roomId, moveDate: new Date().toISOString().slice(0, 10) } }
  );
  if (!assignRes.ok()) {
    throw new Error(
      `Failed to assign room: ${assignRes.status()} ${await assignRes.text()}`
    );
  }

  return { tenantId: tenant.id as string, tenantName };
}

async function moveOutTenant(
  request: APIRequestContext,
  propertyId: string,
  tenantId: string
): Promise<void> {
  await request
    .post(`/api/properties/${propertyId}/tenants/${tenantId}/move-out`)
    .catch(() => {});
}

async function deleteRoom(
  request: APIRequestContext,
  propertyId: string,
  roomId: string
): Promise<void> {
  await request
    .delete(`/api/properties/${propertyId}/rooms/${roomId}`)
    .catch(() => {});
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("room-card-move-in-date", () => {
  test.describe("good cases", () => {
    test(
      "occupied room card shows tenant name and move-in date",
      async ({ page, request }) => {
        test.info().setTimeout(90000);

        const propertyId = getPropertyId();
        const { roomId, roomNumber } = await createRoom(request, propertyId);
        const { tenantId, tenantName } = await createTenantAndAssign(
          request,
          propertyId,
          roomId,
          "A-" + Date.now()
        );

        try {
          await page.setViewportSize({ width: 375, height: 667 });
          await page.goto(`/properties/${propertyId}/rooms`, {
            waitUntil: "domcontentloaded",
          });

          // Wait for rooms list content to load
          await page
            .getByRole("link", { name: /add room/i })
            .or(page.getByText(/no rooms found/i))
            .first()
            .waitFor({ state: "visible", timeout: 15000 });

          // Find the specific room card by room number
          const card = page
            .getByTestId("room-card")
            .filter({ hasText: roomNumber });
          await expect(card).toBeVisible({ timeout: 10000 });

          // AC-1: tenant name is shown (potentially abbreviated to "MoveIn T. A-{ts}")
          // Match on the unique last word which survives abbreviation unchanged
          const tenantNameWords = tenantName.split(" ");
          const uniqueSuffix = tenantNameWords[tenantNameWords.length - 1];
          await expect(
            card.getByText(new RegExp(uniqueSuffix, "i"))
          ).toBeVisible({ timeout: 5000 });

          // AC-1: "since" date label is shown
          await expect(
            card.getByText(/since/i)
          ).toBeVisible({ timeout: 5000 });
        } finally {
          await moveOutTenant(request, propertyId, tenantId);
          await deleteRoom(request, propertyId, roomId);
        }
      }
    );
  });

  test.describe("edge cases", () => {
    test(
      "occupied room card with multi-tenant shows multiple names",
      async ({ page, request }) => {
        test.info().setTimeout(90000);

        const propertyId = getPropertyId();
        const { roomId, roomNumber } = await createRoom(request, propertyId, {
          capacity: 2,
        });

        const ts = Date.now();
        const { tenantId: tenantId1, tenantName: tenantName1 } =
          await createTenantAndAssign(
            request,
            propertyId,
            roomId,
            "T1-" + ts
          );
        const { tenantId: tenantId2, tenantName: tenantName2 } =
          await createTenantAndAssign(
            request,
            propertyId,
            roomId,
            "T2-" + ts
          );

        try {
          await page.setViewportSize({ width: 375, height: 667 });
          await page.goto(`/properties/${propertyId}/rooms`, {
            waitUntil: "domcontentloaded",
          });

          // Wait for rooms list content to load
          await page
            .getByRole("link", { name: /add room/i })
            .or(page.getByText(/no rooms found/i))
            .first()
            .waitFor({ state: "visible", timeout: 15000 });

          // Find the specific room card by room number
          const card = page
            .getByTestId("room-card")
            .filter({ hasText: roomNumber });
          await expect(card).toBeVisible({ timeout: 10000 });

          // AC-2: both tenant names are shown (potentially abbreviated)
          // Match on the unique last word of each name which survives abbreviation unchanged
          const name1Words = tenantName1.split(" ");
          const name2Words = tenantName2.split(" ");
          const uniqueSuffix1 = name1Words[name1Words.length - 1];
          const uniqueSuffix2 = name2Words[name2Words.length - 1];
          await expect(
            card.getByText(new RegExp(uniqueSuffix1, "i"))
          ).toBeVisible({ timeout: 5000 });
          await expect(
            card.getByText(new RegExp(uniqueSuffix2, "i"))
          ).toBeVisible({ timeout: 5000 });

          // AC-2: "since" date label is shown (earliest move-in)
          await expect(
            card.getByText(/since/i)
          ).toBeVisible({ timeout: 5000 });
        } finally {
          await moveOutTenant(request, propertyId, tenantId1);
          await moveOutTenant(request, propertyId, tenantId2);
          await deleteRoom(request, propertyId, roomId);
        }
      }
    );
  });
});
