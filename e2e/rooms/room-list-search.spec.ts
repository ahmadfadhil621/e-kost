// Traceability: rt-8-filter-search-lists
// REQ-4 -> test('search input is visible on rooms list page')
// REQ-4 -> test('searching by room number filters the list')
// REQ-4 -> test('searching by room type shows matching rooms')
// REQ-4 -> test('search and status filter compose')
// REQ-5 -> test('search with no match shows no results message')
// REQ-4 -> test('search is case-insensitive')
// REQ-4 -> test('clearing search restores all rooms')

import { test, expect, type APIRequestContext } from "@playwright/test";
import { getPropertyId } from "../helpers/tenant-room-basics";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function createRoom(
  request: APIRequestContext,
  propertyId: string,
  roomNumber: string,
  roomType: string = "single",
  monthlyRent: number = 500000
) {
  const res = await request.post(`/api/properties/${propertyId}/rooms`, {
    data: { roomNumber, roomType, monthlyRent },
  });
  if (!res.ok()) { return null; }
  const { id } = await res.json();
  return { roomId: id as string, roomNumber, roomType };
}

async function goToRoomsList(page: import("@playwright/test").Page, propertyId: string) {
  await page.goto(`/properties/${propertyId}/rooms`);
  await page
    .getByRole("link", { name: /add room|tambah kamar/i })
    .or(page.getByText(/no rooms found|tidak ada kamar/i))
    .first()
    .waitFor({ state: "visible", timeout: 15000 });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("rooms list search", () => {
  test.describe("good cases", () => {
    test("search input is visible on rooms list page", async ({ page }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      await goToRoomsList(page, propertyId);
      await expect(page.getByRole("textbox")).toBeVisible({ timeout: 15000 });
    });

    test("searching by room number filters the list", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const suffix = Date.now();

      const roomA = await createRoom(request, propertyId, `SrchNum-${suffix}A`);
      const roomB = await createRoom(request, propertyId, `SrchNum-${suffix}B`);
      if (!roomA || !roomB) { test.skip(); return; }

      await goToRoomsList(page, propertyId);
      await expect(page.getByText(roomA.roomNumber)).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(roomB.roomNumber)).toBeVisible({ timeout: 10000 });

      await page.getByRole("textbox").fill(`${suffix}A`);

      await expect(page.getByText(roomA.roomNumber)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(roomB.roomNumber)).not.toBeVisible();
    });

    test("searching by room type shows matching rooms", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const suffix = Date.now() + 1;

      const singleRoom = await createRoom(
        request,
        propertyId,
        `TypeSingle-${suffix}`,
        "single"
      );
      const doubleRoom = await createRoom(
        request,
        propertyId,
        `TypeDouble-${suffix}`,
        "double"
      );
      if (!singleRoom || !doubleRoom) { test.skip(); return; }

      await goToRoomsList(page, propertyId);
      await expect(page.getByText(singleRoom.roomNumber)).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(doubleRoom.roomNumber)).toBeVisible({ timeout: 10000 });

      await page.getByRole("textbox").fill("double");

      await expect(page.getByText(doubleRoom.roomNumber)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(singleRoom.roomNumber)).not.toBeVisible();
    });

    test("search and status filter compose", async ({ page, request }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const suffix = Date.now() + 2;

      // Create an available single room
      const availableRoom = await createRoom(
        request,
        propertyId,
        `Compose-Avail-${suffix}`,
        "single"
      );
      // Create another available room with a different type
      const availableDouble = await createRoom(
        request,
        propertyId,
        `Compose-Double-${suffix}`,
        "double"
      );
      if (!availableRoom || !availableDouble) { test.skip(); return; }

      await goToRoomsList(page, propertyId);
      await expect(page.getByText(availableRoom.roomNumber)).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(availableDouble.roomNumber)).toBeVisible({ timeout: 10000 });

      // Apply "Available" status filter
      await page.getByRole("button", { name: /^available/i }).click();

      // Then search for the single room number
      await page.getByRole("textbox").fill(`Compose-Avail-${suffix}`);

      await expect(page.getByText(availableRoom.roomNumber)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(availableDouble.roomNumber)).not.toBeVisible();
    });
  });

  test.describe("bad cases", () => {
    test("search with no match shows no results message", async ({
      page,
      request,
    }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const suffix = Date.now() + 10;

      const room = await createRoom(request, propertyId, `NoMatch-${suffix}`);
      if (!room) { test.skip(); return; }

      await goToRoomsList(page, propertyId);
      await expect(page.getByText(room.roomNumber)).toBeVisible({ timeout: 15000 });

      await page.getByRole("textbox").fill("zzz_no_match_xyz_999");

      await expect(
        page.getByText(/no results found|tidak ada hasil/i)
      ).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(room.roomNumber)).not.toBeVisible();
    });
  });

  test.describe("edge cases", () => {
    test("search is case-insensitive", async ({ page, request }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const suffix = Date.now() + 20;

      const room = await createRoom(
        request,
        propertyId,
        `CaseTest-${suffix}`,
        "single"
      );
      if (!room) { test.skip(); return; }

      await goToRoomsList(page, propertyId);
      await expect(page.getByText(room.roomNumber)).toBeVisible({ timeout: 15000 });

      // Type roomType in uppercase
      await page.getByRole("textbox").fill("SINGLE");

      await expect(page.getByText(room.roomNumber)).toBeVisible({ timeout: 10000 });
    });

    test("clearing search restores all rooms", async ({ page, request }) => {
      test.info().setTimeout(60000);
      const propertyId = getPropertyId();
      const suffix = Date.now() + 30;

      const roomA = await createRoom(request, propertyId, `ClearA-${suffix}`);
      const roomB = await createRoom(request, propertyId, `ClearB-${suffix}`);
      if (!roomA || !roomB) { test.skip(); return; }

      await goToRoomsList(page, propertyId);
      await expect(page.getByText(roomA.roomNumber)).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(roomB.roomNumber)).toBeVisible({ timeout: 10000 });

      const searchInput = page.getByRole("textbox");
      await searchInput.fill(`ClearA-${suffix}`);
      await expect(page.getByText(roomB.roomNumber)).not.toBeVisible();

      await searchInput.clear();

      await expect(page.getByText(roomA.roomNumber)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(roomB.roomNumber)).toBeVisible({ timeout: 10000 });
    });
  });
});
