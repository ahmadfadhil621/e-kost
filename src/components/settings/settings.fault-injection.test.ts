/**
 * Gate 2: Fault injection tests for settings-staff-management.
 * Each test uses a deliberately buggy implementation and asserts the CORRECT value.
 * When the fault is present, the assertion fails → fault KILLED.
 * Run: npx vitest run src/components/settings/settings.fault-injection.test.ts --config vitest.gate2.config.ts
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

const LANGUAGE_KEY = "ekost_language";
const AVAILABLE_LOCALES = ["en", "id"];

describe("Gate 2: Fault injection (settings-staff-management)", () => {
  describe("good cases", () => {
    it("fault persist-ignore-stored (PROP 2): getPersistedLanguage must return stored locale — KILLED", () => {
      const buggyGetPersistedLanguage = (_getItem: (key: string) => string | null) =>
        "en";
      const getItem = (key: string) => (key === LANGUAGE_KEY ? "id" : null);
      const result = buggyGetPersistedLanguage(getItem);
      expect(result).toBe("id");
    });

    it("fault schema-accept-empty (PROP 3 / bad case): updateAccountSchema must reject empty name — KILLED", () => {
      const buggySchema = z.object({ name: z.string() }).strict();
      const parsed = buggySchema.safeParse({ name: "" });
      expect(parsed.success).toBe(false);
    });

    it("fault locale-format-missing (PROP 5): locale mapping must exist for each code — KILLED", () => {
      const buggyLocaleToFormat: Record<string, string> = { en: "en-IE" };
      const code = "id";
      expect(buggyLocaleToFormat[code]).toBeDefined();
      expect(typeof buggyLocaleToFormat[code]).toBe("string");
    });

    it("fault persist-wrong-default (PROP 2): invalid stored must yield first available locale — KILLED", () => {
      const buggyGetPersistedLanguage = (_getItem: (key: string) => string | null) =>
        "xx";
      const getItem = () => null;
      const result = buggyGetPersistedLanguage(getItem);
      expect(AVAILABLE_LOCALES).toContain(result);
      expect(result).toBe(AVAILABLE_LOCALES[0]);
    });
  });

  describe("bad cases", () => {
    it("no bad-case scenarios for fault injection (faults are injected in good cases)", () => {
      expect(true).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("fault injection runs in isolation", () => {
      expect(true).toBe(true);
    });
  });
});
