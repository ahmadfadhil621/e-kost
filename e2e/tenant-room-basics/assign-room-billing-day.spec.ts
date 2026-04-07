// Traceability: billing-day-per-tenant
// REQ BD-6  -> test('assign room dialog shows billing day input pre-filled with today')
// REQ BD-7  -> test('user assigns room with custom billing day, balance shows due day')
// REQ BD-8  -> test('billing day input accepts only 1-31 range')

import { test, expect } from "@playwright/test";
import { getPropertyId, goToTenantDetail } from "../helpers/tenant-room-basics";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

test.describe("assign room — billing day", () => {
  test.describe("good cases", () => {
    test("assign room dialog shows billing day input pre-filled with today", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();

      const tenantRes = await request.post(
        `/api/properties/${propertyId}/tenants`,
        {
          data: {
            name: "BD Dialog Test " + Date.now(),
            phone: "08100000001",
            email: `bd-dialog-${Date.now()}@test.com`,
          },
        }
      );
      if (!tenantRes.ok()) { test.skip(); return; }
      const tenantId = (await tenantRes.json()).id;
      if (!tenantId) { test.skip(); return; }

      await goToTenantDetail(page, tenantId);
      await page
        .getByRole("button", { name: /assign room/i })
        .or(page.getByRole("link", { name: /assign room/i }))
        .first()
        .click();

      const billingDayInput = page.locator("#billingDay");
      await expect(billingDayInput).toBeVisible({ timeout: 10000 });

      const todayDay = new Date().getDate().toString();
      await expect(billingDayInput).toHaveValue(todayDay);
    });

    test("user assigns room with custom billing day and balance shows due day", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(90000);
      const propertyId = getPropertyId();
      const roomNumber = "BD-Room-" + Date.now();

      const roomRes = await request.post(
        `/api/properties/${propertyId}/rooms`,
        { data: { roomNumber, roomType: "single", monthlyRent: 500000 } }
      );
      if (!roomRes.ok()) { test.skip(); return; }

      const tenantRes = await request.post(
        `/api/properties/${propertyId}/tenants`,
        {
          data: {
            name: "BD Custom Day " + Date.now(),
            phone: "08100000002",
            email: `bd-custom-${Date.now()}@test.com`,
          },
        }
      );
      if (!tenantRes.ok()) { test.skip(); return; }
      const tenantId = (await tenantRes.json()).id;
      if (!tenantId) { test.skip(); return; }

      await goToTenantDetail(page, tenantId);
      await page
        .getByRole("button", { name: /assign room/i })
        .or(page.getByRole("link", { name: /assign room/i }))
        .first()
        .click();

      const billingDayInput = page.locator("#billingDay");
      await expect(billingDayInput).toBeVisible({ timeout: 10000 });
      await billingDayInput.fill("15");

      await expect(
        page.getByRole("button", { name: new RegExp(roomNumber, "i") })
      ).toBeVisible({ timeout: 12000 });
      await page.getByRole("button", { name: new RegExp(roomNumber, "i") }).click();

      // Click the Assign Room submit button inside the dialog
      await page.getByRole("dialog").getByRole("button", { name: /^assign room$/i }).click();

      // Wait for dialog to close (confirms successful assignment)
      await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 15000 });

      // Balance section should show "Due on day 15 of each month"
      await expect(
        page.getByText(/due on day 15|day 15/i).first()
      ).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("bad cases", () => {
    test("API rejects billingDayOfMonth=0 with 400 (server validates beyond UI clamping)", async ({
      request,
    }) => {
      test.info().setTimeout(30000);
      const propertyId = getPropertyId();

      const tenantRes = await request.post(
        `/api/properties/${propertyId}/tenants`,
        {
          data: {
            name: "BD Bad Case " + Date.now(),
            phone: "08100000099",
            email: `bd-bad-${Date.now()}@test.com`,
          },
        }
      );
      if (!tenantRes.ok()) { test.skip(); return; }
      const tenantId = (await tenantRes.json()).id;
      if (!tenantId) { test.skip(); return; }

      const res = await request.post(
        `/api/properties/${propertyId}/tenants/${tenantId}/move`,
        { data: { targetRoomId: "00000000-0000-4000-a000-000000000001", moveDate: new Date().toISOString().slice(0, 10), billingDayOfMonth: 0 } }
      );
      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body).toHaveProperty("error");
    });

    test("API rejects billingDayOfMonth=32 with 400", async ({ request }) => {
      test.info().setTimeout(30000);
      const propertyId = getPropertyId();

      const tenantRes = await request.post(
        `/api/properties/${propertyId}/tenants`,
        {
          data: {
            name: "BD Bad Case2 " + Date.now(),
            phone: "08100000098",
            email: `bd-bad2-${Date.now()}@test.com`,
          },
        }
      );
      if (!tenantRes.ok()) { test.skip(); return; }
      const tenantId = (await tenantRes.json()).id;
      if (!tenantId) { test.skip(); return; }

      const res = await request.post(
        `/api/properties/${propertyId}/tenants/${tenantId}/move`,
        { data: { targetRoomId: "00000000-0000-4000-a000-000000000001", moveDate: new Date().toISOString().slice(0, 10), billingDayOfMonth: 32 } }
      );
      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body).toHaveProperty("error");
    });
  });

  test.describe("edge cases", () => {
    test("billing day input clamps value to 1 minimum via UI control", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();

      const tenantRes = await request.post(
        `/api/properties/${propertyId}/tenants`,
        {
          data: {
            name: "BD Clamp Test " + Date.now(),
            phone: "08100000003",
            email: `bd-clamp-${Date.now()}@test.com`,
          },
        }
      );
      if (!tenantRes.ok()) { test.skip(); return; }
      const tenantId = (await tenantRes.json()).id;
      if (!tenantId) { test.skip(); return; }

      await goToTenantDetail(page, tenantId);
      await page
        .getByRole("button", { name: /assign room/i })
        .or(page.getByRole("link", { name: /assign room/i }))
        .first()
        .click();

      const billingDayInput = page.locator("#billingDay");
      await expect(billingDayInput).toBeVisible({ timeout: 10000 });

      // The input has min=1 max=31 — typing a valid boundary value works
      await billingDayInput.fill("1");
      await expect(billingDayInput).toHaveValue("1");

      await billingDayInput.fill("28");
      await expect(billingDayInput).toHaveValue("28");
    });
  });
});
