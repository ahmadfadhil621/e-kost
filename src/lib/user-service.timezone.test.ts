// Traceability: settings-timezone (issue #120)
// REQ Service.1 -> it('getTimezone returns stored timezone')
// REQ Service.2 -> it('updateTimezone returns the updated timezone')
// REQ Service.3 -> it('getTimezone throws when user not found')
// REQ Service.4 -> it('updateTimezone throws when user not found')
// REQ Storage.1 -> it('getTimezone returns null when timezone is null')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createUser } from "@/test/fixtures/user";

const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  },
}));

const { userService } = await import("@/lib/user-service");

const USER_ID = "user-abc-123";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("userService.getTimezone", () => {
  describe("good cases", () => {
    it("returns the stored timezone when set", async () => {
      const user = createUser({ id: USER_ID, timezone: "Asia/Jakarta" });
      mockFindUnique.mockResolvedValue({ timezone: user.timezone });

      const result = await userService.getTimezone(USER_ID);

      expect(result).toBe("Asia/Jakarta");
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: USER_ID },
        select: { timezone: true },
      });
    });

    it("returns a non-default timezone when stored", async () => {
      mockFindUnique.mockResolvedValue({ timezone: "America/New_York" });

      const result = await userService.getTimezone(USER_ID);

      expect(result).toBe("America/New_York");
    });
  });

  describe("bad cases", () => {
    it("throws when user is not found", async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(userService.getTimezone(USER_ID)).rejects.toThrow(USER_ID);
    });
  });

  describe("edge cases", () => {
    it("returns null when timezone has never been set", async () => {
      mockFindUnique.mockResolvedValue({ timezone: null });

      const result = await userService.getTimezone(USER_ID);

      expect(result).toBeNull();
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: USER_ID },
        select: { timezone: true },
      });
    });
  });
});

describe("userService.updateTimezone", () => {
  describe("good cases", () => {
    it("returns the updated timezone", async () => {
      mockUpdate.mockResolvedValue({ timezone: "Europe/Berlin" });

      const result = await userService.updateTimezone(USER_ID, "Europe/Berlin");

      expect(result).toBe("Europe/Berlin");
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: USER_ID },
        data: { timezone: "Europe/Berlin" },
        select: { timezone: true },
      });
    });

    it("returns the new timezone after updating from a previous value", async () => {
      mockUpdate.mockResolvedValue({ timezone: "UTC" });

      const result = await userService.updateTimezone(USER_ID, "UTC");

      expect(result).toBe("UTC");
    });
  });

  describe("bad cases", () => {
    it("throws when user is not found", async () => {
      mockUpdate.mockRejectedValue(
        new Error(`User not found: ${USER_ID}`)
      );

      await expect(
        userService.updateTimezone(USER_ID, "Asia/Jakarta")
      ).rejects.toThrow(USER_ID);
    });
  });

  describe("edge cases", () => {
    it("passes the exact timezone string to Prisma update", async () => {
      const tz = "Pacific/Auckland";
      mockUpdate.mockResolvedValue({ timezone: tz });

      await userService.updateTimezone(USER_ID, tz);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ data: { timezone: tz } })
      );
    });
  });
});
