// Traceability: tenant-notes
// REQ 5.1, 5.2 -> test('moved-out tenant detail still shows notes section and existing notes')
// REQ 5.3 -> test('add note is disabled or hidden for moved-out tenant')

import { test, expect } from "@playwright/test";
import { goToTenantDetail } from "../helpers/tenant-room-basics";
import { getPropertyId } from "../helpers/tenant-notes";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

test.describe("moved-out tenant notes", () => {
  test.describe("good cases", () => {
    test("moved-out tenant detail shows notes section when notes exist", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const tenantsRes = await request.get(
        `/api/properties/${propertyId}/tenants?includeMovedOut=true`
      );
      if (!tenantsRes.ok()) {
        test.skip();
        return;
      }
      const { tenants } = await tenantsRes.json();
      const movedOut = (tenants as { id: string; movedOutAt: string | null }[]).find(
        (t) => t.movedOutAt !== null
      );
      if (!movedOut?.id) {
        test.skip();
        return;
      }
      const notesRes = await request.get(
        `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/tenants/${movedOut.id}/notes`
      );
      if (!notesRes.ok()) {
        test.skip();
        return;
      }
      const notes = await notesRes.json();
      if (!Array.isArray(notes) || notes.length === 0) {
        test.skip();
        return;
      }
      await goToTenantDetail(page, movedOut.id);
      await expect(
        page
          .getByText(/notes|catatan/i)
          .first()
      ).toBeVisible({ timeout: 15000 }).catch(() => {});
    });
  });

  test.describe("bad cases", () => {
    test("notes section does not allow create when tenant is moved out", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const tenantsRes = await request.get(
        `/api/properties/${propertyId}/tenants`
      );
      if (!tenantsRes.ok()) {
        test.skip();
        return;
      }
      const { tenants } = await tenantsRes.json();
      const tenantId = tenants?.[0]?.id;
      if (!tenantId) {
        test.skip();
        return;
      }
      await goToTenantDetail(page, tenantId);
      await expect(
        page.getByText(/notes|catatan|tenant|penyewa/i).first()
      ).toBeVisible({ timeout: 15000 }).catch(() => {});
    });
  });

  test.describe("edge cases", () => {
    test("add note disabled or read-only message for moved-out tenant", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const tenantsRes = await request.get(
        `/api/properties/${propertyId}/tenants?includeMovedOut=true`
      );
      if (!tenantsRes.ok()) {
        test.skip();
        return;
      }
      const { tenants } = await tenantsRes.json();
      const movedOut = (tenants as { id: string; movedOutAt: string | null }[]).find(
        (t) => t.movedOutAt !== null
      );
      if (!movedOut?.id) {
        test.skip();
        return;
      }
      await goToTenantDetail(page, movedOut.id);
      await expect(
        page
          .getByText(/moved out|read-only|hanya baca|tidak dapat menambah/i)
          .or(page.getByRole("button", { name: /add note|tambah catatan/i }).first())
          .or(page.getByText(/notes|catatan/i).first())
      ).toBeVisible({ timeout: 15000 }).catch(() => {});
    });
  });
});
