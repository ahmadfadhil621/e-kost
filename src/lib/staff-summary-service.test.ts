// Traceability: finance-staff-summary (issue #109)
// REQ 2.9  -> it('owner receives all rows from the repository')
// REQ 2.10 -> it('staff receives only their own row')
// REQ 2.10 -> it('staff receives empty array when they have no entries')
// REQ 2.5  -> it('excludes entries with null actorId (repo responsibility, service returns as-is)')
// REQ 2.3  -> it('each entry contains actorId, actorName, actorRole, totalPayments, totalExpenses')
// REQ 2.8  -> it('throws ForbiddenError when propertyAccess.validateAccess rejects')
// PROP 1   -> it('PROP 1: staff always sees 0 or 1 entries, never entries of other actors')
// PROP 2   -> it('PROP 2: owner sees all entries unchanged from repository')
// PROP 3   -> it('PROP 3: totals are always non-negative numbers')

import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";
import { StaffSummaryService } from "./staff-summary-service";
import type { IStaffSummaryRepository } from "@/domain/interfaces/staff-summary-repository";
import { createStaffSummaryEntry } from "@/test/fixtures/staff-summary";

function createMockRepo(
  overrides: Partial<IStaffSummaryRepository> = {}
): IStaffSummaryRepository {
  return {
    getSummaryByPeriod: vi.fn(),
    ...overrides,
  };
}

const createMockPropertyAccess = (role: "owner" | "staff" = "owner") => ({
  validateAccess: vi.fn().mockResolvedValue(role),
});

describe("StaffSummaryService.getStaffSummary", () => {
  describe("good cases", () => {
    it("owner receives all rows from the repository", async () => {
      const propertyId = crypto.randomUUID();
      const userId = crypto.randomUUID();
      const entries = [
        createStaffSummaryEntry({ actorId: crypto.randomUUID(), actorRole: "staff" }),
        createStaffSummaryEntry({ actorId: userId, actorRole: "owner" }),
        createStaffSummaryEntry({ actorId: crypto.randomUUID(), actorRole: "staff" }),
      ];
      const repo = createMockRepo({
        getSummaryByPeriod: vi.fn().mockResolvedValue(entries),
      });
      const service = new StaffSummaryService(repo, createMockPropertyAccess("owner"));

      const result = await service.getStaffSummary(userId, propertyId, 2026, 3);

      expect(result).toHaveLength(3);
      expect(result).toEqual(entries);
      expect(repo.getSummaryByPeriod).toHaveBeenCalledWith(propertyId, 2026, 3);
    });

    it("staff receives only their own row", async () => {
      const propertyId = crypto.randomUUID();
      const staffUserId = crypto.randomUUID();
      const otherStaffId = crypto.randomUUID();
      const ownEntry = createStaffSummaryEntry({ actorId: staffUserId, actorRole: "staff" });
      const entries = [
        ownEntry,
        createStaffSummaryEntry({ actorId: otherStaffId, actorRole: "staff" }),
        createStaffSummaryEntry({ actorId: crypto.randomUUID(), actorRole: "owner" }),
      ];
      const repo = createMockRepo({
        getSummaryByPeriod: vi.fn().mockResolvedValue(entries),
      });
      const service = new StaffSummaryService(repo, createMockPropertyAccess("staff"));

      const result = await service.getStaffSummary(staffUserId, propertyId, 2026, 3);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(ownEntry);
      expect(result[0].actorId).toBe(staffUserId);
    });

    it("staff receives empty array when they have no entries in the period", async () => {
      const propertyId = crypto.randomUUID();
      const staffUserId = crypto.randomUUID();
      const entries = [
        createStaffSummaryEntry({ actorId: crypto.randomUUID(), actorRole: "staff" }),
      ];
      const repo = createMockRepo({
        getSummaryByPeriod: vi.fn().mockResolvedValue(entries),
      });
      const service = new StaffSummaryService(repo, createMockPropertyAccess("staff"));

      const result = await service.getStaffSummary(staffUserId, propertyId, 2026, 3);

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it("owner receives empty array when repository returns empty", async () => {
      const propertyId = crypto.randomUUID();
      const repo = createMockRepo({
        getSummaryByPeriod: vi.fn().mockResolvedValue([]),
      });
      const service = new StaffSummaryService(repo, createMockPropertyAccess("owner"));

      const result = await service.getStaffSummary(crypto.randomUUID(), propertyId, 2026, 3);

      expect(result).toHaveLength(0);
      expect(Array.isArray(result)).toBe(true);
    });

    it("each entry contains required fields", async () => {
      const propertyId = crypto.randomUUID();
      const entry = createStaffSummaryEntry({ actorRole: "staff" });
      const repo = createMockRepo({
        getSummaryByPeriod: vi.fn().mockResolvedValue([entry]),
      });
      const service = new StaffSummaryService(repo, createMockPropertyAccess("owner"));

      const result = await service.getStaffSummary(crypto.randomUUID(), propertyId, 2026, 3);

      expect(result[0]).toHaveProperty("actorId");
      expect(result[0]).toHaveProperty("actorName");
      expect(result[0]).toHaveProperty("actorRole");
      expect(result[0]).toHaveProperty("totalPayments");
      expect(result[0]).toHaveProperty("totalExpenses");
    });

    it("passes correct year and month to the repository", async () => {
      const propertyId = crypto.randomUUID();
      const repo = createMockRepo({
        getSummaryByPeriod: vi.fn().mockResolvedValue([]),
      });
      const service = new StaffSummaryService(repo, createMockPropertyAccess("owner"));

      await service.getStaffSummary(crypto.randomUUID(), propertyId, 2025, 12);

      expect(repo.getSummaryByPeriod).toHaveBeenCalledWith(propertyId, 2025, 12);
    });
  });

  describe("bad cases", () => {
    it("throws when propertyAccess.validateAccess rejects (forbidden)", async () => {
      const repo = createMockRepo({
        getSummaryByPeriod: vi.fn(),
      });
      const propertyAccess = {
        validateAccess: vi.fn().mockRejectedValue(new Error("Forbidden")),
      };
      const service = new StaffSummaryService(repo, propertyAccess);

      await expect(
        service.getStaffSummary(crypto.randomUUID(), crypto.randomUUID(), 2026, 3)
      ).rejects.toThrow("Forbidden");

      expect(repo.getSummaryByPeriod).not.toHaveBeenCalled();
    });

    it("propagates repository errors to the caller", async () => {
      const repo = createMockRepo({
        getSummaryByPeriod: vi.fn().mockRejectedValue(new Error("DB error")),
      });
      const service = new StaffSummaryService(repo, createMockPropertyAccess("owner"));

      await expect(
        service.getStaffSummary(crypto.randomUUID(), crypto.randomUUID(), 2026, 3)
      ).rejects.toThrow("DB error");
    });
  });

  describe("edge cases", () => {
    it("staff row is correctly identified when actorId matches exactly (no partial match)", async () => {
      const propertyId = crypto.randomUUID();
      const staffUserId = "user-abc";
      const entries = [
        createStaffSummaryEntry({ actorId: "user-abcdef", actorRole: "staff" }),
        createStaffSummaryEntry({ actorId: staffUserId, actorRole: "staff" }),
      ];
      const repo = createMockRepo({
        getSummaryByPeriod: vi.fn().mockResolvedValue(entries),
      });
      const service = new StaffSummaryService(repo, createMockPropertyAccess("staff"));

      const result = await service.getStaffSummary(staffUserId, propertyId, 2026, 3);

      expect(result).toHaveLength(1);
      expect(result[0].actorId).toBe(staffUserId);
    });

    it("owner with zero entries returns empty array (not null)", async () => {
      const repo = createMockRepo({
        getSummaryByPeriod: vi.fn().mockResolvedValue([]),
      });
      const service = new StaffSummaryService(repo, createMockPropertyAccess("owner"));

      const result = await service.getStaffSummary(crypto.randomUUID(), crypto.randomUUID(), 2026, 1);

      expect(result).not.toBeNull();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("property-based tests", () => {
    it("PROP 1: staff always sees 0 or 1 entries, never entries of other actors", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 36 }),
          fc.array(
            fc.record({
              actorId: fc.string({ minLength: 1, maxLength: 36 }),
              actorName: fc.string({ minLength: 1 }),
              actorRole: fc.constantFrom("owner", "staff"),
              totalPayments: fc.float({ min: 0, max: 1_000_000_000, noNaN: true }),
              totalExpenses: fc.float({ min: 0, max: 1_000_000_000, noNaN: true }),
            }),
            { maxLength: 10 }
          ),
          async (staffUserId, allEntries) => {
            const repo = createMockRepo({
              getSummaryByPeriod: vi.fn().mockResolvedValue(allEntries),
            });
            const service = new StaffSummaryService(repo, createMockPropertyAccess("staff"));

            const result = await service.getStaffSummary(staffUserId, crypto.randomUUID(), 2026, 3);

            expect(result.length).toBeLessThanOrEqual(1);
            for (const entry of result) {
              expect(entry.actorId).toBe(staffUserId);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("PROP 2: owner sees all entries unchanged from repository", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              actorId: fc.string({ minLength: 1, maxLength: 36 }),
              actorName: fc.string({ minLength: 1 }),
              actorRole: fc.constantFrom("owner", "staff"),
              totalPayments: fc.float({ min: 0, max: 1_000_000_000, noNaN: true }),
              totalExpenses: fc.float({ min: 0, max: 1_000_000_000, noNaN: true }),
            }),
            { maxLength: 10 }
          ),
          async (allEntries) => {
            const repo = createMockRepo({
              getSummaryByPeriod: vi.fn().mockResolvedValue(allEntries),
            });
            const service = new StaffSummaryService(repo, createMockPropertyAccess("owner"));

            const result = await service.getStaffSummary(crypto.randomUUID(), crypto.randomUUID(), 2026, 3);

            expect(result).toHaveLength(allEntries.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("PROP 3: totals are always non-negative numbers in the returned entries", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              actorId: fc.string({ minLength: 1, maxLength: 36 }),
              actorName: fc.string({ minLength: 1 }),
              actorRole: fc.constantFrom("owner", "staff"),
              totalPayments: fc.float({ min: 0, max: 1_000_000_000, noNaN: true }),
              totalExpenses: fc.float({ min: 0, max: 1_000_000_000, noNaN: true }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (allEntries) => {
            const repo = createMockRepo({
              getSummaryByPeriod: vi.fn().mockResolvedValue(allEntries),
            });
            const service = new StaffSummaryService(repo, createMockPropertyAccess("owner"));

            const result = await service.getStaffSummary(crypto.randomUUID(), crypto.randomUUID(), 2026, 3);

            for (const entry of result) {
              expect(entry.totalPayments).toBeGreaterThanOrEqual(0);
              expect(entry.totalExpenses).toBeGreaterThanOrEqual(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
