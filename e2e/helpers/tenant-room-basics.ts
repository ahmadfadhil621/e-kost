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
  // CI/slow envs: allow more time for form to render
  await page
    .getByLabel(/name|full name/i)
    .first()
    .waitFor({ state: "visible", timeout: 40000 });
}

export async function goToTenantDetail(
  page: Page,
  tenantId: string,
  propertyId?: string
) {
  const pid = propertyId ?? getPropertyId();
  await page.goto(`/properties/${pid}/tenants/${tenantId}`);
  await page.waitForLoadState("domcontentloaded");
  // Active: Edit / Assign room / Move out or "Tenant details" heading.
  // Moved-out: "Tenant moved out successfully" text, Back link, or heading.
  // Not-found/error: Back button. Use 90s in CI so tenant fetch + render can complete.
  await page
    .getByRole("button", { name: /edit|assign room|move out/i })
    .or(page.getByText(/tenant details|detail penyewa|detail/i))
    .or(
    page.getByText(
      /tenant moved out successfully|moved out successfully|penyewa berhasil pindah keluar|pindah keluar/i
    )
  )
    .or(page.getByRole("link", { name: /^back$|kembali/i }))
    .or(page.getByRole("button", { name: /^back$|kembali/i }))
    .first()
    .waitFor({ state: "visible", timeout: 90000 });
}
