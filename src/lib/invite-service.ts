import type { IInviteRepository } from "@/domain/interfaces/invite-repository";
import type { CreateInviteInput, InviteToken } from "@/domain/schemas/invite";
import { createInviteSchema } from "@/domain/schemas/invite";

export class InviteNotFoundError extends Error {
  constructor(message = "Invite not found") {
    super(message);
    this.name = "InviteNotFoundError";
  }
}

export class InviteExpiredError extends Error {
  constructor(message = "Invite has expired") {
    super(message);
    this.name = "InviteExpiredError";
  }
}

export class InviteAlreadyUsedError extends Error {
  constructor(message = "Invite has already been used") {
    super(message);
    this.name = "InviteAlreadyUsedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Access denied") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class InviteService {
  constructor(private readonly repo: IInviteRepository) {}

  async createInvite(ownerId: string, data: CreateInviteInput): Promise<InviteToken> {
    const parsed = createInviteSchema.parse(data);
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + parsed.expiresInDays * 24 * 60 * 60 * 1000);
    return this.repo.create({
      token,
      email: parsed.email,
      role: parsed.role,
      propertyId: parsed.propertyId ?? null,
      expiresAt,
      createdBy: ownerId,
    });
  }

  async validateToken(token: string): Promise<InviteToken> {
    const invite = await this.repo.findByToken(token);
    if (!invite) {throw new InviteNotFoundError();}
    if (new Date() > invite.expiresAt) {throw new InviteExpiredError();}
    if (invite.usedAt !== null) {throw new InviteAlreadyUsedError();}
    return invite;
  }

  async redeemToken(token: string): Promise<InviteToken> {
    const invite = await this.validateToken(token);
    await this.repo.markAsUsed(invite.id);
    return invite;
  }

  async listInvites(ownerId: string): Promise<InviteToken[]> {
    return this.repo.findByCreator(ownerId);
  }

  async revokeInvite(ownerId: string, inviteId: string): Promise<void> {
    const invites = await this.repo.findByCreator(ownerId);
    const invite = invites.find((i) => i.id === inviteId);
    if (!invite) {throw new ForbiddenError("Invite not found or access denied");}
    if (invite.usedAt) {throw new Error("Cannot revoke a used invite");}
    return this.repo.delete(inviteId);
  }
}
