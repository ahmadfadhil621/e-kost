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
  await page.goto(`/properties/${propertyId}/tenants`, { waitUntil: "domcontentloaded" });
  await page.waitForURL(/\/properties\/[^/]+\/tenants$/, { timeout: 8000 }).catch(() => {});
  if (page.url().includes("/login")) {
    throw new Error(
      "goToTenantsList: redirected to login; check auth storage state (e2e/.auth/user-with-property.json)"
    );
  }
  await page
    .getByRole("link", { name: /add tenant/i })
    .or(page.getByText(/tenants|no tenants found/i))
    .first()
    .waitFor({ state: "visible", timeout: 15000 });
}

export async function goToNewTenantPage(page: Page) {
  const propertyId = getPropertyId();
  await page.goto(`/properties/${propertyId}/tenants/new`, { waitUntil: "domcontentloaded" });
  await page.waitForURL(/\/properties\/[^/]+\/tenants\/new/, { timeout: 8000 }).catch(() => {});
  if (page.url().includes("/login")) {
    throw new Error(
      "goToNewTenantPage: redirected to login; check auth storage state (e2e/.auth/user-with-property.json)"
    );
  }
  await page.locator("#tenant-name").waitFor({ state: "visible", timeout: 15000 });
}

export async function goToTenantDetail(
  page: Page,
  tenantId: string,
  propertyId?: string
) {
  const pid = propertyId ?? getPropertyId();
  await page.goto(`/properties/${pid}/tenants/${tenantId}`, { waitUntil: "domcontentloaded" });
  await page.waitForURL(/\/properties\/[^/]+\/tenants\/[^/]+$/, { timeout: 8000 }).catch(() => {});
  if (page.url().includes("/login")) {
    throw new Error(
      "goToTenantDetail: redirected to login; check auth storage state"
    );
  }
  // Active: Edit / Assign room / Move out or "Tenant details" heading.
  // Moved-out: "Tenant moved out successfully" text or heading.
  await page
    .getByRole("button", { name: /edit|assign room|move out/i })
    .or(page.getByText(/tenant details|detail penyewa|detail/i))
    .or(page.getByText(/tenant moved out successfully|moved out successfully|penyewa berhasil pindah keluar|pindah keluar/i))
    .first()
    .waitFor({ state: "visible", timeout: 30000 });
}

export async function goToEditTenantPage(page: Page, tenantId: string) {
  const propertyId = getPropertyId();
  await page.goto(`/properties/${propertyId}/tenants/${tenantId}/edit`);
  await page.waitForURL(/\/tenants\/[^/]+\/edit/, { timeout: 8000 }).catch(() => {});
  if (page.url().includes("/login")) {
    throw new Error(
      "goToEditTenantPage: redirected to login; check auth storage state (e2e/.auth/user-with-property.json)"
    );
  }
  await page
    .locator("#tenant-name")
    .waitFor({ state: "visible", timeout: 15000 });
}
