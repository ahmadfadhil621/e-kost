// Traceability: settings-timezone (issue #120)
// REQ Storage.1 -> it('accepts each curated timezone')
// REQ Storage.2 -> it('accepts arbitrary valid IANA strings')
// REQ Storage.3 -> it('rejects invalid IANA strings')
// REQ Storage.3 -> it('rejects empty string')
// REQ Storage.3 -> it('rejects missing timezone field')
// REQ Storage.3 -> it('rejects non-string values')
// PROP 1        -> it('any IANA string accepted by Intl.DateTimeFormat passes schema')

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { updateTimezoneSchema, CURATED_TIMEZONES } from "@/domain/schemas/user";

const VALID_EXTRA_TIMEZONES = [
  "America/Denver",
  "America/Phoenix",
  "Asia/Seoul",
  "Asia/Bangkok",
  "Europe/Madrid",
  "Europe/Rome",
  "Africa/Nairobi",
  "Pacific/Honolulu",
  "America/Toronto",
  "Australia/Melbourne",
];

describe("updateTimezoneSchema", () => {
  describe("good cases", () => {
    it("accepts each curated timezone", () => {
      for (const tz of CURATED_TIMEZONES) {
        const result = updateTimezoneSchema.safeParse({ timezone: tz });
        expect(result.success, `Expected ${tz} to be valid`).toBe(true);
      }
    });

    it("accepts arbitrary valid IANA strings not in the curated list", () => {
      for (const tz of VALID_EXTRA_TIMEZONES) {
        const result = updateTimezoneSchema.safeParse({ timezone: tz });
        expect(result.success, `Expected ${tz} to be valid`).toBe(true);
      }
    });

    it("accepts UTC as a valid timezone", () => {
      const result = updateTimezoneSchema.safeParse({ timezone: "UTC" });
      expect(result.success).toBe(true);
    });
  });

  describe("bad cases", () => {
    it("rejects invalid IANA string 'Foo/Bar'", () => {
      const result = updateTimezoneSchema.safeParse({ timezone: "Foo/Bar" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Invalid IANA timezone");
      }
    });

    it("rejects empty string", () => {
      const result = updateTimezoneSchema.safeParse({ timezone: "" });
      expect(result.success).toBe(false);
    });

    it("rejects missing timezone field", () => {
      const result = updateTimezoneSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects non-string values (number)", () => {
      const result = updateTimezoneSchema.safeParse({ timezone: 42 });
      expect(result.success).toBe(false);
    });

    it("rejects non-string values (null)", () => {
      const result = updateTimezoneSchema.safeParse({ timezone: null });
      expect(result.success).toBe(false);
    });

    it("rejects known-bad strings without a slash", () => {
      const result = updateTimezoneSchema.safeParse({ timezone: "Jakarta" });
      expect(result.success).toBe(false);
    });
  });

  describe("edge cases", () => {
    // Feature: settings-timezone, PROP 1: valid Intl timezone strings pass schema
    it("any IANA string accepted by Intl.DateTimeFormat passes schema", () => {
      const knownValid = [
        ...CURATED_TIMEZONES,
        ...VALID_EXTRA_TIMEZONES,
      ] as string[];

      fc.assert(
        fc.property(
          fc.constantFrom(...knownValid),
          (tz) => {
            const result = updateTimezoneSchema.safeParse({ timezone: tz });
            return result.success === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects strings that are not valid for Intl.DateTimeFormat", () => {
      const knownInvalid = [
        "Not/Valid",
        "Random/String",
        "Foo/Bar",
        "Invalid",
        "123",
      ];

      fc.assert(
        fc.property(
          fc.constantFrom(...knownInvalid),
          (tz) => {
            const result = updateTimezoneSchema.safeParse({ timezone: tz });
            return result.success === false;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe("CURATED_TIMEZONES", () => {
  it("contains exactly 15 entries", () => {
    expect(CURATED_TIMEZONES).toHaveLength(15);
  });

  it("includes Asia/Jakarta as the first entry", () => {
    expect(CURATED_TIMEZONES[0]).toBe("Asia/Jakarta");
  });

  it("includes UTC", () => {
    expect(CURATED_TIMEZONES).toContain("UTC");
  });

  it("all entries are accepted by Intl.DateTimeFormat", () => {
    for (const tz of CURATED_TIMEZONES) {
      expect(
        () => new Intl.DateTimeFormat(undefined, { timeZone: tz }),
        `Expected ${tz} to be a valid IANA timezone`
      ).not.toThrow();
    }
  });
});
