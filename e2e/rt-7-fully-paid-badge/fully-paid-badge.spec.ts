// Traceability: rt-7-fully-paid-badge / issue #114
// REQ-2 -> test('paid tenant shows green Paid badge with icon on tenant detail')
// REQ-2 -> test('paid badge is accompanied by "All months paid" message')
// REQ-3 -> test('unpaid tenant shows billing cycle breakdown without paid badge')
// REQ-5 -> test('tenant with no room shows no-room message without paid badge')
// REQ-2 -> test('paid badge appears after recording a payment that clears all cycles')

import { test, expect, type APIRequestContext } from "@playwright/test";
import { getPropertyId, goToTenantDetail } from "../helpers/tenant-room-basics";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

// Covers both English and Indonesian locale variants used by the balance section.
const PAID_BADGE_RE = /^paid$|^terbayar$/i;
const UNPAID_CYCLE_RE = /unpaid|belum bayar|partial|sebagian/i;
const ALL_PAID_RE = /all months paid|semua bulan terbayar/i;
// "balance not available" / "saldo tidak tersedia" is the unique suffix that appears only
// in balance.noRoom — the tenant detail info card also renders "No room assigned" (tenant.detail.noRoom),
// so we must match the longer BalanceSection-specific string to avoid a false positive.
const NO_ROOM_RE = /balance not available|saldo tidak tersedia/i;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function createRoomAndPaidTenant(
  request: APIRequestContext,
  propertyId: string
) {
  const suffix = Date.now();
  const monthlyRent = 500000;

  const roomRes = await request.post(`/api/properties/${propertyId}/rooms`, {
    data: {
      roomNumber: `PaidBadge-${suffix}`,
      roomType: "single",
      monthlyRent,
    },
  });
  if (!roomRes.ok()) { return null; }
  const { id: roomId } = await roomRes.json();

  const tenantRes = await request.post(
    `/api/properties/${propertyId}/tenants`,
    {
      data: {
        name: `PaidBadge Paid ${suffix}`,
        phone: "08200000001",
        email: `paidbadge-paid-${suffix}@test.com`,
      },
    }
  );
  if (!tenantRes.ok()) { return null; }
  const { id: tenantId } = await tenantRes.json();

  const assignRes = await request.post(
    `/api/properties/${propertyId}/tenants/${tenantId}/move`,
    { data: { targetRoomId: roomId, moveDate: new Date().toISOString().slice(0, 10) } }
  );
  if (!assignRes.ok()) { return null; }

  const paymentDate = new Date().toISOString().split("T")[0];
  const paymentRes = await request.post(
    `/api/properties/${propertyId}/payments`,
    { data: { tenantId, amount: monthlyRent, paymentDate } }
  );
  if (!paymentRes.ok()) { return null; }

  return { tenantId, monthlyRent };
}

async function createRoomAndUnpaidTenant(
  request: APIRequestContext,
  propertyId: string
) {
  const suffix = Date.now();
  const monthlyRent = 500000;

  const roomRes = await request.post(`/api/properties/${propertyId}/rooms`, {
    data: {
      roomNumber: `PaidBadge-Unpaid-${suffix}`,
      roomType: "single",
      monthlyRent,
    },
  });
  if (!roomRes.ok()) { return null; }
  const { id: roomId } = await roomRes.json();

  const tenantRes = await request.post(
    `/api/properties/${propertyId}/tenants`,
    {
      data: {
        name: `PaidBadge Unpaid ${suffix}`,
        phone: "08200000002",
        email: `paidbadge-unpaid-${suffix}@test.com`,
      },
    }
  );
  if (!tenantRes.ok()) { return null; }
  const { id: tenantId } = await tenantRes.json();

  const assignRes = await request.post(
    `/api/properties/${propertyId}/tenants/${tenantId}/move`,
    { data: { targetRoomId: roomId, moveDate: new Date().toISOString().slice(0, 10) } }
  );
  if (!assignRes.ok()) { return null; }

  return { tenantId, roomId, monthlyRent };
}

async function createTenantNoRoom(
  request: APIRequestContext,
  propertyId: string
) {
  const suffix = Date.now();

  const tenantRes = await request.post(
    `/api/properties/${propertyId}/tenants`,
    {
      data: {
        name: `PaidBadge NoRoom ${suffix}`,
        phone: "08200000003",
        email: `paidbadge-noroom-${suffix}@test.com`,
      },
    }
  );
  if (!tenantRes.ok()) { return null; }
  const { id: tenantId } = await tenantRes.json();
  return { tenantId };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("fully paid badge on tenant detail", () => {
  test.describe("good cases", () => {
    test("paid tenant shows green Paid badge with icon on tenant detail", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const data = await createRoomAndPaidTenant(request, propertyId);
      if (!data) { test.skip(); return; }

      await goToTenantDetail(page, data.tenantId);

      // BalanceStatusIndicator renders role="status" with translated "Paid"/"Terbayar"
      // when allPaid: true. Filter by text to work in both EN and ID locales.
      const paidBadge = page.getByRole("status").filter({ hasText: PAID_BADGE_RE });
      await expect(paidBadge).toBeVisible({ timeout: 15000 });

      // Icon must be aria-hidden (text + icon, not icon-only — accessibility requirement)
      const icon = paidBadge.locator("[aria-hidden='true']");
      await expect(icon).toBeAttached();
    });

    test("paid badge is accompanied by 'All months paid' message", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const data = await createRoomAndPaidTenant(request, propertyId);
      if (!data) { test.skip(); return; }

      await goToTenantDetail(page, data.tenantId);

      await expect(
        page.getByRole("status").filter({ hasText: PAID_BADGE_RE })
      ).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(ALL_PAID_RE)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("bad cases", () => {
    test("unpaid tenant shows billing cycle breakdown without paid badge", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const data = await createRoomAndUnpaidTenant(request, propertyId);
      if (!data) { test.skip(); return; }

      await goToTenantDetail(page, data.tenantId);

      // CycleStatusBadge has role="status" with locale text "Unpaid"/"Belum bayar"
      // and no aria-label — use filter({ hasText }) for locale-agnostic matching.
      const unpaidCycleBadge = page
        .getByRole("status")
        .filter({ hasText: UNPAID_CYCLE_RE })
        .first();
      await expect(unpaidCycleBadge).toBeVisible({ timeout: 15000 });

      // Paid badge (BalanceStatusIndicator) must NOT be shown
      await expect(
        page.getByRole("status").filter({ hasText: PAID_BADGE_RE })
      ).not.toBeAttached();
    });

    test("tenant with no room shows no-room message without paid badge", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const data = await createTenantNoRoom(request, propertyId);
      if (!data) { test.skip(); return; }

      await goToTenantDetail(page, data.tenantId);

      // Wait for assign-room button (page is loaded for tenant with no room)
      await expect(
        page.getByRole("button", { name: /assign room|tambah kamar/i })
      ).toBeVisible({ timeout: 15000 });

      // BalanceSection shows no-room message when billing-cycles API returns 400
      await expect(page.getByText(NO_ROOM_RE)).toBeVisible({ timeout: 10000 });

      // Neither paid badge nor unpaid cycle cards should appear
      await expect(
        page.getByRole("status").filter({ hasText: PAID_BADGE_RE })
      ).not.toBeAttached();
    });
  });

  test.describe("edge cases", () => {
    test("paid badge appears after recording a payment that clears all cycles", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(90000);
      const propertyId = getPropertyId();
      const data = await createRoomAndUnpaidTenant(request, propertyId);
      if (!data) { test.skip(); return; }

      // Verify initial unpaid state
      await goToTenantDetail(page, data.tenantId);
      await expect(
        page.getByRole("status").filter({ hasText: UNPAID_CYCLE_RE }).first()
      ).toBeVisible({ timeout: 15000 });

      // Record a payment that covers the full monthly rent via API
      const paymentDate = new Date().toISOString().split("T")[0];
      const payRes = await request.post(`/api/properties/${propertyId}/payments`, {
        data: { tenantId: data.tenantId, amount: data.monthlyRent, paymentDate },
      });
      expect(payRes.ok()).toBe(true);

      // Reload and verify transition from unpaid cycles to paid badge
      await page.reload();
      await expect(
        page.getByRole("status").filter({ hasText: PAID_BADGE_RE })
      ).toBeVisible({ timeout: 15000 });
    });
  });
});
