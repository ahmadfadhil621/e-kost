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

export async function goToTenantDetail(
  page: Page,
  tenantId: string,
  propertyId?: string
) {
  const pid = propertyId ?? getPropertyId();
  await page.goto(`/properties/${pid}/tenants/${tenantId}`);
  // Active tenant: Edit / Assign room / Move out buttons or "Tenant details" heading.
  // Moved-out tenant: Back link + heading; no action buttons.
  // Not-found/error: Back is a button (not link). Match both so CI and slow envs don't timeout.
  // Use 70s in CI/slow envs so tenant fetch + render can complete under load.
  await page
    .getByRole("button", { name: /edit|assign room|move out/i })
    .or(page.getByText(/tenant details|detail penyewa|detail/i))
    .or(page.getByRole("link", { name: /^back$|kembali/i }))
    .or(page.getByRole("button", { name: /^back$|kembali/i }))
    .first()
    .waitFor({ state: "visible", timeout: 70000 });
}
