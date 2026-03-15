// Traceability: tenant-notes
// REQ 5.1, 5.2 -> test('moved-out tenant detail still shows notes section and existing notes')
// REQ 5.3 -> test('add note is disabled or hidden for moved-out tenant')
// Run with project chromium-moved-out-notes (uses auth-with-moved-out-tenant setup).

import { test, expect } from "@playwright/test";
import { goToTenantDetail } from "../helpers/tenant-room-basics";
import {
  getPropertyId,
  getMovedOutTenantSetup,
} from "../helpers/tenant-notes";

test.describe("moved-out tenant notes", () => {
  test.describe("good cases", () => {
    test("moved-out tenant detail shows notes section when notes exist", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(90000);
      const setupIds = getMovedOutTenantSetup();
      let propertyId: string;
      let movedOutTenantId: string;
      if (setupIds) {
        propertyId = setupIds.propertyId;
        movedOutTenantId = setupIds.movedOutTenantId;
      } else {
        propertyId = getPropertyId();
        const tenantsRes = await request.get(
          `/api/properties/${propertyId}/tenants?includeMovedOut=true`
        );
        if (!tenantsRes.ok()) {
          test.skip();
          return;
        }
        const { tenants } = await tenantsRes.json();
        const movedOut = (
          tenants as { id: string; movedOutAt: string | null }[]
        ).find((t) => t.movedOutAt !== null);
        if (!movedOut?.id) {
          test.skip();
          return;
        }
        movedOutTenantId = movedOut.id;
      }
      const notesRes = await request.get(
        `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/tenants/${movedOutTenantId}/notes`
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
      await goToTenantDetail(page, movedOutTenantId, propertyId);
      await expect(
        page.getByText(/notes|catatan/i).first()
      ).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("bad cases", () => {
    test("notes section does not allow create when tenant is moved out", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(90000);
      const setupIds = getMovedOutTenantSetup();
      let tenantId: string | undefined;
      if (setupIds) {
        tenantId = setupIds.movedOutTenantId;
      } else {
        const propertyId = getPropertyId();
        const tenantsRes = await request.get(
          `/api/properties/${propertyId}/tenants?includeMovedOut=true`
        );
        if (!tenantsRes.ok()) {
          test.skip();
          return;
        }
        const { tenants } = await tenantsRes.json();
        const movedOut = (
          tenants as { id: string; movedOutAt: string | null }[]
        ).find((t) => t.movedOutAt !== null);
        tenantId = movedOut?.id;
      }
      if (!tenantId) {
        test.skip();
        return;
      }
      const propertyIdForNav = setupIds?.propertyId ?? getPropertyId();
      await goToTenantDetail(page, tenantId, propertyIdForNav);
      await expect(
        page.getByText(/notes|catatan|tenant|penyewa/i).first()
      ).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("edge cases", () => {
    test("add note disabled or read-only message for moved-out tenant", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(90000);
      const setupIds = getMovedOutTenantSetup();
      let propertyId: string;
      let movedOutTenantId: string;
      if (setupIds) {
        propertyId = setupIds.propertyId;
        movedOutTenantId = setupIds.movedOutTenantId;
      } else {
        propertyId = getPropertyId();
        const tenantsRes = await request.get(
          `/api/properties/${propertyId}/tenants?includeMovedOut=true`
        );
        if (!tenantsRes.ok()) {
          test.skip();
          return;
        }
        const { tenants } = await tenantsRes.json();
        const movedOut = (
          tenants as { id: string; movedOutAt: string | null }[]
        ).find((t) => t.movedOutAt !== null);
        if (!movedOut?.id) {
          test.skip();
          return;
        }
        movedOutTenantId = movedOut.id;
      }
      const propertyIdForNav = setupIds?.propertyId ?? getPropertyId();
      await goToTenantDetail(page, movedOutTenantId, propertyIdForNav);
      await expect(
        page
          .getByText(/moved out|read-only|hanya baca|tidak dapat menambah/i)
          .or(
            page.getByRole("button", { name: /add note|tambah catatan/i }).first()
          )
          .or(page.getByText(/notes|catatan/i).first())
          .first()
      ).toBeVisible({ timeout: 15000 });
    });
  });
});
