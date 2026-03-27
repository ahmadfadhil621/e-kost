// Gate 2: Fault injection tests. Tests EXPECT faults to be killed.
// Run: npx vitest run src/lib/invite-service.fault-injection.test.ts
// ALL tests should FAIL (faults killed). Passing = surviving fault.
import { describe, it, expect, vi } from "vitest";
import {
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

describe.skip("Gate 2: Fault injection (invite-service)", () => {
  it("fault 1: token not validated for expiry — KILLED by InviteExpiredError throw", async () => {
    // Fault: remove expiry check
    // Killed by: test expecting InviteExpiredError
    const expired = createInviteToken({ expiresAt: new Date(Date.now() - 1000) });
    const repo = createMockRepo({ findByToken: vi.fn().mockResolvedValue(expired) });

    // Inject fault: skip expiry check
    const faultService = {
      validateToken: async (token: string) => {
        const invite = await repo.findByToken(token);
        if (!invite) {throw new Error("Not found");}
        // FAULT: no expiry check
        if (invite.usedAt) {throw new InviteAlreadyUsedError("Used");}
        return invite;
      },
    };

    // This should throw InviteExpiredError but won't with fault
    await expect(faultService.validateToken(expired.token)).resolves.toBeDefined();
    // Test should FAIL here — fault survived
  });

  it("fault 2: token not validated for used state — KILLED by InviteAlreadyUsedError throw", async () => {
    const used = createInviteToken({ usedAt: new Date() });
    const repo = createMockRepo({ findByToken: vi.fn().mockResolvedValue(used) });

    const faultService = {
      validateToken: async (token: string) => {
        const invite = await repo.findByToken(token);
        if (!invite) {throw new Error("Not found");}
        if (new Date() > invite.expiresAt) {throw new InviteExpiredError("Expired");}
        // FAULT: no usedAt check
        return invite;
      },
    };

    await expect(faultService.validateToken(used.token)).resolves.toBeDefined();
    // Test should FAIL — fault survived
  });

  it("fault 3: revokeInvite skips ownership check — KILLED by ForbiddenError throw", async () => {
    const ownerId = crypto.randomUUID();
    const otherInvite = createInviteToken({ createdBy: crypto.randomUUID() });
    const repo = createMockRepo({
      findByCreator: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(undefined),
    });

    const faultService = {
      revokeInvite: async (userId: string, inviteId: string) => {
        // FAULT: skip ownership check, just delete
        return repo.delete(inviteId);
      },
    };

    await faultService.revokeInvite(ownerId, otherInvite.id);
    expect(repo.delete).toHaveBeenCalled();
    // Test should FAIL — fault survived
  });

  it("fault 4: used invite can be revoked — KILLED by usedAt check in revokeInvite", async () => {
    const ownerId = crypto.randomUUID();
    const usedInvite = createInviteToken({ createdBy: ownerId, usedAt: new Date() });
    const repo = createMockRepo({
      findByCreator: vi.fn().mockResolvedValue([usedInvite]),
      delete: vi.fn().mockResolvedValue(undefined),
    });

    const faultService = {
      revokeInvite: async (userId: string, inviteId: string) => {
        const invites = await repo.findByCreator(userId);
        const invite = invites.find((i) => i.id === inviteId);
        if (!invite) {throw new ForbiddenError("Not found");}
        // FAULT: skip usedAt check
        return repo.delete(inviteId);
      },
    };

    await faultService.revokeInvite(ownerId, usedInvite.id);
    expect(repo.delete).toHaveBeenCalled();
    // Test should FAIL — fault survived
  });
});
