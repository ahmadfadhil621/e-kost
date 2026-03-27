import type { IInviteRepository } from "@/domain/interfaces/invite-repository";
import type { InviteToken } from "@/domain/schemas/invite";

// TODO: Replace stub with real implementation after schema migration adds InviteToken model.
// Run: npx prisma db push after adding InviteToken model to prisma/schema.prisma
export class PrismaInviteRepository implements IInviteRepository {
  async create(_data: {
    token: string;
    email: string;
    role: string;
    propertyId: string | null;
    expiresAt: Date;
    createdBy: string;
  }): Promise<InviteToken> {
    throw new Error(
      "InviteToken schema migration required. Add InviteToken model to prisma/schema.prisma and run: npx prisma db push"
    );
  }

  async findByToken(_token: string): Promise<InviteToken | null> {
    throw new Error("InviteToken schema migration required.");
  }

  async findByCreator(_createdBy: string): Promise<InviteToken[]> {
    throw new Error("InviteToken schema migration required.");
  }

  async markAsUsed(_id: string): Promise<void> {
    throw new Error("InviteToken schema migration required.");
  }

  async delete(_id: string): Promise<void> {
    throw new Error("InviteToken schema migration required.");
  }
}
