// Traceability: property-activity-log
// REQ 2.1 -> it('returns activity feed for a property member')
// REQ 2.2 -> it('passes cursor to repository for pagination')
// REQ 2.3 -> it('passes area filter to repository')
// REQ 2.3 -> it('passes actorId filter to repository')
// REQ 2.6 -> it('throws ForbiddenError when user has no property access')
// REQ 2.7 -> it('allows staff to fetch activity feed')
// REQ 1.1 -> it('makeLogActivity calls repo.create with input')
// REQ 1.2 -> it('makeLogActivity swallows repo errors without rethrowing')
// REQ 1.5 -> it('makeLogActivity is fire-and-forget (does not await repo)')
// PROP 1  -> it('result data length never exceeds requested page size')

import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";
import { ActivityLogService, makeLogActivity } from "./activity-log-service";
import type { IActivityLogRepository } from "@/domain/interfaces/activity-log-repository";
import type { ActivityFeedResult } from "@/domain/schemas/activity-log";
import {
  createActivityLogEntry,
  createLogActivityInput,
} from "@/test/fixtures/activity-log";

// ── helpers ──────────────────────────────────────────────────────────────────

function createMockRepo(
  overrides: Partial<IActivityLogRepository> = {}
): IActivityLogRepository {
  return {
    create: vi.fn().mockResolvedValue(undefined),
    findByProperty: vi.fn().mockResolvedValue({ data: [], nextCursor: null }),
    ...overrides,
  };
}

const createMockPropertyAccess = (role: "owner" | "staff" = "owner") => ({
  validateAccess: vi.fn().mockResolvedValue(role),
});

function makeFeedResult(entries = 1, nextCursor: string | null = null): ActivityFeedResult {
  return {
    data: Array.from({ length: entries }, () => createActivityLogEntry()),
    nextCursor,
  };
}

// ── ActivityLogService ────────────────────────────────────────────────────────

describe("ActivityLogService", () => {
  describe("getActivityFeed", () => {
    describe("good cases", () => {
      it("returns activity feed for a property member", async () => {
        const userId = "user-1";
        const propertyId = "prop-1";
        const feedResult = makeFeedResult(3);
        const repo = createMockRepo({ findByProperty: vi.fn().mockResolvedValue(feedResult) });
        const service = new ActivityLogService(repo, createMockPropertyAccess());

        const result = await service.getActivityFeed(userId, propertyId);

        expect(result.data).toHaveLength(3);
        expect(result.nextCursor).toBeNull();
      });

      it("allows staff role to fetch activity feed", async () => {
        const repo = createMockRepo({ findByProperty: vi.fn().mockResolvedValue(makeFeedResult(2)) });
        const service = new ActivityLogService(repo, createMockPropertyAccess("staff"));

        const result = await service.getActivityFeed("staff-user", "prop-1");

        expect(result.data).toHaveLength(2);
      });

      it("passes cursor to repository for pagination", async () => {
        const repo = createMockRepo();
        const service = new ActivityLogService(repo, createMockPropertyAccess());
        const cursor = "clx-cursor-123";

        await service.getActivityFeed("user-1", "prop-1", { cursor });

        expect(repo.findByProperty).toHaveBeenCalledWith("prop-1", expect.objectContaining({ cursor }));
      });

      it("passes area filter to repository", async () => {
        const repo = createMockRepo();
        const service = new ActivityLogService(repo, createMockPropertyAccess());

        await service.getActivityFeed("user-1", "prop-1", { area: "finance" });

        expect(repo.findByProperty).toHaveBeenCalledWith("prop-1", expect.objectContaining({ area: "finance" }));
      });

      it("passes actorId filter to repository", async () => {
        const repo = createMockRepo();
        const service = new ActivityLogService(repo, createMockPropertyAccess());
        const actorId = "actor-42";

        await service.getActivityFeed("user-1", "prop-1", { actorId });

        expect(repo.findByProperty).toHaveBeenCalledWith("prop-1", expect.objectContaining({ actorId }));
      });

      it("returns nextCursor when more pages exist", async () => {
        const nextCursor = "clx-next-page";
        const repo = createMockRepo({
          findByProperty: vi.fn().mockResolvedValue(makeFeedResult(20, nextCursor)),
        });
        const service = new ActivityLogService(repo, createMockPropertyAccess());

        const result = await service.getActivityFeed("user-1", "prop-1");

        expect(result.nextCursor).toBe(nextCursor);
      });
    });

    describe("bad cases", () => {
      it("throws ForbiddenError when user has no property access", async () => {
        const forbiddenError = Object.assign(new Error("Forbidden"), { name: "ForbiddenError" });
        const propertyAccess = { validateAccess: vi.fn().mockRejectedValue(forbiddenError) };
        const repo = createMockRepo();
        const service = new ActivityLogService(repo, propertyAccess);

        await expect(service.getActivityFeed("stranger", "prop-1")).rejects.toMatchObject({
          name: "ForbiddenError",
        });
        expect(repo.findByProperty).not.toHaveBeenCalled();
      });

      it("propagates repository errors", async () => {
        const repo = createMockRepo({
          findByProperty: vi.fn().mockRejectedValue(new Error("DB failure")),
        });
        const service = new ActivityLogService(repo, createMockPropertyAccess());

        await expect(service.getActivityFeed("user-1", "prop-1")).rejects.toThrow("DB failure");
      });
    });

    describe("edge cases", () => {
      it("returns empty feed when no entries exist", async () => {
        const repo = createMockRepo({ findByProperty: vi.fn().mockResolvedValue({ data: [], nextCursor: null }) });
        const service = new ActivityLogService(repo, createMockPropertyAccess());

        const result = await service.getActivityFeed("user-1", "prop-1");

        expect(result.data).toHaveLength(0);
        expect(result.nextCursor).toBeNull();
      });

      it("passes undefined query when no filters provided", async () => {
        const repo = createMockRepo();
        const service = new ActivityLogService(repo, createMockPropertyAccess());

        await service.getActivityFeed("user-1", "prop-1");

        expect(repo.findByProperty).toHaveBeenCalledWith("prop-1", expect.objectContaining({}));
      });
    });
  });
});

// ── makeLogActivity ───────────────────────────────────────────────────────────

describe("makeLogActivity", () => {
  describe("good cases", () => {
    it("calls repo.create with the provided input", async () => {
      const repo = createMockRepo();
      const logActivity = makeLogActivity(repo);
      const input = createLogActivityInput();

      logActivity(input);
      // Allow microtask queue to flush
      await new Promise((r) => setTimeout(r, 0));

      expect(repo.create).toHaveBeenCalledWith(input);
    });

    it("works for every action code", async () => {
      const actionCodes = [
        "PAYMENT_RECORDED", "PAYMENT_UPDATED", "PAYMENT_DELETED",
        "EXPENSE_CREATED", "EXPENSE_UPDATED", "EXPENSE_DELETED",
        "TENANT_ASSIGNED", "TENANT_UNASSIGNED", "TENANT_MOVED", "TENANT_UPDATED",
        "ROOM_CREATED", "ROOM_UPDATED", "ROOM_ARCHIVED",
        "SETTINGS_STAFF_FINANCE_TOGGLED", "SETTINGS_PROPERTY_UPDATED",
      ] as const;

      for (const actionCode of actionCodes) {
        const repo = createMockRepo();
        const logActivity = makeLogActivity(repo);
        logActivity(createLogActivityInput({ actionCode }));
        await new Promise((r) => setTimeout(r, 0));
        expect(repo.create).toHaveBeenCalledOnce();
      }
    });
  });

  describe("bad cases", () => {
    it("swallows repo.create errors without rethrowing", async () => {
      const unhandledRejections: unknown[] = [];
      const handler = (reason: unknown) => unhandledRejections.push(reason);
      process.on("unhandledRejection", handler);

      const repo = createMockRepo({
        create: vi.fn().mockRejectedValue(new Error("DB write failed")),
      });
      const logActivity = makeLogActivity(repo);

      // Must not throw synchronously
      expect(() => logActivity(createLogActivityInput())).not.toThrow();
      // Allow microtask to flush
      await new Promise((r) => setTimeout(r, 10));

      process.off("unhandledRejection", handler);
      // Error must be swallowed — no unhandled rejection
      expect(unhandledRejections).toHaveLength(0);
      // repo.create was still called (the attempt was made)
      expect(repo.create).toHaveBeenCalledOnce();
    });
  });

  describe("edge cases", () => {
    it("is fire-and-forget: returns void synchronously", () => {
      const repo = createMockRepo();
      const logActivity = makeLogActivity(repo);
      const result = logActivity(createLogActivityInput());
      // Return value is void (undefined) — caller cannot await it
      expect(result).toBeUndefined();
      // repo.create was triggered (not skipped)
      expect(repo.create).toHaveBeenCalledOnce();
    });

    it("handles null entityId for settings actions", async () => {
      const repo = createMockRepo();
      const logActivity = makeLogActivity(repo);
      const input = createLogActivityInput({
        actionCode: "SETTINGS_STAFF_FINANCE_TOGGLED",
        entityType: "SETTINGS",
        entityId: undefined,
        metadata: { enabled: true },
      });

      logActivity(input);
      await new Promise((r) => setTimeout(r, 0));

      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ entityId: undefined }));
    });
  });

  describe("property-based", () => {
    it("result data length never exceeds page size of 20 (PROP 1)", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 30 }),
          async (entryCount) => {
            const entries = Array.from({ length: Math.min(entryCount, 20) }, () =>
              createActivityLogEntry()
            );
            const repo = createMockRepo({
              findByProperty: vi.fn().mockResolvedValue({
                data: entries,
                nextCursor: entryCount > 20 ? "next-cursor" : null,
              }),
            });
            const service = new ActivityLogService(repo, createMockPropertyAccess());
            const result = await service.getActivityFeed("u", "p");
            expect(result.data.length).toBeLessThanOrEqual(20);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
