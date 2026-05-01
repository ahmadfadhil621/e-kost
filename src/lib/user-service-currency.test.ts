// Traceability: property-currency (Issue #93)
// getCurrency and updateCurrency removed from userService.
// Currency is now a property-level attribute — see property-service tests.

import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

const { userService } = await import("@/lib/user-service");

describe("userService — currency methods removed (Issue #93)", () => {
  describe("good cases", () => {
    it("getCurrency does not exist on userService", () => {
      expect((userService as Record<string, unknown>).getCurrency).toBeUndefined();
    });

    it("updateCurrency does not exist on userService", () => {
      expect((userService as Record<string, unknown>).updateCurrency).toBeUndefined();
    });
  });

  describe("bad cases", () => {
    it("userService does not expose any currency mutation method", () => {
      const currencyMethods = Object.keys(userService as object).filter((k) =>
        k.toLowerCase().includes("currency")
      );
      expect(currencyMethods).toHaveLength(0);
    });
  });

  describe("edge cases", () => {
    it("userService still exposes language methods after currency removal", () => {
      expect(typeof (userService as Record<string, unknown>).getLanguage).toBe("function");
      expect(typeof (userService as Record<string, unknown>).updateLanguage).toBe("function");
    });
  });
});
