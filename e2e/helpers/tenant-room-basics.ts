import * as fs from "fs";
import * as path from "path";
import type { Page } from "@playwright/test";

export function getPropertyId(): string {
  const filePath = path.join(process.cwd(), "e2e/.auth/property-id.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return data.propertyId;
}

export async function goToTenantsList(page: Page) {
  const propertyId = getPropertyId();
  await page.goto(`/properties/${propertyId}/tenants`);
  await page
    .getByRole("link", { name: /add tenant/i })
    .or(page.getByText(/tenants|no tenants found/i))
    .first()
    .waitFor({ state: "visible", timeout: 15000 });
}

export async function goToNewTenantPage(page: Page) {
  const propertyId = getPropertyId();
  await page.goto(`/properties/${propertyId}/tenants/new`);
  await page
    .getByLabel(/name|full name/i)
    .first()
    .waitFor({ state: "visible", timeout: 20000 });
}

export async function goToTenantDetail(page: Page, tenantId: string) {
  const propertyId = getPropertyId();
  await page.goto(`/properties/${propertyId}/tenants/${tenantId}`);
  // Active tenant: Edit / Assign room / Move out buttons or "Tenant details" heading.
  // Moved-out tenant: only Back link and notes; no action buttons — match Back or heading.
  await page
    .getByRole("button", { name: /edit|assign room|move out/i })
    .or(page.getByText(/tenant details|detail penyewa|detail/i))
    .or(page.getByRole("link", { name: /^back$|kembali/i }))
    .first()
    .waitFor({ state: "visible", timeout: 45000 });
}
