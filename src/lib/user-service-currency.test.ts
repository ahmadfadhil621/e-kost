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
  it("getCurrency does not exist on userService", () => {
    expect((userService as Record<string, unknown>).getCurrency).toBeUndefined();
  });

  it("updateCurrency does not exist on userService", () => {
    expect((userService as Record<string, unknown>).updateCurrency).toBeUndefined();
  });
});
