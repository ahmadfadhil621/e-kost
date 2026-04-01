import type { InviteToken } from "@/domain/schemas/invite";

export interface IInviteRepository {
  create(data: {
    token: string;
    email: string;
    role: string;
    expiresAt: Date;
    createdBy: string;
  }): Promise<InviteToken>;
  findByToken(token: string): Promise<InviteToken | null>;
  findByCreator(createdBy: string): Promise<InviteToken[]>;
  markAsUsed(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}
