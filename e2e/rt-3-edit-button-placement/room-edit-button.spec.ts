// Traceability: rt-3-edit-button-placement (room detail) — issue #14
// REQ RT-3.1 -> test('edit button is visible inline with the page heading')
// REQ RT-3.3 -> test('edit button meets 44x44px minimum touch target')
// REQ RT-3.6 -> test('clicking edit button navigates to edit room page')
// REQ RT-3.1 -> test('archived room has no edit button')
// REQ RT-3.4 -> test('room detail has no horizontal scroll at 375px viewport')

import * as fs from "fs";
import * as path from "path";
import { test, expect } from "@playwright/test";
import { goToRoomDetail } from "../helpers/room-inventory";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

function getPropertyId(): string {
  const filePath = path.join(process.cwd(), "e2e/.auth/property-id.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return data.propertyId;
}

async function createRoom(
  request: Parameters<Parameters<typeof test>[1]>[0]["request"],
  baseURL: string | undefined
): Promise<{ roomId: string }> {
  const propertyId = getPropertyId();
  const res = await request.post(
    `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/rooms`,
    {
      data: {
        roomNumber: "RT3-R-" + Date.now(),
        roomType: "single",
        monthlyRent: 1500000,
      },
    }
  );
  if (!res.ok()) {
    throw new Error(`Create room failed: ${res.status()} ${await res.text()}`);
  }
  const room = await res.json();
  return { roomId: room.id };
}

async function deleteRoom(
  request: Parameters<Parameters<typeof test>[1]>[0]["request"],
  baseURL: string | undefined,
  roomId: string
) {
  const propertyId = getPropertyId();
  await request.delete(
    `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/rooms/${roomId}`
  );
}

async function archiveRoom(
  request: Parameters<Parameters<typeof test>[1]>[0]["request"],
  baseURL: string | undefined,
  roomId: string
) {
  const propertyId = getPropertyId();
  await request.post(
    `${baseURL ?? "http://localhost:3000"}/api/properties/${propertyId}/rooms/${roomId}/archive`
  );
}

test.describe("room edit button placement", () => {
  test.describe("good cases", () => {
    test("edit button is visible inline with the page heading", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const { roomId } = await createRoom(request, baseURL);

      try {
        await goToRoomDetail(page, roomId);

        const heading = page.getByRole("heading", { name: /room details/i });
        const editBtn = page.getByRole("link", { name: /^edit$/i });

        await expect(heading).toBeVisible({ timeout: 5000 });
        await expect(editBtn).toBeVisible({ timeout: 5000 });

        // Both must be in the same row: vertical midpoints within 8px
        const headingBox = await heading.boundingBox();
        const editBox = await editBtn.boundingBox();
        const headingMidY = headingBox!.y + headingBox!.height / 2;
        const editMidY = editBox!.y + editBox!.height / 2;
        expect(Math.abs(editMidY - headingMidY)).toBeLessThanOrEqual(8);
      } finally {
        await deleteRoom(request, baseURL, roomId);
      }
    });

    test("edit button meets 44×44px minimum touch target", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const { roomId } = await createRoom(request, baseURL);

      try {
        await goToRoomDetail(page, roomId);

        const editBtn = page.getByRole("link", { name: /^edit$/i });
        await expect(editBtn).toBeVisible({ timeout: 5000 });

        const box = await editBtn.boundingBox();
        expect(box!.width).toBeGreaterThanOrEqual(44);
        expect(box!.height).toBeGreaterThanOrEqual(44);
      } finally {
        await deleteRoom(request, baseURL, roomId);
      }
    });

    test("clicking edit button navigates to edit room page", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const { roomId } = await createRoom(request, baseURL);

      try {
        await goToRoomDetail(page, roomId);
        await page.getByRole("link", { name: /^edit$/i }).click();

        await page.waitForURL(/\/rooms\/[^/]+\/edit/, { timeout: 15000 });
        await expect(page.locator("#room-number")).toBeVisible({ timeout: 10000 });
      } finally {
        await deleteRoom(request, baseURL, roomId);
      }
    });
  });

  test.describe("bad cases", () => {
    test("archived room has no edit button", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const { roomId } = await createRoom(request, baseURL);

      try {
        await archiveRoom(request, baseURL, roomId);
        await goToRoomDetail(page, roomId);

        await expect(
          page.getByRole("link", { name: /^edit$/i })
        ).not.toBeVisible({ timeout: 5000 });
      } finally {
        await deleteRoom(request, baseURL, roomId);
      }
    });
  });

  test.describe("edge cases", () => {
    test("room detail has no horizontal scroll at 375px viewport", async ({
      page,
      request,
      baseURL,
    }) => {
      test.info().setTimeout(60000);
      const { roomId } = await createRoom(request, baseURL);

      try {
        await goToRoomDetail(page, roomId);

        const hasHorizontalScroll = await page.evaluate(
          () => document.body.scrollWidth > document.body.clientWidth
        );
        expect(hasHorizontalScroll).toBe(false);
      } finally {
        await deleteRoom(request, baseURL, roomId);
      }
    });
  });
});
