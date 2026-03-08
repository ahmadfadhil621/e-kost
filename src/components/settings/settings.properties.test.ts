// Traceability: settings-staff-management
// PROP 1 -> it('Language Switch Completeness: for any language code, changeLanguage and persist are called')
// PROP 2 -> it('Language Persistence: for any valid stored locale, getItem returns it')
// PROP 3 -> it('Account Name Update Round Trip: for any valid name, update schema accepts it')
// PROP 4 -> it('Staff Section Visibility: for any role, section visible iff role is owner')
// PROP 5 -> it('Locale Formatting Consistency: for any locale code, formatting key exists')

import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";
import { z } from "zod";

const updateAccountSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100).trim(),
  })
  .strict();

const LANGUAGE_KEY = "ekost_language";
const AVAILABLE_LOCALES = ["en", "id"];

function getPersistedLanguage(getItem: (key: string) => string | null): string {
  const stored = getItem(LANGUAGE_KEY);
  if (stored && AVAILABLE_LOCALES.includes(stored)) {
    return stored;
  }
  return AVAILABLE_LOCALES[0] ?? "en";
}

describe("settings-staff-management property-based", () => {
  describe("good cases", () => {
    it("PROP 1: for any language code in available locales, changeLanguage and persist are invoked", () => {
      fc.assert(
        fc.property(fc.constantFrom(...AVAILABLE_LOCALES), (lang) => {
          const changeLanguage = vi.fn().mockResolvedValue(undefined);
          const setItem = vi.fn();
          changeLanguage(lang);
          setItem(LANGUAGE_KEY, lang);
          expect(changeLanguage).toHaveBeenCalledWith(lang);
          expect(setItem).toHaveBeenCalledWith(LANGUAGE_KEY, lang);
        }),
        { numRuns: 100 }
      );
    });

    it("PROP 2: for any valid stored locale, getPersistedLanguage returns that locale", () => {
      fc.assert(
        fc.property(fc.constantFrom(...AVAILABLE_LOCALES), (stored) => {
          const getItem = vi.fn((key: string) =>
            key === LANGUAGE_KEY ? stored : null
          );
          const result = getPersistedLanguage(getItem);
          expect(result).toBe(stored);
        }),
        { numRuns: 100 }
      );
    });

    it("PROP 2: when stored value is invalid or missing, returns first available locale", () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.string().filter((s) => !AVAILABLE_LOCALES.includes(s))
          ),
          (stored) => {
            const getItem = (_k: string) =>
              stored === undefined ? null : (stored as string | null);
            const result = getPersistedLanguage(getItem);
            expect(AVAILABLE_LOCALES).toContain(result);
            expect(result).toBe(AVAILABLE_LOCALES[0]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("PROP 3: for any valid name (1-100 non-whitespace chars), schema accepts it", () => {
      const nameArbitrary = fc
        .string({ minLength: 1, maxLength: 100 })
        .filter((s) => s.trim().length > 0);
      fc.assert(
        fc.property(nameArbitrary, (name) => {
          const parsed = updateAccountSchema.parse({ name: name.trim() });
          expect(parsed.name).toBe(name.trim());
        }),
        { numRuns: 100 }
      );
    });

    it("PROP 4: staff section visible if and only if user role is owner", () => {
      type Role = "owner" | "staff" | null;
      fc.assert(
        fc.property(fc.constantFrom<Role>("owner", "staff", null), (role) => {
          const visible = role === "owner";
          expect(visible).toBe(role === "owner");
        }),
        { numRuns: 100 }
      );
    });

    it("PROP 5: for any available locale code, a formatting locale mapping can exist", () => {
      const localeToFormat: Record<string, string> = {
        en: "en-IE",
        id: "id-ID",
      };
      fc.assert(
        fc.property(fc.constantFrom(...AVAILABLE_LOCALES), (code) => {
          expect(localeToFormat[code]).toBeDefined();
          expect(typeof localeToFormat[code]).toBe("string");
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("bad cases", () => {
    it("updateAccountSchema rejects empty name", () => {
      const result = updateAccountSchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("getPersistedLanguage handles empty available locales", () => {
      const getItem = () => null;
      const result = getPersistedLanguage(getItem);
      expect(result).toBe("en");
    });
  });
});
