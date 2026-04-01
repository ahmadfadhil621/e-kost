import type { InviteToken } from "@/domain/schemas/invite";

export function createInviteToken(overrides: Partial<InviteToken> = {}): InviteToken {
  return {
    id: crypto.randomUUID(),
    token: crypto.randomUUID(),
    email: "invited@example.com",
    role: "owner",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    usedAt: null,
    createdBy: crypto.randomUUID(),
    createdAt: new Date(),
    ...overrides,
  };
}
