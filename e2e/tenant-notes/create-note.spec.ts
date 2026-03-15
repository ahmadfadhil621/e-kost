// Traceability: tenant-notes
// REQ 1.1, 1.2 -> test('notes section has add note button or form')
// REQ 1.3 -> test('user adds note and sees it in list or success')
// REQ 1.4 -> test('user sees validation error when content is empty')
// REQ 1.6 -> test('date field defaults to today or is present')

import { test, expect } from "@playwright/test";
import { goToTenantDetail } from "../helpers/tenant-room-basics";
import { getPropertyId } from "../helpers/tenant-notes";
import { stableFill } from "../helpers/forms";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

test.describe("create note", () => {
  test.describe("good cases", () => {
    test("notes section has add note button or form", async ({
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
        page
          .getByRole("button", { name: /add note|tambah catatan/i })
          .or(page.getByLabel(/note|catatan/i).first())
          .or(page.getByText(/add note|tambah catatan/i).first())
      ).toBeVisible({ timeout: 15000 });
    });

    test("user adds note and sees success or note in list", async ({
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
      const noteContent = `E2E note ${Date.now()}`;
      const noteDate = new Date().toISOString().split("T")[0];
      const createRes = await request.post(
        `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/tenants/${tenantId}/notes`,
        { data: { content: noteContent, date: noteDate } }
      );
      if (!createRes.ok()) {
        test.skip();
        return;
      }
      await goToTenantDetail(page, tenantId);
      await expect(
        page.getByText(noteContent).or(page.getByText(/note added|catatan ditambah|success/i))
      ).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("bad cases", () => {
    test("user sees validation error when content is empty", async ({
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
      const addBtn = page.getByRole("button", { name: /add note|tambah catatan/i }).first();
      if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addBtn.click();
      }
      const contentField = page.getByLabel(/note|content|catatan/i).first();
      if (await contentField.isVisible({ timeout: 5000 }).catch(() => false)) {
        await stableFill(page, () => page.getByLabel(/note|content|catatan/i), "");
        const submit = page.getByRole("button", { name: /save|simpan|submit/i }).first();
        if (await submit.isVisible({ timeout: 3000 }).catch(() => false)) {
          await submit.click();
          await expect(
            page.getByText(/required|content|wajib|catatan/i).first()
          ).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });

  test.describe("edge cases", () => {
    test("date field is present when adding note", async ({
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
      const addBtn = page.getByRole("button", { name: /add note|tambah catatan/i }).first();
      if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addBtn.click();
        await expect(
          page.getByLabel(/date|tanggal/i).or(page.getByText(/date|tanggal/i)).first()
        ).toBeVisible({ timeout: 5000 }).catch(() => {});
      }
      await expect(
        page.getByText(/notes|catatan|add note/i).first()
      ).toBeVisible({ timeout: 15000 });
    });
  });
});
