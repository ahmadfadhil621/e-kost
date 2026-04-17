// Traceability: billing-cycle-tracking (issue #112)
// REQ-3 -> test('tenant with 2 unpaid months shows unpaid breakdown')
// REQ-2 -> test('tenant with partial payment shows partial badge')
// REQ-3 -> test('fully-paid tenant shows all months paid')
// REQ-3 -> test('tenant with no room shows no room fallback in balance section')
// REQ-1 -> test('single cycle moved in this month shows one unpaid card')
// REQ-10 -> test('mobile viewport shows breakdown without horizontal scroll')

import { test, expect } from "@playwright/test";
import { getPropertyId } from "../helpers/payment-recording";
import { goToTenantDetail } from "../helpers/tenant-room-basics";

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
    data: { roomNumber: `BC-${opts.suffix}`, roomType: "single", monthlyRent },
  });
  if (!roomRes.ok()) { return null; }
  const { id: roomId } = await roomRes.json();

  const tenantRes = await page.request.post(`${base}/api/properties/${propertyId}/tenants`, {
    data: { name: `Cycle Tenant ${opts.suffix}`, phone: "081200000000", email: `cycle-${opts.suffix}@test.com` },
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

test.describe("billing cycle breakdown on tenant detail", () => {
  test.describe("good cases", () => {
    test("tenant with 2 unpaid months shows unpaid breakdown", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      // Move in last month → generates 2 cycles: last month + current month
      const seed = await seedTenantWithRoom(page, baseURL, propertyId, {
        moveDate: isoDate(monthStart(1)),
        suffix: `2unpaid-${Date.now()}`,
      });
      test.skip(!seed, "Room/tenant seed failed");

      await goToTenantDetail(page, seed!.tenantId);
      await expect(
        page.getByRole("heading", { name: /outstanding balance|saldo/i })
      ).toBeVisible({ timeout: 15000 });

      const unpaidBadges = page.getByRole("status").filter({ hasText: /unpaid|belum bayar/i });
      await expect(unpaidBadges.first()).toBeVisible({ timeout: 15000 });
      await expect(unpaidBadges).toHaveCount(2, { timeout: 10000 });
    });

    test("tenant with partial payment shows partial badge", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const lastMonth = monthStart(1);
      const seed = await seedTenantWithRoom(page, baseURL, propertyId, {
        moveDate: isoDate(lastMonth),
        monthlyRent: 1000000,
        suffix: `partial-${Date.now()}`,
      });
      test.skip(!seed, "Room/tenant seed failed");

      const paid = await seedPayment(page, baseURL, propertyId, seed!.tenantId, {
        amount: 500000,
        billingCycleYear: lastMonth.getFullYear(),
        billingCycleMonth: lastMonth.getMonth() + 1,
      });
      test.skip(!paid, "Payment seed failed");

      await goToTenantDetail(page, seed!.tenantId);
      await expect(
        page.getByRole("heading", { name: /outstanding balance|saldo/i })
      ).toBeVisible({ timeout: 15000 });

      await expect(
        page.getByRole("status").filter({ hasText: /partial|kurang bayar/i }).first()
      ).toBeVisible({ timeout: 15000 });
    });

    test("fully-paid tenant shows 'All months paid'", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const currentMonth = monthStart(0);
      const seed = await seedTenantWithRoom(page, baseURL, propertyId, {
        moveDate: isoDate(currentMonth),
        monthlyRent: 1000000,
        suffix: `fullypaid-${Date.now()}`,
      });
      test.skip(!seed, "Room/tenant seed failed");

      const paid = await seedPayment(page, baseURL, propertyId, seed!.tenantId, {
        amount: 1000000,
        billingCycleYear: currentMonth.getFullYear(),
        billingCycleMonth: currentMonth.getMonth() + 1,
      });
      test.skip(!paid, "Payment seed failed");

      await goToTenantDetail(page, seed!.tenantId);
      await expect(
        page.getByRole("heading", { name: /outstanding balance|saldo/i })
      ).toBeVisible({ timeout: 15000 });

      await expect(
        page.getByText(/all months paid|semua bulan sudah dibayar/i)
      ).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("bad cases", () => {
    test("tenant with no room shows 'no room' fallback in balance section", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const base = baseURL ?? "http://localhost:3000";
      const propertyId = getPropertyId();

      const ts = Date.now();
      const tenantRes = await page.request.post(
        `${base}/api/properties/${propertyId}/tenants`,
        { data: { name: `NoRoom Tenant ${ts}`, phone: "081299999999", email: `noroom-${ts}@test.com` } }
      );
      test.skip(!tenantRes.ok(), "Tenant seed failed");
      const { id: tenantId } = await tenantRes.json();

      await goToTenantDetail(page, tenantId);
      await expect(
        page.getByRole("heading", { name: /outstanding balance|saldo/i })
      ).toBeVisible({ timeout: 15000 });

      await expect(
        page.getByText(/no room assigned|belum ada kamar/i)
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("edge cases", () => {
    test("single cycle (moved in this month) shows one unpaid card", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const currentMonth = monthStart(0);
      const seed = await seedTenantWithRoom(page, baseURL, propertyId, {
        moveDate: isoDate(currentMonth),
        suffix: `single-${Date.now()}`,
      });
      test.skip(!seed, "Room/tenant seed failed");

      await goToTenantDetail(page, seed!.tenantId);
      await expect(
        page.getByRole("heading", { name: /outstanding balance|saldo/i })
      ).toBeVisible({ timeout: 15000 });

      const unpaidBadges = page.getByRole("status").filter({ hasText: /unpaid|belum bayar/i });
      await expect(unpaidBadges.first()).toBeVisible({ timeout: 15000 });
      await expect(unpaidBadges).toHaveCount(1, { timeout: 10000 });

      // Confirm the label matches current month
      await expect(
        page.getByText(cycleLabel(currentMonth))
      ).toBeVisible({ timeout: 5000 });
    });

    test("mobile viewport (375px) shows breakdown without horizontal scroll", async ({
      page,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      await page.setViewportSize({ width: 375, height: 667 });
      const propertyId = getPropertyId();
      const seed = await seedTenantWithRoom(page, baseURL, propertyId, {
        moveDate: isoDate(monthStart(1)),
        suffix: `mobile-${Date.now()}`,
      });
      test.skip(!seed, "Room/tenant seed failed");

      await goToTenantDetail(page, seed!.tenantId);
      await expect(
        page.getByRole("heading", { name: /outstanding balance|saldo/i })
      ).toBeVisible({ timeout: 15000 });
      await expect(
        page.getByRole("status").filter({ hasText: /unpaid|belum bayar/i }).first()
      ).toBeVisible({ timeout: 15000 });

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth, "Page must not scroll horizontally at 375px").toBeLessThanOrEqual(
        clientWidth + 2
      );
    });
  });
});
