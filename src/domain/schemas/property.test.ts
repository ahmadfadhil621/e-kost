// Traceability: property-settings (issue #104)
// AC-13  -> it('accepts valid staffOnlyFinance: true')
// AC-13  -> it('accepts valid staffOnlyFinance: false')
// AC-13  -> it('rejects when staffOnlyFinance is missing')
// AC-13  -> it('rejects when staffOnlyFinance is not a boolean')

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { updatePropertySettingsSchema } from "./property";

describe("updatePropertySettingsSchema", () => {
  describe("good cases", () => {
    it("accepts valid staffOnlyFinance: true", () => {
      const result = updatePropertySettingsSchema.safeParse({ staffOnlyFinance: true });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.staffOnlyFinance).toBe(true);
      }
    });

    it("accepts valid staffOnlyFinance: false", () => {
      const result = updatePropertySettingsSchema.safeParse({ staffOnlyFinance: false });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.staffOnlyFinance).toBe(false);
      }
    });
  });

  describe("bad cases", () => {
    it("rejects when staffOnlyFinance is missing", () => {
      const result = updatePropertySettingsSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects when staffOnlyFinance is a string", () => {
      const result = updatePropertySettingsSchema.safeParse({ staffOnlyFinance: "true" });
      expect(result.success).toBe(false);
    });

    it("rejects when staffOnlyFinance is a number", () => {
      const result = updatePropertySettingsSchema.safeParse({ staffOnlyFinance: 1 });
      expect(result.success).toBe(false);
    });

    it("rejects when staffOnlyFinance is null", () => {
      const result = updatePropertySettingsSchema.safeParse({ staffOnlyFinance: null });
      expect(result.success).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("ignores unknown extra fields", () => {
      const result = updatePropertySettingsSchema.safeParse({
        staffOnlyFinance: true,
        unknownField: "unexpected",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty("unknownField");
      }
    });

    it("accepts only boolean values for staffOnlyFinance (property-based)", () => {
      fc.assert(
        fc.property(fc.boolean(), (value) => {
          const result = updatePropertySettingsSchema.safeParse({ staffOnlyFinance: value });
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.staffOnlyFinance).toBe(value);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
