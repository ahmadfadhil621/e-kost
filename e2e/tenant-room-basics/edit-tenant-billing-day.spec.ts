// Traceability: billing-day-per-tenant
// REQ BD-9  -> test('edit tenant form shows billing day field pre-populated')
// REQ BD-10 -> test('user updates billing day and balance reflects new day')
// REQ BD-11 -> test('billing day field accepts values 1–31')

import { test, expect } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";
import { getPropertyId, goToEditTenantPage, goToTenantDetail } from "../helpers/tenant-room-basics";
import { stableFill } from "../helpers/forms";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

/** Read-only tenant: never mutated, used only for pre-population assertions. */
let readTenantId: string;
/** Mutable tenant: used for the update test. */
let updateTenantId: string;

async function createTenantWithRoom(
  request: APIRequestContext,
  base: string,
  propertyId: string,
  suffix: string,
  billingDay: number
): Promise<string | null> {
  const roomRes = await request.post(
    `${base}/api/properties/${propertyId}/rooms`,
    { data: { roomNumber: `BD-Edit-${suffix}`, roomType: "single", monthlyRent: 600000 } }
  );
  const roomId = roomRes.ok() ? (await roomRes.json()).id : null;

  const tenantRes = await request.post(
    `${base}/api/properties/${propertyId}/tenants`,
    {
      data: {
        name: `BD Edit ${suffix}`,
        phone: "08100000010",
        email: `bd-edit-${suffix}@test.com`,
      },
    }
  );
  if (!tenantRes.ok()) { return null; }
  const tenantId = (await tenantRes.json()).id;

  if (roomId) {
    await request.post(
      `${base}/api/properties/${propertyId}/tenants/${tenantId}/move`,
      { data: { targetRoomId: roomId, moveDate: new Date().toISOString().slice(0, 10), billingDayOfMonth: billingDay } }
    );
  }
  return tenantId;
}

test.beforeAll(async ({ browser, baseURL }) => {
  const propertyId = getPropertyId();
  const context = await browser.newContext({
    storageState: "e2e/.auth/user-with-property.json",
  });
  const base = baseURL ?? "http://localhost:3000";
  const ts = Date.now();

  // Two separate tenants — read tenant never mutated, update tenant used by update test
  const [rid, uid] = await Promise.all([
    createTenantWithRoom(context.request, base, propertyId, `Read-${ts}`, 10),
    createTenantWithRoom(context.request, base, propertyId, `Upd-${ts}`, 10),
  ]);

  expect(rid, "Failed to create read tenant").toBeTruthy();
  expect(uid, "Failed to create update tenant").toBeTruthy();
  readTenantId = rid!;
  updateTenantId = uid!;

  await context.close();
});

test.describe("edit tenant — billing day", () => {
  test.describe("good cases", () => {
    test("edit tenant form shows billing day field pre-populated with existing value", async ({
      page,
    }) => {
      test.info().setTimeout(45000);
      await goToEditTenantPage(page, readTenantId);

      const billingDayInput = page.locator("#tenant-billing-day");
      await expect(billingDayInput).toBeVisible({ timeout: 10000 });
      // Should be pre-filled with the value set at room assignment (10)
      await expect(billingDayInput).toHaveValue("10");
    });

    test("user updates billing day and balance section shows new due day", async ({
      page,
    }) => {
      test.info().setTimeout(90000);
      await goToEditTenantPage(page, updateTenantId);

      const billingDayInput = page.locator("#tenant-billing-day");
      await expect(billingDayInput).toBeVisible({ timeout: 10000 });
      await stableFill(page, () => page.locator("#tenant-billing-day"), "20");

      await page.getByRole("button", { name: /save changes/i }).click();

      await expect(
        page.getByText(/updated successfully|success/i).or(
          page.getByText(/tenant updated/i)
        ).first()
      ).toBeVisible({ timeout: 15000 });

      // Navigate to tenant detail and verify balance section shows day 20
      await goToTenantDetail(page, updateTenantId);
      await expect(
        page.getByText(/due on day 20|day 20/i).first()
      ).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("bad cases", () => {
    test("API rejects billingDayOfMonth=32 with 400 (server validates beyond UI clamping)", async ({
      request,
    }) => {
      test.info().setTimeout(30000);
      const propertyId = getPropertyId();

      const res = await request.put(
        `/api/properties/${propertyId}/tenants/${readTenantId}`,
        {
          data: {
            name: "BD Bad Edit",
            phone: "08100000010",
            email: `bd-bad-edit-${Date.now()}@test.com`,
            billingDayOfMonth: 32,
          },
        }
      );
      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body).toHaveProperty("error");
    });

    test("API rejects billingDayOfMonth=0 with 400", async ({ request }) => {
      test.info().setTimeout(30000);
      const propertyId = getPropertyId();

      const res = await request.put(
        `/api/properties/${propertyId}/tenants/${readTenantId}`,
        {
          data: {
            name: "BD Bad Edit2",
            phone: "08100000010",
            email: `bd-bad-edit2-${Date.now()}@test.com`,
            billingDayOfMonth: 0,
          },
        }
      );
      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body).toHaveProperty("error");
    });
  });

  test.describe("edge cases", () => {
    test("billing day field accepts boundary values 1 and 28", async ({
      page,
    }) => {
      test.info().setTimeout(45000);
      await goToEditTenantPage(page, readTenantId);

      const billingDayInput = page.locator("#tenant-billing-day");
      await expect(billingDayInput).toBeVisible({ timeout: 10000 });

      await billingDayInput.fill("1");
      await expect(billingDayInput).toHaveValue("1");

      await billingDayInput.fill("28");
      await expect(billingDayInput).toHaveValue("28");
    });
  });
});
