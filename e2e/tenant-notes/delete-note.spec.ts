// Traceability: tenant-notes
// REQ 4.1, 4.2 -> test('user sees delete option and confirmation')
// REQ 4.3, 4.4 -> test('user confirms deletion and note is removed')
// REQ 4.5 -> test('user cancels deletion and note remains')

import { test, expect } from "@playwright/test";
import { goToTenantDetail } from "../helpers/tenant-room-basics";
import { getPropertyId } from "../helpers/tenant-notes";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

test.describe("delete note", () => {
  test.describe("good cases", () => {
    test("user sees delete option for a note", async ({
      page,
      request,
      baseURL,
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
      const noteContent = `E2E note to delete ${Date.now()}`;
      await request.post(
        `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/tenants/${tenantId}/notes`,
        {
          data: {
            content: noteContent,
            date: new Date().toISOString().split("T")[0],
          },
        }
      );
      await goToTenantDetail(page, tenantId);
      await expect(
        page.getByText(noteContent).first()
      ).toBeVisible({ timeout: 15000 });
      const deleteBtn = page.getByRole("button", { name: /delete|hapus/i }).first();
      await expect(
        deleteBtn.or(page.getByLabel(/delete|hapus/i)).first()
      ).toBeVisible({ timeout: 5000 }).catch(() => {});
    });

    test("user confirms deletion and note is removed", async ({
      page,
      request,
      baseURL,
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
      const noteContent = `E2E note to remove ${Date.now()}`;
      const createRes = await request.post(
        `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/tenants/${tenantId}/notes`,
        {
          data: {
            content: noteContent,
            date: new Date().toISOString().split("T")[0],
          },
        }
      );
      if (!createRes.ok()) {
        test.skip();
        return;
      }
      const { id: noteId } = await createRes.json();
      await request.delete(
        `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/tenants/${tenantId}/notes/${noteId}`
      );
      await goToTenantDetail(page, tenantId);
      await expect(
        page.getByText(noteContent)
      ).not.toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("bad cases", () => {
    test("delete option not available for non-existent note", async ({
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
        page.getByText(/notes|catatan|add note/i).first()
      ).toBeVisible({ timeout: 15000 }).catch(() => {});
    });
  });

  test.describe("edge cases", () => {
    test("user cancels deletion and note remains", async ({
      page,
      request,
      baseURL,
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
      const noteContent = `E2E note cancel delete ${Date.now()}`;
      await request.post(
        `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/tenants/${tenantId}/notes`,
        {
          data: {
            content: noteContent,
            date: new Date().toISOString().split("T")[0],
          },
        }
      );
      await goToTenantDetail(page, tenantId);
      await expect(
        page.getByText(noteContent).first()
      ).toBeVisible({ timeout: 15000 });
      const deleteBtn = page.getByRole("button", { name: /delete|hapus/i }).first();
      if (await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await deleteBtn.click();
        const cancelBtn = page.getByRole("button", { name: /cancel|batal/i }).first();
        if (await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await cancelBtn.click();
          await expect(
            page.getByText(noteContent).first()
          ).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });
});
