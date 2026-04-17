// Traceability: billing-cycle-tracking (issue #112)
// REQ-4 -> test('billing period dropdown appears when tenant has unpaid cycles')
// REQ-4 -> test('oldest unpaid cycle is pre-selected by default FIFO')
// REQ-4 -> test('user can override billing period to a newer cycle')
// REQ-4 -> test('no billing period dropdown without tenantId in URL')
// REQ-4 -> test('FIFO: pre-selected cycle is the oldest when two months are unpaid')
// REQ-4 -> test('no billing period dropdown when tenant is fully paid')

import { test, expect } from "@playwright/test";
import { getPropertyId } from "../helpers/payment-recording";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

const MONTH_NAMES = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function monthStart(monthsBack: number): Date {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - monthsBack);
  return d;
}

function cycleLabel(d: Date): string {
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

async function seedTenantWithRoom(
  page: import("@playwright/test").Page,
  baseURL: string | undefined,
  propertyId: string,
  opts: { monthlyRent?: number; moveDate: string; suffix: string }
): Promise<{ tenantId: string; roomId: string; monthlyRent: number } | null> {
  const base = baseURL ?? "http://localhost:3000";
  const monthlyRent = opts.monthlyRent ?? 1000000;

  const roomRes = await page.request.post(`${base}/api/properties/${propertyId}/rooms`, {
    data: { roomNumber: `BP-${opts.suffix}`, roomType: "single", monthlyRent },
  });
  if (!roomRes.ok()) { return null; }
  const { id: roomId } = await roomRes.json();

  const tenantRes = await page.request.post(`${base}/api/properties/${propertyId}/tenants`, {
    data: { name: `BilPeriod Tenant ${opts.suffix}`, phone: "081211111111", email: `bilperiod-${opts.suffix}@test.com` },
  });
  if (!tenantRes.ok()) { return null; }
  const { id: tenantId } = await tenantRes.json();

  const moveRes = await page.request.post(
    `${base}/api/properties/${propertyId}/tenants/${tenantId}/move`,
    { data: { targetRoomId: roomId, moveDate: opts.moveDate } }
  );
  if (!moveRes.ok()) { return null; }

  return { tenantId, roomId, monthlyRent };
}

async function seedPayment(
  page: import("@playwright/test").Page,
  baseURL: string | undefined,
  propertyId: string,
  tenantId: string,
  opts: { amount: number; billingCycleYear: number; billingCycleMonth: number }
): Promise<boolean> {
  const base = baseURL ?? "http://localhost:3000";
  const res = await page.request.post(`${base}/api/properties/${propertyId}/payments`, {
    data: {
      tenantId,
      amount: opts.amount,
      paymentDate: isoDate(new Date()),
      billingCycleYear: opts.billingCycleYear,
      billingCycleMonth: opts.billingCycleMonth,
    },
  });
  return res.ok();
}

async function goToPaymentNew(
  page: import("@playwright/test").Page,
  propertyId: string,
  tenantId?: string
) {
  const url = tenantId
    ? `/properties/${propertyId}/payments/new?tenantId=${tenantId}`
    : `/properties/${propertyId}/payments/new`;
  await page.goto(url, { waitUntil: "load" });
  await page
    .getByRole("combobox", { name: /tenant|penyewa/i })
    .waitFor({ state: "visible", timeout: 20000 });
}

test.describe("billing period in payment form", () => {
  test.describe("good cases", () => {
    test("billing period dropdown appears when tenant has unpaid cycles", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      // 2 unpaid cycles: move in last month
      const seed = await seedTenantWithRoom(page, baseURL, propertyId, {
        moveDate: isoDate(monthStart(1)),
        suffix: `bp-show-${Date.now()}`,
      });
      test.skip(!seed, "Seed failed");

      await goToPaymentNew(page, propertyId, seed!.tenantId);

      await expect(
        page.getByRole("combobox", { name: /billing period/i })
      ).toBeVisible({ timeout: 20000 });
    });

    test("oldest unpaid cycle is pre-selected by default (FIFO)", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const lastMonth = monthStart(1);
      const seed = await seedTenantWithRoom(page, baseURL, propertyId, {
        moveDate: isoDate(lastMonth),
        suffix: `bp-fifo-${Date.now()}`,
      });
      test.skip(!seed, "Seed failed");

      await goToPaymentNew(page, propertyId, seed!.tenantId);

      const dropdown = page.getByRole("combobox", { name: /billing period/i });
      await expect(dropdown).toBeVisible({ timeout: 20000 });

      // The trigger should show the oldest cycle label (last month)
      await expect(dropdown).toContainText(cycleLabel(lastMonth), { timeout: 15000 });
    });

    test("user can override billing period to a newer cycle", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const lastMonth = monthStart(1);
      const currentMonth = monthStart(0);
      const seed = await seedTenantWithRoom(page, baseURL, propertyId, {
        moveDate: isoDate(lastMonth),
        suffix: `bp-override-${Date.now()}`,
      });
      test.skip(!seed, "Seed failed");

      await goToPaymentNew(page, propertyId, seed!.tenantId);

      const dropdown = page.getByRole("combobox", { name: /billing period/i });
      await expect(dropdown).toBeVisible({ timeout: 20000 });

      // Open the dropdown and pick the current month option
      await dropdown.click();
      await page
        .getByRole("option", { name: cycleLabel(currentMonth) })
        .click({ timeout: 10000 });

      // Trigger now shows the overridden month
      await expect(dropdown).toContainText(cycleLabel(currentMonth), { timeout: 10000 });
    });
  });

  test.describe("bad cases", () => {
    test("no billing period dropdown when navigating without tenantId", async ({
      page,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();

      await goToPaymentNew(page, propertyId);

      // Billing period Select must not appear — no tenant selected so no cycles fetched
      await expect(
        page.getByRole("combobox", { name: /billing period/i })
      ).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("edge cases", () => {
    test("FIFO: oldest cycle (month-1) is pre-selected when two months are unpaid", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const lastMonth = monthStart(1);
      const currentMonth = monthStart(0);
      const seed = await seedTenantWithRoom(page, baseURL, propertyId, {
        moveDate: isoDate(lastMonth),
        suffix: `bp-order-${Date.now()}`,
      });
      test.skip(!seed, "Seed failed");

      await goToPaymentNew(page, propertyId, seed!.tenantId);

      const dropdown = page.getByRole("combobox", { name: /billing period/i });
      await expect(dropdown).toBeVisible({ timeout: 20000 });

      // Pre-selected label must be last month (oldest unpaid), not current month
      await expect(dropdown).toContainText(cycleLabel(lastMonth), { timeout: 15000 });
      await expect(dropdown).not.toContainText(cycleLabel(currentMonth), { timeout: 5000 });
    });

    test("no billing period dropdown when tenant is fully paid", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const currentMonth = monthStart(0);
      const seed = await seedTenantWithRoom(page, baseURL, propertyId, {
        moveDate: isoDate(currentMonth),
        monthlyRent: 1000000,
        suffix: `bp-fullypaid-${Date.now()}`,
      });
      test.skip(!seed, "Seed failed");

      const paid = await seedPayment(page, baseURL, propertyId, seed!.tenantId, {
        amount: 1000000,
        billingCycleYear: currentMonth.getFullYear(),
        billingCycleMonth: currentMonth.getMonth() + 1,
      });
      test.skip(!paid, "Payment seed failed");

      await goToPaymentNew(page, propertyId, seed!.tenantId);

      // No unpaid cycles → dropdown must not appear
      await expect(
        page.getByRole("combobox", { name: /billing period/i })
      ).not.toBeVisible({ timeout: 10000 });
    });
  });
});
