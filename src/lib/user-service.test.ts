// Traceability: settings-language-persistence
// REQ 2.4 -> it('getLanguage returns the stored language for a user')
// REQ 2.1 -> it('updateLanguage persists new language and returns it')
// REQ 2.4 -> it('getLanguage throws when user is not found')
// REQ 2.1 -> it('updateLanguage throws on prisma error')
// PROP 1  -> it('getLanguage returns exactly what prisma returns for any valid locale')

import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";

const mockUserFindUnique = vi.fn();
const mockUserUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mockUserFindUnique,
      update: mockUserUpdate,
    },
  },
}));

const { userService } = await import("@/lib/user-service");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("userService.getLanguage", () => {
  describe("good cases", () => {
    it("returns the stored language for a user", async () => {
      mockUserFindUnique.mockResolvedValue({ language: "id" });

      const result = await userService.getLanguage("user-1");

      expect(result).toBe("id");
      expect(mockUserFindUnique).toHaveBeenCalledWith({
        where: { id: "user-1" },
        select: { language: true },
      });
    });

    it('returns "en" when user language is "en"', async () => {
      mockUserFindUnique.mockResolvedValue({ language: "en" });

      const result = await userService.getLanguage("user-1");

      expect(result).toBe("en");
    });
  });

  describe("bad cases", () => {
    it("throws when user is not found", async () => {
      mockUserFindUnique.mockResolvedValue(null);

      await expect(userService.getLanguage("missing-id")).rejects.toThrow();
    });

    it("throws on prisma error", async () => {
      mockUserFindUnique.mockRejectedValue(new Error("DB error"));

      await expect(userService.getLanguage("user-1")).rejects.toThrow("DB error");
    });
  });

  describe("edge cases", () => {
    it("passes userId directly to prisma where clause", async () => {
      const userId = crypto.randomUUID();
      mockUserFindUnique.mockResolvedValue({ language: "en" });

      await userService.getLanguage(userId);

      expect(mockUserFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: userId } })
      );
    });
  });

  describe("property-based tests", () => {
    // Feature: settings-language-persistence, PROP 1: getLanguage returns exactly what prisma returns
    it("returns exactly what prisma returns for any valid locale", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom("en", "id"),
          async (language) => {
            mockUserFindUnique.mockResolvedValue({ language });
            const result = await userService.getLanguage("any-user");
            expect(result).toBe(language);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe("userService.updateLanguage", () => {
  describe("good cases", () => {
    it("updates and returns the new language", async () => {
      mockUserUpdate.mockResolvedValue({ language: "id" });

      const result = await userService.updateLanguage("user-1", "id");

      expect(result).toBe("id");
      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { language: "id" },
        select: { language: true },
      });
    });

    it('updates to "en" and returns "en"', async () => {
      mockUserUpdate.mockResolvedValue({ language: "en" });

      const result = await userService.updateLanguage("user-1", "en");

      expect(result).toBe("en");
    });
  });

  describe("bad cases", () => {
    it("throws on prisma error", async () => {
      mockUserUpdate.mockRejectedValue(new Error("DB write error"));

      await expect(
        userService.updateLanguage("user-1", "id")
      ).rejects.toThrow("DB write error");
    });
  });

  describe("edge cases", () => {
    it("passes userId and language directly to prisma", async () => {
      const userId = crypto.randomUUID();
      mockUserUpdate.mockResolvedValue({ language: "id" });

      await userService.updateLanguage(userId, "id");

      expect(mockUserUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: userId },
          data: { language: "id" },
        })
      );
    });
  });
});
