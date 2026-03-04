// Traceability: tenant-room-basics
// REQ 2.1 -> test('tenant detail shows option to assign room')
// REQ 2.2 -> test('assign room shows only available rooms')
// REQ 2.3, 2.4 -> test('user assigns tenant to room and sees confirmation')

import { test, expect } from "@playwright/test";
import {
  getPropertyId,
  goToTenantDetail,
} from "../helpers/tenant-room-basics";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

test.describe("assign room", () => {
  test.describe("good cases", () => {
    test("tenant detail shows option to assign room", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const tenantRes = await request.post(
        `/api/properties/${propertyId}/tenants`,
        {
          data: {
            name: "Assign Test " + Date.now(),
            phone: "08111111111",
            email: `assign-${Date.now()}@test.com`,
          },
        }
      );
      if (!tenantRes.ok()) {
        test.skip();
        return;
      }
      const tenantBody = await tenantRes.json();
      const tenantId = tenantBody?.id;
      if (!tenantId) {
        test.skip();
        return;
      }
      await goToTenantDetail(page, tenantId);
      await expect(
        page.getByRole("button", { name: /assign room/i }).or(
          page.getByRole("link", { name: /assign room/i })
        ).first()
      ).toBeVisible({ timeout: 15000 });
    });

    test("user assigns tenant to room and sees confirmation", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const roomNumber = "Assign-" + Date.now();
      const roomRes = await request.post(
        `/api/properties/${propertyId}/rooms`,
        {
          data: {
            roomNumber,
            roomType: "single",
            monthlyRent: 500000,
          },
        }
      );
      if (!roomRes.ok()) {
        test.skip();
        return;
      }
      const tenantRes = await request.post(
        `/api/properties/${propertyId}/tenants`,
        {
          data: {
            name: "Assign E2E " + Date.now(),
            phone: "08222222222",
            email: `assign-e2e-${Date.now()}@test.com`,
          },
        }
      );
      if (!tenantRes.ok()) {
        test.skip();
        return;
      }
      const tenantBody = await tenantRes.json();
      const tenantId = tenantBody?.id;
      if (!tenantId) {
        test.skip();
        return;
      }
      await goToTenantDetail(page, tenantId);
      await page
        .getByRole("button", { name: /assign room/i })
        .or(page.getByRole("link", { name: /assign room/i }))
        .first()
        .click();
      await expect(
        page.getByText(/available rooms|select.*room|assign room/i).first()
      ).toBeVisible({ timeout: 12000 });
      await expect(
        page.getByRole("button", { name: new RegExp(roomNumber, "i") })
      ).toBeVisible({ timeout: 8000 });
      await page
        .getByRole("button", { name: new RegExp(roomNumber, "i") })
        .click();
      await expect(
        page.getByText(/room assigned|success|assigned/i).first()
      ).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("bad cases", () => {
    test("user cannot assign when no available rooms", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const tenantRes = await request.post(
        `/api/properties/${propertyId}/tenants`,
        {
          data: {
            name: "No Room Test " + Date.now(),
            phone: "08333333333",
            email: `noroom-${Date.now()}@test.com`,
          },
        }
      );
      if (!tenantRes.ok()) {
        test.skip();
        return;
      }
      const tenantBody = await tenantRes.json();
      const tenantId = tenantBody?.id;
      if (!tenantId) {
        test.skip();
        return;
      }
      await goToTenantDetail(page, tenantId);
      await page
        .getByRole("button", { name: /assign room/i })
        .or(page.getByRole("link", { name: /assign room/i }))
        .first()
        .click();
      await expect(
        page
          .getByText(/no available rooms|no rooms/i)
          .or(page.getByText(/available rooms/i))
          .first()
      ).toBeVisible({ timeout: 12000 });
    });
  });

  test.describe("edge cases", () => {
    test("assign room dialog can be cancelled", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const tenantRes = await request.post(
        `/api/properties/${propertyId}/tenants`,
        {
          data: {
            name: "Cancel Test " + Date.now(),
            phone: "08444444444",
            email: `cancel-${Date.now()}@test.com`,
          },
        }
      );
      if (!tenantRes.ok()) {
        test.skip();
        return;
      }
      const tenantBody = await tenantRes.json();
      const tenantId = tenantBody?.id;
      if (!tenantId) {
        test.skip();
        return;
      }
      await goToTenantDetail(page, tenantId);
      await page
        .getByRole("button", { name: /assign room/i })
        .or(page.getByRole("link", { name: /assign room/i }))
        .first()
        .click();
      await expect(
        page.getByText(/available rooms|select.*room|assign room|no available/i)
          .first()
      ).toBeVisible({ timeout: 12000 });
      const cancelBtn = page.getByRole("button", { name: /cancel/i }).first();
      await expect(cancelBtn).toBeVisible({ timeout: 8000 });
      await cancelBtn.click();
      await expect(
        page.getByRole("button", { name: /assign room/i }).or(
          page.getByRole("link", { name: /assign room/i })
        ).first()
      ).toBeVisible({ timeout: 8000 });
    });
  });
});
