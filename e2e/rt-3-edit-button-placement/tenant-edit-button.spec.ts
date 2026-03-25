// Traceability: rt-3-edit-button-placement (tenant detail) — issue #14
// REQ RT-3.2 -> test('edit button is visible inline with the page heading')
// REQ RT-3.3 -> test('edit button meets 44x44px minimum touch target')
// REQ RT-3.6 -> test('clicking edit button navigates to edit tenant page')
// REQ RT-3.2 -> test('moved-out tenant has no edit button')
// REQ RT-3.4 -> test('tenant detail has no horizontal scroll at 375px viewport')

import * as fs from "fs";
import * as path from "path";
import { test, expect } from "@playwright/test";
import { goToTenantDetail } from "../helpers/tenant-room-basics";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

function getPropertyId(): string {
  const filePath = path.join(process.cwd(), "e2e/.auth/property-id.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return data.propertyId;
}

async function createTenant(
  request: Parameters<Parameters<typeof test>[1]>[0]["request"],
  baseURL: string | undefined
): Promise<{ tenantId: string }> {
  const propertyId = getPropertyId();
  const res = await request.post(
    `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/tenants`,
    {
      data: {
        name: "RT3-T-" + Date.now(),
        phone: "08123456789",
        email: `rt3-t-${Date.now()}@test.com`,
      },
    }
  );
  if (!res.ok()) {
    throw new Error(`Create tenant failed: ${res.status()} ${await res.text()}`);
  }
  const tenant = await res.json();
  return { tenantId: tenant.id };
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

test.describe("tenant edit button placement", () => {
  test.describe("good cases", () => {
    test("edit button is visible inline with the page heading", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const { tenantId } = await createTenant(request, baseURL);

      try {
        await goToTenantDetail(page, tenantId);

        const heading = page.getByRole("heading", { name: /tenant details/i });
        const editBtn = page.getByRole("link", { name: /^edit$/i });

        await expect(heading).toBeVisible({ timeout: 5000 });
        await expect(editBtn).toBeVisible({ timeout: 5000 });

        // Both must be in the same row: vertical midpoints within 8px
        const headingBox = await heading.boundingBox();
        const editBox = await editBtn.boundingBox();
        const headingMidY = headingBox!.y + headingBox!.height / 2;
        const editMidY = editBox!.y + editBox!.height / 2;
        expect(Math.abs(editMidY - headingMidY)).toBeLessThanOrEqual(8);
      } finally {
        await moveOutTenant(request, baseURL, tenantId);
      }
    });

    test("edit button meets 44×44px minimum touch target", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const { tenantId } = await createTenant(request, baseURL);

      try {
        await goToTenantDetail(page, tenantId);

        const editBtn = page.getByRole("link", { name: /^edit$/i });
        await expect(editBtn).toBeVisible({ timeout: 5000 });

        const box = await editBtn.boundingBox();
        expect(box!.width).toBeGreaterThanOrEqual(44);
        expect(box!.height).toBeGreaterThanOrEqual(44);
      } finally {
        await moveOutTenant(request, baseURL, tenantId);
      }
    });

    test("clicking edit button navigates to edit tenant page", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const { tenantId } = await createTenant(request, baseURL);

      try {
        await goToTenantDetail(page, tenantId);
        await page.getByRole("link", { name: /^edit$/i }).click();

        await page.waitForURL(/\/tenants\/[^/]+\/edit/, { timeout: 15000 });
        await expect(page.locator("#tenant-name")).toBeVisible({ timeout: 10000 });
      } finally {
        await moveOutTenant(request, baseURL, tenantId);
      }
    });
  });

  test.describe("bad cases", () => {
    test("moved-out tenant has no edit button", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const { tenantId } = await createTenant(request, baseURL);
      await moveOutTenant(request, baseURL, tenantId);

      await goToTenantDetail(page, tenantId);

      await expect(
        page.getByRole("link", { name: /^edit$/i })
      ).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("edge cases", () => {
    test("tenant detail has no horizontal scroll at 375px viewport", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const { tenantId } = await createTenant(request, baseURL);

      try {
        await goToTenantDetail(page, tenantId);

        const hasHorizontalScroll = await page.evaluate(
          () => document.body.scrollWidth > document.body.clientWidth
        );
        expect(hasHorizontalScroll).toBe(false);
      } finally {
        await moveOutTenant(request, baseURL, tenantId);
      }
    });
  });
});
