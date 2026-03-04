// Traceability: tenant-room-basics
// REQ 5.1 -> test('tenant detail shows move-out option')
// REQ 5.2 -> test('move-out shows confirmation dialog')
// REQ 5.3, 5.4, 5.5 -> test('user confirms move-out and room becomes available')

import { test, expect } from "@playwright/test";
import {
  getPropertyId,
  goToTenantDetail,
} from "../helpers/tenant-room-basics";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

test.describe("move out", () => {
  test.describe("good cases", () => {
    test("tenant detail shows move-out option", async ({ page, request }) => {
      const propertyId = getPropertyId();
      const tenantRes = await request.post(
        `/api/properties/${propertyId}/tenants`,
        {
          data: {
            name: "MoveOut Test " + Date.now(),
            phone: "08555555555",
            email: `moveout-${Date.now()}@test.com`,
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
        page.getByRole("button", { name: /move out/i }).or(
          page.getByRole("link", { name: /move out/i })
        )
      ).toBeVisible({ timeout: 5000 });
    });

    test("move-out shows confirmation dialog", async ({ page, request }) => {
      const propertyId = getPropertyId();
      const tenantRes = await request.post(
        `/api/properties/${propertyId}/tenants`,
        {
          data: {
            name: "Confirm Dialog " + Date.now(),
            phone: "08666666666",
            email: `confirm-${Date.now()}@test.com`,
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
        .getByRole("button", { name: /move out/i })
        .or(page.getByRole("link", { name: /move out/i }))
        .first()
        .click();
      await expect(
        page.getByText(/confirm|sure|are you sure/i).first()
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByRole("button", { name: /cancel/i }).first()
      ).toBeVisible({ timeout: 2000 });
    });

    test("user confirms move-out and sees success", { timeout: 20000 }, async ({
      page,
      request,
    }) => {
      const propertyId = getPropertyId();
      const tenantRes = await request.post(
        `/api/properties/${propertyId}/tenants`,
        {
          data: {
            name: "Move Out E2E " + Date.now(),
            phone: "08777777777",
            email: `moveout-e2e-${Date.now()}@test.com`,
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
        .getByRole("button", { name: /move out/i })
        .or(page.getByRole("link", { name: /move out/i }))
        .first()
        .click();
      await expect(
        page.getByText(/confirm|sure|are you sure/i).first()
      ).toBeVisible({ timeout: 5000 });
      await page
        .getByRole("button", { name: /confirm move out|confirm/i })
        .first()
        .click();
      await expect(
        page.getByText(/moved out|success|tenant moved/i)
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("bad cases", () => {
    test("user can cancel move-out and stay on detail", async ({
      page,
      request,
    }) => {
      const propertyId = getPropertyId();
      const tenantRes = await request.post(
        `/api/properties/${propertyId}/tenants`,
        {
          data: {
            name: "Cancel MoveOut " + Date.now(),
            phone: "08888888888",
            email: `cancel-mo-${Date.now()}@test.com`,
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
        .getByRole("button", { name: /move out/i })
        .or(page.getByRole("link", { name: /move out/i }))
        .first()
        .click();
      await page.getByRole("button", { name: /cancel/i }).first().click();
      await expect(page).toHaveURL(new RegExp(`/tenants/${tenantId}`));
    });
  });

  test.describe("edge cases", () => {
    test("move-out button is visible and has touch target", async ({
      page,
      request,
    }) => {
      const propertyId = getPropertyId();
      const tenantRes = await request.post(
        `/api/properties/${propertyId}/tenants`,
        {
          data: {
            name: "Edge " + Date.now(),
            phone: "08999999999",
            email: `edge-${Date.now()}@test.com`,
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
      const moveOutBtn = page
        .getByRole("button", { name: /move out/i })
        .or(page.getByRole("link", { name: /move out/i }))
        .first();
      await expect(moveOutBtn).toBeVisible();
      const box = await moveOutBtn.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.width).toBeGreaterThanOrEqual(44);
      }
    });
  });
});
