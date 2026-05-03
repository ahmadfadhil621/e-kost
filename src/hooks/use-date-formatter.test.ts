// Traceability: settings-timezone (issue #120)
// REQ CrossCutting.1 -> it('formats the same UTC timestamp differently in different timezones')
// REQ CrossCutting.1 -> it('uses UTC timezone when user.timezone is UTC')
// REQ AutoDetect.3   -> it('falls back to browser timezone when user has no timezone set')
// REQ AutoDetect.3   -> it('falls back to Asia/Jakarta when user is unauthenticated')
// REQ CrossCutting.1 -> it('accepts a string date input and parses it internally')
// PROP 3             -> it('same UTC timestamp formats differently across timezones')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

const UTC_TIMESTAMP = new Date("2024-06-15T08:00:00Z");
const UTC_TIMESTAMP_STRING = "2024-06-15T08:00:00Z";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: vi.fn(),
}));

const { useAuth } = await import("@/hooks/use-auth");
const { useDateFormatter } = await import("./use-date-formatter");

function makeAuthUser(timezone: string | null) {
  return {
    user: {
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      timezone,
    },
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  };
}

const unauthenticatedState = {
  user: null,
  loading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useDateFormatter", () => {
  describe("good cases", () => {
    it("formats the same UTC timestamp differently in Asia/Jakarta vs America/New_York", () => {
      vi.mocked(useAuth).mockReturnValue(makeAuthUser("Asia/Jakarta"));
      const { result: jakartaResult } = renderHook(() => useDateFormatter());

      vi.mocked(useAuth).mockReturnValue(makeAuthUser("America/New_York"));
      const { result: nyResult } = renderHook(() => useDateFormatter());

      const jakartaFormatted = jakartaResult.current.format(UTC_TIMESTAMP, {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        hour12: false,
      });

      const nyFormatted = nyResult.current.format(UTC_TIMESTAMP, {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        hour12: false,
      });

      expect(jakartaFormatted).not.toBe(nyFormatted);
    });

    it("uses UTC timezone when user.timezone is 'UTC'", () => {
      vi.mocked(useAuth).mockReturnValue(makeAuthUser("UTC"));
      const { result } = renderHook(() => useDateFormatter());

      expect(result.current.timezone).toBe("UTC");

      const formatted = result.current.format(UTC_TIMESTAMP, {
        hour: "numeric",
        minute: "numeric",
        hour12: false,
        timeZone: undefined,
      });

      expect(formatted).toContain("8");
    });

    it("exposes the resolved timezone string", () => {
      vi.mocked(useAuth).mockReturnValue(makeAuthUser("Asia/Tokyo"));
      const { result } = renderHook(() => useDateFormatter());

      expect(result.current.timezone).toBe("Asia/Tokyo");
    });
  });

  describe("bad cases", () => {
    it("falls back when user is unauthenticated (null user)", () => {
      vi.mocked(useAuth).mockReturnValue(unauthenticatedState);
      const { result } = renderHook(() => useDateFormatter());

      expect(result.current.timezone).toBeTruthy();
      expect(typeof result.current.timezone).toBe("string");

      expect(() =>
        result.current.format(UTC_TIMESTAMP)
      ).not.toThrow();
    });
  });

  describe("edge cases", () => {
    it("falls back to browser timezone when user.timezone is null", () => {
      vi.mocked(useAuth).mockReturnValue(makeAuthUser(null));
      const { result } = renderHook(() => useDateFormatter());

      expect(result.current.timezone).toBeTruthy();
      expect(result.current.timezone).not.toBe("null");

      expect(() =>
        result.current.format(UTC_TIMESTAMP)
      ).not.toThrow();
    });

    it("accepts a string date input and parses it to a Date internally", () => {
      vi.mocked(useAuth).mockReturnValue(makeAuthUser("UTC"));
      const { result } = renderHook(() => useDateFormatter());

      const fromDate = result.current.format(UTC_TIMESTAMP);
      const fromString = result.current.format(UTC_TIMESTAMP_STRING);

      expect(fromDate).toBe(fromString);
    });

    it("merges caller-supplied Intl options with the user timezone", () => {
      vi.mocked(useAuth).mockReturnValue(makeAuthUser("UTC"));
      const { result } = renderHook(() => useDateFormatter());

      const formatted = result.current.format(UTC_TIMESTAMP, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      expect(formatted).toContain("2024");
      expect(formatted).toContain("June");
    });

    // Feature: settings-timezone, PROP 3: same UTC timestamp differs across timezones
    it("same UTC timestamp formats differently across multiple timezones", () => {
      const timezones = [
        "Asia/Jakarta",
        "America/New_York",
        "Europe/Berlin",
        "UTC",
        "Australia/Sydney",
      ];

      const formatted = timezones.map((tz) => {
        vi.mocked(useAuth).mockReturnValue(makeAuthUser(tz));
        const { result } = renderHook(() => useDateFormatter());
        return result.current.format(UTC_TIMESTAMP, {
          year: "numeric",
          month: "numeric",
          day: "numeric",
          hour: "numeric",
          hour12: false,
        });
      });

      const unique = new Set(formatted);
      expect(unique.size).toBeGreaterThan(1);
    });
  });
});
