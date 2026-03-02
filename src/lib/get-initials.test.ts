import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { getInitials } from "./get-initials";

describe("getInitials", () => {
  describe("good cases", () => {
    it("returns initials from two-word name", () => {
      expect(getInitials("John Doe")).toBe("JD");
    });

    it("returns single initial from one-word name", () => {
      expect(getInitials("John")).toBe("J");
    });

    it("returns two initials from three-word name", () => {
      expect(getInitials("John Michael Doe")).toBe("JD");
    });
  });

  describe("bad cases", () => {
    it("returns ?? for empty string", () => {
      expect(getInitials("")).toBe("??");
    });

    it("returns ?? for whitespace-only string", () => {
      expect(getInitials("   ")).toBe("??");
    });
  });

  describe("edge cases", () => {
    it("handles lowercase names", () => {
      expect(getInitials("john doe")).toBe("JD");
    });

    it("handles names with extra spaces", () => {
      expect(getInitials("  John   Doe  ")).toBe("JD");
    });

    it("limits to 2 characters max", () => {
      const result = getInitials("A B C D E");
      expect(result.length).toBeLessThanOrEqual(2);
    });
  });

  describe("property-based tests", () => {
    // Feature: user-authentication, Property 7: Profile Icon Displays Initials
    it("always returns 1-2 uppercase characters for non-empty names", () => {
      const nameWord = fc.stringMatching(/^[a-zA-Z]{1,20}$/);
      const fullName = fc
        .array(nameWord, { minLength: 1, maxLength: 4 })
        .map((words) => words.join(" "));

      fc.assert(
        fc.property(fullName, (name) => {
          const initials = getInitials(name);
          expect(initials.length).toBeGreaterThanOrEqual(1);
          expect(initials.length).toBeLessThanOrEqual(2);
          expect(initials).toBe(initials.toUpperCase());
        }),
        { numRuns: 100 }
      );
    });
  });
});
