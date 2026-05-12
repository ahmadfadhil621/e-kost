// Traceability: outstanding-balance-export (issue #123)
// REQ-1.1 -> test('export button is visible in toolbar when tenants exist')
// REQ-1.2 -> test('export button is disabled when filtered view is empty')
// REQ-2.1 -> test('download triggers with outstanding-balances filename on All filter')
// REQ-2.2 -> test('download request includes status=unpaid when Missing rent filter is active')
// REQ-3.1 -> test('downloaded filename matches outstanding-balances-YYYY-MM-DD.xlsx pattern')

import { test, expect, type APIRequestContext } from "@playwright/test";
import { getPropertyId, goToTenantsList } from "../helpers/tenant-room-basics";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

// ── helpers ──────────────────────────────────────────────────────────────────

async function createRoomAndTenant(
  request: APIRequestContext,
  propertyId: string,
  suffix: number
): Promise<{ tenantId: string; name: string } | null> {
  const roomRes = await request.post(`/api/properties/${propertyId}/rooms`, {
    data: {
      roomNumber: `ExportOB-${suffix}`,
      roomType: "single",
      monthlyRent: 750_000,
    },
  });
  if (!roomRes.ok()) { return null; }
  const { id: roomId } = await roomRes.json() as { id: string };

  const tenantRes = await request.post(`/api/properties/${propertyId}/tenants`, {
    data: {
      name: `ExportOB Tenant ${suffix}`,
      phone: `0812${String(suffix).slice(-7).padStart(7, "0")}`,
      email: `export-ob-${suffix}@test.com`,
    },
  });
  if (!tenantRes.ok()) { return null; }
  const { id: tenantId } = await tenantRes.json() as { id: string };

  const moveRes = await request.post(
    `/api/properties/${propertyId}/tenants/${tenantId}/move`,
    { data: { targetRoomId: roomId, moveDate: new Date().toISOString().slice(0, 10) } }
  );
  if (!moveRes.ok()) { return null; }

  return { tenantId, name: `ExportOB Tenant ${suffix}` };
}

const exportBtn = (page: Parameters<typeof test>[1] extends { page: infer P } ? P : never) =>
  page
    .getByRole("button", { name: /export|ekspor/i })
    .or(page.getByLabel(/export|ekspor/i))
    .first();

// ── tests ─────────────────────────────────────────────────────────────────────

test.describe("export outstanding balances", () => {
  test.describe("good cases", () => {
    test("export button is visible in toolbar when tenants exist", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const suffix = Date.now();

      const seeded = await createRoomAndTenant(request, propertyId, suffix);
      if (!seeded) { test.skip(); return; }

      await goToTenantsList(page);
      await expect(page.getByText(seeded.name)).toBeVisible({ timeout: 15000 });

      await expect(exportBtn(page)).toBeVisible({ timeout: 10000 });
    });

    test("download triggers with outstanding-balances filename on All filter", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const suffix = Date.now() + 1;

      const seeded = await createRoomAndTenant(request, propertyId, suffix);
      if (!seeded) { test.skip(); return; }

      await goToTenantsList(page);
      await expect(page.getByText(seeded.name)).toBeVisible({ timeout: 15000 });

      const btn = exportBtn(page);
      await expect(btn).toBeEnabled({ timeout: 10000 });

      const [download] = await Promise.all([
        page.waitForEvent("download"),
        btn.click(),
      ]);

      expect(download.suggestedFilename()).toMatch(
        /^outstanding-balances-\d{4}-\d{2}-\d{2}\.xlsx$/
      );
    });

    test("download request includes status=unpaid when Missing rent filter is active", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const suffix = Date.now() + 2;

      // Seed unpaid tenant (room assigned, no payment = outstanding balance)
      const seeded = await createRoomAndTenant(request, propertyId, suffix);
      if (!seeded) { test.skip(); return; }

      await goToTenantsList(page);
      await expect(page.getByText(seeded.name)).toBeVisible({ timeout: 15000 });

      // Activate Missing rent filter — tenant has no payment so should appear
      await page.getByRole("button", { name: /missing rent|sewa kurang/i }).click();
      await expect(page.getByText(seeded.name)).toBeVisible({ timeout: 10000 });

      const btn = exportBtn(page);
      await expect(btn).toBeEnabled({ timeout: 5000 });

      // Capture the request URL to verify ?status=unpaid is present
      const [exportRequest] = await Promise.all([
        page.waitForRequest(/\/tenants\/export/),
        btn.click(),
      ]);

      expect(exportRequest.url()).toContain("status=unpaid");
    });
  });

  test.describe("bad cases", () => {
    test("export button is disabled when filtered view is empty", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const suffix = Date.now() + 10;

      // Seed a tenant so the search input is visible
      const seeded = await createRoomAndTenant(request, propertyId, suffix);
      if (!seeded) { test.skip(); return; }

      await goToTenantsList(page);
      // Wait for the seeded tenant to confirm the list has loaded
      await expect(page.getByText(seeded.name)).toBeVisible({ timeout: 15000 });

      // Search for something that matches nothing → filteredTenants = 0
      await page.getByRole("textbox").fill("zzz_no_export_match_xyz_999");
      // Wait for the empty-filter state to render
      await expect(
        page.getByText(/no results|tidak ada hasil/i)
      ).toBeVisible({ timeout: 10000 });

      await expect(exportBtn(page)).toBeDisabled({ timeout: 5000 });
    });
  });

  test.describe("edge cases", () => {
    test("downloaded filename matches outstanding-balances-YYYY-MM-DD.xlsx pattern", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const suffix = Date.now() + 3;

      const seeded = await createRoomAndTenant(request, propertyId, suffix);
      if (!seeded) { test.skip(); return; }

      await goToTenantsList(page);
      await expect(page.getByText(seeded.name)).toBeVisible({ timeout: 15000 });

      const btn = exportBtn(page);
      await expect(btn).toBeEnabled({ timeout: 10000 });

      const [download] = await Promise.all([
        page.waitForEvent("download"),
        btn.click(),
      ]);

      const filename = download.suggestedFilename();
      // Must be outstanding-balances-YYYY-MM-DD.xlsx, no _to_ range
      expect(filename).toMatch(/^outstanding-balances-\d{4}-\d{2}-\d{2}\.xlsx$/);
      expect(filename).not.toContain("_to_");
    });
  });
});
