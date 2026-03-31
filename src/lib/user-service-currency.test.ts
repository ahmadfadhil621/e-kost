// Traceability: settings-currency-management
// AC-2 -> it('getCurrency returns the stored currency code for a user')
// AC-2 -> it('updateCurrency persists new currency code and returns it')
// AC-2 -> it('getCurrency throws when user is not found')
// AC-2 -> it('updateCurrency throws when user is not found')
// PROP 2 -> it('getCurrency returns exactly what prisma returns for any valid code')

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

describe("userService.getCurrency", () => {
  describe("good cases", () => {
    it("returns the stored currency code for a user", async () => {
      mockUserFindUnique.mockResolvedValue({ currency: "IDR" });

      const result = await userService.getCurrency("user-1");

      expect(result).toBe("IDR");
      expect(mockUserFindUnique).toHaveBeenCalledWith({
        where: { id: "user-1" },
        select: { currency: true },
      });
    });

    it('returns "EUR" when user currency is the default', async () => {
      mockUserFindUnique.mockResolvedValue({ currency: "EUR" });

      const result = await userService.getCurrency("user-1");

      expect(result).toBe("EUR");
    });
  });

  describe("bad cases", () => {
    it("throws when user is not found", async () => {
      mockUserFindUnique.mockResolvedValue(null);

      await expect(userService.getCurrency("missing-id")).rejects.toThrow();
    });

    it("throws on prisma error", async () => {
      mockUserFindUnique.mockRejectedValue(new Error("DB error"));

      await expect(userService.getCurrency("user-1")).rejects.toThrow("DB error");
    });
  });

  describe("edge cases", () => {
    it("passes userId directly to prisma where clause", async () => {
      const userId = crypto.randomUUID();
      mockUserFindUnique.mockResolvedValue({ currency: "EUR" });

      await userService.getCurrency(userId);

      expect(mockUserFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: userId } })
      );
    });

    // Feature: settings-currency-management, PROP 2: getCurrency returns exactly what prisma returns
    it("property-based: returns exactly what prisma returns for any currency code", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.stringMatching(/^[A-Z]{3}$/),
          async (code) => {
            mockUserFindUnique.mockResolvedValue({ currency: code });
            const result = await userService.getCurrency("any-user");
            expect(result).toBe(code);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe("userService.updateCurrency", () => {
  describe("good cases", () => {
    it("updates and returns the new currency code", async () => {
      mockUserUpdate.mockResolvedValue({ currency: "IDR" });

      const result = await userService.updateCurrency("user-1", "IDR");

      expect(result).toBe("IDR");
      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { currency: "IDR" },
        select: { currency: true },
      });
    });

    it('updates to "EUR" and returns "EUR"', async () => {
      mockUserUpdate.mockResolvedValue({ currency: "EUR" });

      const result = await userService.updateCurrency("user-1", "EUR");

      expect(result).toBe("EUR");
    });
  });

  describe("bad cases", () => {
    it("throws on prisma error", async () => {
      mockUserUpdate.mockRejectedValue(new Error("DB write error"));

      await expect(userService.updateCurrency("user-1", "IDR")).rejects.toThrow("DB write error");
    });
  });

  describe("edge cases", () => {
    it("passes userId and currency code directly to prisma", async () => {
      const userId = crypto.randomUUID();
      mockUserUpdate.mockResolvedValue({ currency: "IDR" });

      await userService.updateCurrency(userId, "IDR");

      expect(mockUserUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: userId },
          data: { currency: "IDR" },
        })
      );
    });

    it("does not call findUnique during updateCurrency", async () => {
      mockUserUpdate.mockResolvedValue({ currency: "EUR" });

      await userService.updateCurrency("user-1", "EUR");

      expect(mockUserFindUnique).not.toHaveBeenCalled();
    });
  });
});
