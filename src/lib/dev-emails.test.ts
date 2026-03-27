// Traceability: settings-invite-management
// REQ 1.1 -> it('returns true when DEV_EMAILS is not set')
// REQ 1.2 -> it('returns true when email matches entry in DEV_EMAILS')
// REQ 1.3 -> it('returns false when DEV_EMAILS is set and email is not in list')
// REQ 1.4 -> it('matching is case-insensitive')
// REQ 1.5 -> it('trims whitespace around emails')

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("isDevEmail", () => {
  let isDevEmail: (email: string) => boolean;

  beforeEach(async () => {
    vi.resetModules();
  });

  afterEach(() => {
    delete process.env.DEV_EMAILS;
  });

  describe("good cases", () => {
    it("returns true when DEV_EMAILS is not set", async () => {
      delete process.env.DEV_EMAILS;
      const mod = await import("./dev-emails");
      isDevEmail = mod.isDevEmail;
      expect(isDevEmail("anyone@example.com")).toBe(true);
    });

    it("returns true when email matches entry in DEV_EMAILS", async () => {
      process.env.DEV_EMAILS = "dev@example.com,admin@example.com";
      const mod = await import("./dev-emails");
      isDevEmail = mod.isDevEmail;
      expect(isDevEmail("dev@example.com")).toBe(true);
      expect(isDevEmail("admin@example.com")).toBe(true);
    });
  });

  describe("bad cases", () => {
    it("returns false when DEV_EMAILS is set and email is not in list", async () => {
      process.env.DEV_EMAILS = "dev@example.com";
      const mod = await import("./dev-emails");
      isDevEmail = mod.isDevEmail;
      expect(isDevEmail("other@example.com")).toBe(false);
    });

    it("returns false for empty string when DEV_EMAILS is set", async () => {
      process.env.DEV_EMAILS = "dev@example.com";
      const mod = await import("./dev-emails");
      isDevEmail = mod.isDevEmail;
      expect(isDevEmail("")).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("matching is case-insensitive", async () => {
      process.env.DEV_EMAILS = "Dev@Example.COM";
      const mod = await import("./dev-emails");
      isDevEmail = mod.isDevEmail;
      expect(isDevEmail("dev@example.com")).toBe(true);
      expect(isDevEmail("DEV@EXAMPLE.COM")).toBe(true);
    });

    it("trims whitespace around emails", async () => {
      process.env.DEV_EMAILS = "  dev@example.com  ,  admin@example.com  ";
      const mod = await import("./dev-emails");
      isDevEmail = mod.isDevEmail;
      expect(isDevEmail("dev@example.com")).toBe(true);
      expect(isDevEmail("admin@example.com")).toBe(true);
    });

    it("handles single email entry", async () => {
      process.env.DEV_EMAILS = "solo@example.com";
      const mod = await import("./dev-emails");
      isDevEmail = mod.isDevEmail;
      expect(isDevEmail("solo@example.com")).toBe(true);
      expect(isDevEmail("other@example.com")).toBe(false);
    });
  });
});
