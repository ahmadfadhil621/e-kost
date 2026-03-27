import type { IInviteRepository } from "@/domain/interfaces/invite-repository";
import type { InviteToken } from "@/domain/schemas/invite";
import { prisma } from "@/lib/prisma";

function toInviteToken(row: {
  id: string;
  token: string;
  email: string;
  role: string;
  propertyId: string | null;
  expiresAt: Date;
  usedAt: Date | null;
  createdBy: string;
  createdAt: Date;
}): InviteToken {
  return {
    id: row.id,
    token: row.token,
    email: row.email,
    role: row.role as InviteToken["role"],
    propertyId: row.propertyId,
    expiresAt: row.expiresAt,
    usedAt: row.usedAt,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
  };
}

export class PrismaInviteRepository implements IInviteRepository {
  async create(data: {
    token: string;
    email: string;
    role: string;
    propertyId: string | null;
    expiresAt: Date;
    createdBy: string;
  }): Promise<InviteToken> {
    const created = await prisma.inviteToken.create({
      data: {
        token: data.token,
        email: data.email,
        role: data.role as "owner" | "staff",
        propertyId: data.propertyId ?? null,
        expiresAt: data.expiresAt,
        createdBy: data.createdBy,
      },
    });
    return toInviteToken(created);
  }

  async findByToken(token: string): Promise<InviteToken | null> {
    const row = await prisma.inviteToken.findUnique({ where: { token } });
    return row ? toInviteToken(row) : null;
  }

  async findByCreator(createdBy: string): Promise<InviteToken[]> {
    const rows = await prisma.inviteToken.findMany({
      where: { createdBy },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toInviteToken);
  }

  async markAsUsed(id: string): Promise<void> {
    await prisma.inviteToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.inviteToken.delete({ where: { id } });
  }
}
