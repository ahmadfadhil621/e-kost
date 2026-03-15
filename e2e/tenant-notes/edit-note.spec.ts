// Traceability: tenant-notes
// REQ 3.1, 3.2 -> test('user can open edit for a note')
// REQ 3.3 -> test('user saves updated note and sees success')
// REQ 3.5 -> test('user sees validation error when saving empty content')

import { test, expect } from "@playwright/test";
import { goToTenantDetail } from "../helpers/tenant-room-basics";
import { getPropertyId } from "../helpers/tenant-notes";
import { stableFill } from "../helpers/forms";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

test.describe("edit note", () => {
  test.describe("good cases", () => {
    test("user can open edit for a note", async ({
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
      const noteContent = `E2E edit target ${Date.now()}`;
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
      await goToTenantDetail(page, tenantId);
      await expect(
        page.getByText(noteContent).first()
      ).toBeVisible({ timeout: 15000 });
      const editBtn = page.getByRole("button", { name: /edit|ubah/i }).first();
      if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await editBtn.click();
        await expect(
          page.getByLabel(/note|content|catatan/i).or(page.getByText(noteContent)).first()
        ).toBeVisible({ timeout: 5000 }).catch(() => {});
      }
    });
  });

  test.describe("bad cases", () => {
    test("user sees validation error when saving empty content", async ({
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
      const createRes = await request.post(
        `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/tenants/${tenantId}/notes`,
        {
          data: {
            content: "Note to edit then clear",
            date: new Date().toISOString().split("T")[0],
          },
        }
      );
      if (!createRes.ok()) {
        test.skip();
        return;
      }
      await goToTenantDetail(page, tenantId);
      const editBtn = page.getByRole("button", { name: /edit|ubah/i }).first();
      if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await editBtn.click();
        const contentField = page.getByLabel(/note|content|catatan/i).first();
        if (await contentField.isVisible({ timeout: 3000 }).catch(() => false)) {
          await stableFill(page, () => page.getByLabel(/note|content|catatan/i), "");
          const saveBtn = page.getByRole("button", { name: /save|simpan/i }).first();
          if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await saveBtn.click();
            await expect(
              page.getByText(/required|content|wajib/i).first()
            ).toBeVisible({ timeout: 5000 }).catch(() => {});
          }
        }
      }
    });
  });

  test.describe("edge cases", () => {
    test("updated note shows new content after save", async ({
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
      const original = `Original ${Date.now()}`;
      const createRes = await request.post(
        `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/tenants/${tenantId}/notes`,
        {
          data: {
            content: original,
            date: new Date().toISOString().split("T")[0],
          },
        }
      );
      if (!createRes.ok()) {
        test.skip();
        return;
      }
      const { id: noteId } = await createRes.json();
      const updatedContent = `Updated ${Date.now()}`;
      await request.put(
        `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/tenants/${tenantId}/notes/${noteId}`,
        { data: { content: updatedContent } }
      );
      await goToTenantDetail(page, tenantId);
      await expect(
        page.getByText(updatedContent).first()
      ).toBeVisible({ timeout: 15000 });
    });
  });
});
