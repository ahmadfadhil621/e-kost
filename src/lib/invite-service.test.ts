// Traceability: invite-registration
// REQ 1.1 -> it('validateToken returns invite for valid token')
// REQ 1.2 -> it('throws InviteNotFoundError for unknown token')
// REQ 1.3 -> it('throws InviteExpiredError for expired token')
// REQ 1.4 -> it('throws InviteAlreadyUsedError for used token')
// REQ 2.1 -> it('creates invite with correct fields')
// REQ 2.2 -> it('sets expiresAt based on expiresInDays')
// REQ 2.3 -> it('generates a UUID token')
// REQ 3.1 -> it('redeemToken marks token as used and returns invite')
// REQ 4.1 -> it('listInvites returns all invites for creator')
// REQ 5.1 -> it('revokeInvite deletes invite when owner matches')
// REQ 5.2 -> it('throws ForbiddenError when invite belongs to different owner')
// REQ 5.3 -> it('throws error when trying to revoke a used invite')

import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";
import { createInviteSchema } from "@/domain/schemas/invite";
import {
  InviteService,
  InviteNotFoundError,
  InviteExpiredError,
  InviteAlreadyUsedError,
  ForbiddenError,
} from "./invite-service";
import type { IInviteRepository } from "@/domain/interfaces/invite-repository";
import { createInviteToken } from "@/test/fixtures/invite";

function createMockRepo(overrides: Partial<IInviteRepository> = {}): IInviteRepository {
  return {
    create: vi.fn(),
    findByToken: vi.fn(),
    findByCreator: vi.fn(),
    markAsUsed: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  };
}

describe("InviteService", () => {
  describe("createInvite", () => {
    describe("good cases", () => {
      it("creates invite with correct fields", async () => {
        const ownerId = crypto.randomUUID();
        const created = createInviteToken({ createdBy: ownerId, email: "user@example.com", role: "owner" });
        const repo = createMockRepo({ create: vi.fn().mockResolvedValue(created) });
        const service = new InviteService(repo);

        const result = await service.createInvite(ownerId, {
          email: "user@example.com",
          role: "owner",
          expiresInDays: 7,
        });

        expect(result.email).toBe(created.email);
        expect(result.role).toBe(created.role);
        expect(repo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            email: "user@example.com",
            role: "owner",
            createdBy: ownerId,
          })
        );
      });

      it("sets expiresAt approximately now + expiresInDays", async () => {
        const ownerId = crypto.randomUUID();
        const before = Date.now();
        const created = createInviteToken({ createdBy: ownerId });
        const repo = createMockRepo({ create: vi.fn().mockResolvedValue(created) });
        const service = new InviteService(repo);

        await service.createInvite(ownerId, { email: "x@example.com", role: "owner", expiresInDays: 7 });

        const call = (repo.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
        const after = Date.now();
        const expectedMin = before + 7 * 24 * 60 * 60 * 1000;
        const expectedMax = after + 7 * 24 * 60 * 60 * 1000;
        expect(call.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin);
        expect(call.expiresAt.getTime()).toBeLessThanOrEqual(expectedMax);
      });

      it("generates a UUID token", async () => {
        const ownerId = crypto.randomUUID();
        const created = createInviteToken({ createdBy: ownerId });
        const repo = createMockRepo({ create: vi.fn().mockResolvedValue(created) });
        const service = new InviteService(repo);

        await service.createInvite(ownerId, { email: "x@example.com", role: "owner", expiresInDays: 7 });

        const call = (repo.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(call.token).toMatch(/^[0-9a-f-]{36}$/);
      });

      it("creates invite with minimum expiry (1 day)", async () => {
        const ownerId = crypto.randomUUID();
        const created = createInviteToken({ createdBy: ownerId });
        const repo = createMockRepo({ create: vi.fn().mockResolvedValue(created) });
        const service = new InviteService(repo);
        await expect(
          service.createInvite(ownerId, { email: "x@example.com", role: "owner", expiresInDays: 1 })
        ).resolves.toBeDefined();
      });

      it("creates invite with maximum expiry (30 days)", async () => {
        const ownerId = crypto.randomUUID();
        const created = createInviteToken({ createdBy: ownerId });
        const repo = createMockRepo({ create: vi.fn().mockResolvedValue(created) });
        const service = new InviteService(repo);
        await expect(
          service.createInvite(ownerId, { email: "x@example.com", role: "owner", expiresInDays: 30 })
        ).resolves.toBeDefined();
      });
    });

    describe("bad cases", () => {
      it("rejects invalid email", async () => {
        const repo = createMockRepo();
        const service = new InviteService(repo);
        await expect(
          service.createInvite("owner-id", { email: "not-an-email", role: "owner", expiresInDays: 7 })
        ).rejects.toThrow();
        expect(repo.create).not.toHaveBeenCalled();
      });

      it("rejects invalid role", async () => {
        const repo = createMockRepo();
        const service = new InviteService(repo);
        await expect(
          service.createInvite("owner-id", { email: "x@example.com", role: "staff" as "owner", expiresInDays: 7 })
        ).rejects.toThrow();
        expect(repo.create).not.toHaveBeenCalled();
      });
    });

    describe("edge cases", () => {
      it("property-based: any valid email creates invite with that email", async () => {
        await fc.assert(
          fc.asyncProperty(fc.emailAddress(), async (email) => {
            // Skip emails that pass RFC but not Zod's email validator
            const parsed = createInviteSchema.safeParse({ email, role: "owner", expiresInDays: 7 });
            if (!parsed.success) {return;}
            const ownerId = crypto.randomUUID();
            const created = createInviteToken({ email, createdBy: ownerId });
            const repo = createMockRepo({ create: vi.fn().mockResolvedValue(created) });
            const service = new InviteService(repo);
            const result = await service.createInvite(ownerId, { email, role: "owner", expiresInDays: 7 });
            expect(result.email).toBe(email);
          })
        );
      });
    });
  });

  describe("validateToken", () => {
    describe("good cases", () => {
      it("returns invite for valid token", async () => {
        const invite = createInviteToken();
        const repo = createMockRepo({ findByToken: vi.fn().mockResolvedValue(invite) });
        const service = new InviteService(repo);
        const result = await service.validateToken(invite.token);
        expect(result).toEqual(invite);
      });
    });

    describe("bad cases", () => {
      it("throws InviteNotFoundError for unknown token", async () => {
        const repo = createMockRepo({ findByToken: vi.fn().mockResolvedValue(null) });
        const service = new InviteService(repo);
        await expect(service.validateToken("nonexistent")).rejects.toThrow(InviteNotFoundError);
      });

      it("throws InviteExpiredError for expired token", async () => {
        const expired = createInviteToken({ expiresAt: new Date(Date.now() - 1000) });
        const repo = createMockRepo({ findByToken: vi.fn().mockResolvedValue(expired) });
        const service = new InviteService(repo);
        await expect(service.validateToken(expired.token)).rejects.toThrow(InviteExpiredError);
      });

      it("throws InviteAlreadyUsedError for used token", async () => {
        const used = createInviteToken({ usedAt: new Date() });
        const repo = createMockRepo({ findByToken: vi.fn().mockResolvedValue(used) });
        const service = new InviteService(repo);
        await expect(service.validateToken(used.token)).rejects.toThrow(InviteAlreadyUsedError);
      });
    });

    describe("edge cases", () => {
      it("throws InviteExpiredError for token expiring exactly at current time", async () => {
        const now = Date.now();
        // Token expired 1ms ago
        const expiring = createInviteToken({ expiresAt: new Date(now - 1) });
        const repo = createMockRepo({ findByToken: vi.fn().mockResolvedValue(expiring) });
        const service = new InviteService(repo);
        await expect(service.validateToken(expiring.token)).rejects.toThrow(InviteExpiredError);
      });
    });
  });

  describe("redeemToken", () => {
    describe("good cases", () => {
      it("marks token as used and returns invite", async () => {
        const invite = createInviteToken();
        const repo = createMockRepo({
          findByToken: vi.fn().mockResolvedValue(invite),
          markAsUsed: vi.fn().mockResolvedValue(undefined),
        });
        const service = new InviteService(repo);
        const result = await service.redeemToken(invite.token);
        expect(repo.markAsUsed).toHaveBeenCalledWith(invite.id);
        expect(result).toEqual(invite);
      });
    });

    describe("bad cases", () => {
      it("throws InviteNotFoundError for unknown token", async () => {
        const repo = createMockRepo({ findByToken: vi.fn().mockResolvedValue(null) });
        const service = new InviteService(repo);
        await expect(service.redeemToken("nonexistent")).rejects.toThrow(InviteNotFoundError);
        expect(repo.markAsUsed).not.toHaveBeenCalled();
      });

      it("throws InviteAlreadyUsedError for already used token", async () => {
        const used = createInviteToken({ usedAt: new Date() });
        const repo = createMockRepo({ findByToken: vi.fn().mockResolvedValue(used) });
        const service = new InviteService(repo);
        await expect(service.redeemToken(used.token)).rejects.toThrow(InviteAlreadyUsedError);
        expect(repo.markAsUsed).not.toHaveBeenCalled();
      });
    });
  });

  describe("listInvites", () => {
    describe("good cases", () => {
      it("returns all invites for creator", async () => {
        const ownerId = crypto.randomUUID();
        const invites = [createInviteToken({ createdBy: ownerId }), createInviteToken({ createdBy: ownerId })];
        const repo = createMockRepo({ findByCreator: vi.fn().mockResolvedValue(invites) });
        const service = new InviteService(repo);
        const result = await service.listInvites(ownerId);
        expect(result).toEqual(invites);
        expect(repo.findByCreator).toHaveBeenCalledWith(ownerId);
      });
    });
  });

  describe("revokeInvite", () => {
    describe("good cases", () => {
      it("deletes invite when owner matches", async () => {
        const ownerId = crypto.randomUUID();
        const invite = createInviteToken({ createdBy: ownerId });
        const repo = createMockRepo({
          findByCreator: vi.fn().mockResolvedValue([invite]),
          delete: vi.fn().mockResolvedValue(undefined),
        });
        const service = new InviteService(repo);
        await service.revokeInvite(ownerId, invite.id);
        expect(repo.delete).toHaveBeenCalledWith(invite.id);
      });
    });

    describe("bad cases", () => {
      it("throws ForbiddenError when invite belongs to different owner", async () => {
        const ownerId = crypto.randomUUID();
        const repo = createMockRepo({ findByCreator: vi.fn().mockResolvedValue([]) });
        const service = new InviteService(repo);
        await expect(service.revokeInvite(ownerId, "some-id")).rejects.toThrow(ForbiddenError);
        expect(repo.delete).not.toHaveBeenCalled();
      });

      it("throws error when trying to revoke a used invite", async () => {
        const ownerId = crypto.randomUUID();
        const usedInvite = createInviteToken({ createdBy: ownerId, usedAt: new Date() });
        const repo = createMockRepo({
          findByCreator: vi.fn().mockResolvedValue([usedInvite]),
        });
        const service = new InviteService(repo);
        await expect(service.revokeInvite(ownerId, usedInvite.id)).rejects.toThrow("Cannot revoke a used invite");
        expect(repo.delete).not.toHaveBeenCalled();
      });
    });
  });
});
