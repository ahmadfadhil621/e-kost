// Traceability: room-status-edit / issue #115
// REQ-4 -> test('room detail shows status as read-only badge')
// REQ-4 -> test('room detail page has no status select or dropdown')
// REQ-4 -> test('status badge text is visible on room detail page')

import { test, expect, type APIRequestContext } from "@playwright/test";
import {
  getPropertyId,
  goToRoomDetail,
} from "../helpers/room-inventory";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

async function createEmptyRoom(request: APIRequestContext, propertyId: string) {
  const suffix = Date.now();
  const res = await request.post(`/api/properties/${propertyId}/rooms`, {
    data: { roomNumber: `ND-${suffix}`, roomType: "single", monthlyRent: 500000 },
  });
  if (!res.ok()) { return null; }
  return (await res.json())?.id as string | null;
}

async function cleanupRoom(request: APIRequestContext, propertyId: string, roomId: string) {
  await request.delete(`/api/properties/${propertyId}/rooms/${roomId}`).catch(() => {});
}

test.describe("room detail page — status display", () => {
  let createdRoomId: string | null = null;

  test.afterEach(async ({ request }) => {
    if (!createdRoomId) { return; }
    await cleanupRoom(request, getPropertyId(), createdRoomId);
    createdRoomId = null;
  });

  test.describe("good cases", () => {
    test("room detail shows status as read-only badge", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const roomId = await createEmptyRoom(request, propertyId);
      if (!roomId) { test.skip(); return; }
      createdRoomId = roomId;

      await goToRoomDetail(page, roomId);

      // StatusIndicator renders with role="status" and aria-label
      const statusBadge = page.getByRole("status").filter({ hasText: /available|under renovation|occupied/i });
      await expect(statusBadge.first()).toBeVisible({ timeout: 10000 });
    });

    test("status badge text is visible on room detail page", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const roomId = await createEmptyRoom(request, propertyId);
      if (!roomId) { test.skip(); return; }
      createdRoomId = roomId;

      await goToRoomDetail(page, roomId);

      await expect(
        page.getByText(/available|under renovation|occupied/i).first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("bad cases", () => {
    test("room detail page has no status select or change-status button", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const roomId = await createEmptyRoom(request, propertyId);
      if (!roomId) { test.skip(); return; }
      createdRoomId = roomId;

      await goToRoomDetail(page, roomId);
      await expect(page.getByText(/danger zone/i)).toBeVisible({ timeout: 15000 });

      // No status select trigger on the detail page
      await expect(page.locator("#room-status")).toHaveCount(0);

      // No "Change Status" button/link
      await expect(
        page.getByRole("button", { name: /change status/i })
      ).toHaveCount(0);
    });
  });

  test.describe("edge cases", () => {
    test("status badge is not interactive (no click triggers a select)", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const roomId = await createEmptyRoom(request, propertyId);
      if (!roomId) { test.skip(); return; }
      createdRoomId = roomId;

      await goToRoomDetail(page, roomId);
      await expect(page.getByText(/danger zone/i)).toBeVisible({ timeout: 15000 });

      const statusBadge = page.getByRole("status").first();
      await expect(statusBadge).toBeVisible({ timeout: 10000 });
      await statusBadge.click();

      // No listbox/option appears after clicking the badge
      await expect(page.getByRole("listbox")).toHaveCount(0);
    });
  });
});
